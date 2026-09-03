import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

import { VIEWPORTS as configViewports, SIDEKICK_CONFIG, COVEO_MOCKED_BLOCKS, COVEO_ROUTE_GLOBS } from './config.js';

const VIEWPORTS = (configViewports || [
  { width: '320px', height: '568px', label: 'mobile' },
  { width: '768px', height: '1024px', label: 'tablet' },
  { width: '1024px', height: '768px', label: 'desktop' },
  { width: '1440px', height: '900px', label: 'large' },
]);

// remove px from width and height and convert to number
VIEWPORTS.forEach((viewport) => {
  viewport.width = parseInt(viewport.width.replace('px', ''), 10);
  viewport.height = parseInt(viewport.height.replace('px', ''), 10);
});

// Use configurable templates path
const TEMPLATES_PATH = SIDEKICK_CONFIG?.templatesPath || '/tools/sidekick/library/templates/';

// Timeout constants
const SELECTOR_TIMEOUT = 30000;
const RENDER_TIMEOUT = 3000;
const LAYOUT_TIMEOUT = 1000;

async function fetchLibraryBlocks() {
  // Launch a headless browser
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the library page with blocks plugin active
  const baseURL = process.env.BASE_URL || 'http://localhost:3000';
  await page.goto(`${baseURL}/tools/sidekick/library.html?plugin=blocks`);

  // Wait for the sidekick-library component to load
  await page.waitForSelector('sidekick-library', { timeout: SELECTOR_TIMEOUT });

  // Wait for the blocks to be loaded in the plugin
  await page.waitForSelector('sp-sidenav[data-testid="blocks"]', { timeout: SELECTOR_TIMEOUT });

  // Give it some time to fully load and render blocks
  await page.waitForTimeout(RENDER_TIMEOUT);

  // Extract block information from the DOM
  const blocks = await page.evaluate((templatesPath) => {
    function querySelectorAllDeep(selector, root = document) {
      const results = [];

      function findAll(node) {
        // Check if current node matches (only for elements)
        if (node.nodeType === Node.ELEMENT_NODE && node.matches && node.matches(selector)) {
          results.push(node);
        }

        // Search in shadow DOM if present
        if (node.shadowRoot) {
          findAll(node.shadowRoot);
        }

        // Recursively search child elements
        if (node.children) {
          Array.from(node.children).forEach((child) => findAll(child));
        }
      }
      findAll(root);
      return results;
    }

    // Find the sidenav element that contains the blocks
    const sidenav = querySelectorAllDeep('sp-sidenav[data-testid="blocks"]');
    if (!sidenav) return [];

    // Get all top-level sidenav items (these are the block categories)
    const variations = querySelectorAllDeep('sp-sidenav > sp-sidenav-item > sp-sidenav-item.descendant');

    // Array to store all blocks
    const blocksList = [];

    // Process each block parent item
    variations.forEach((variationItem) => {
      // Get the block name from the label attribute
      const blockName = variationItem.parentElement.getAttribute('label');
      // Add the block with its variations
      blocksList.push({
        name: blockName,
        variationName: variationItem.getAttribute('label'),
        path: `${templatesPath}${blockName.toLowerCase()}`,
        variationIndex: variationItem.getAttribute('data-index'),
      });
    });

    return blocksList;
  }, TEMPLATES_PATH);

  // Close the browser
  await browser.close();
  return blocks;
}

function generateTestSpec(blockName, blockVariations) {
  const blockSlug = blockName.toLowerCase().replace(/\s+/g, '-');
  const isCoveoMocked = COVEO_MOCKED_BLOCKS.includes(blockSlug);

  const imports = isCoveoMocked
    ? 'import { test, expect } from \'@playwright/test\';\n'
      + 'import path from \'path\';\n'
      + 'import { fileURLToPath } from \'url\';\n\n'
      + 'const __dirname = path.dirname(fileURLToPath(import.meta.url));\n\n'
    : 'import { test, expect } from \'@playwright/test\';\n\n';

  const mockRouteCalls = COVEO_ROUTE_GLOBS
    .map((glob) => `    await page.routeFromHAR(path.join(__dirname, '${blockSlug}.har'), { url: '${glob}', notFound: 'abort' });\n`)
    .join('');
  const coveoMockSetup = isCoveoMocked
    ? `\n    // Replay recorded Coveo responses (EXLM visual tests): live search results drift over time
    // and would make this test flaky. Refresh with:
    //   node tools/visual-tests/record-coveo-har.js ${blockSlug}
${mockRouteCalls}`
    : '';

  // Variations can share the same label (e.g. two "Default" entries); Playwright
  // requires unique test titles, so disambiguate duplicates with their variation index.
  const nameCounts = blockVariations.reduce((counts, block) => {
    counts.set(block.variationName, (counts.get(block.variationName) ?? 0) + 1);
    return counts;
  }, new Map());

  const testContent = blockVariations.flatMap((block) => {
    const testName = nameCounts.get(block.variationName) > 1
      ? `${block.variationName} (${block.variationIndex}) visual test`
      : `${block.variationName} visual test`;

    // Some labels carry a parenthetical path suffix, e.g. "BlockName (something-12)",
    // where the real template folder is actually "something-12-blockname".
    const parenMatch = block.name.match(/\(([^)]*)\)/);
    const cleanSlug = block.name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase().replace(/\s+/g, '-');
    const gotoPath = parenMatch ? `${TEMPLATES_PATH}${parenMatch[1].trim()}-${cleanSlug}` : block.path;

    // Generate tests for each viewport for this block variation
    const viewportTests = VIEWPORTS.map((viewport) => `  test('${testName} at ${viewport.label} viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: ${viewport.width}, height: ${viewport.height} });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=${gotoPath}&index=${block.variationIndex}&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: ${SELECTOR_TIMEOUT} });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: ${SELECTOR_TIMEOUT} });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.${block.name.toLowerCase().replace(/\s+/g, '-')}', { timeout: ${SELECTOR_TIMEOUT}, state: 'visible' });

    // Small delay to ensure layout is stable${viewport.label === 'tablet' ? ' after breakpoint transition' : ''}
    await page.waitForTimeout(${LAYOUT_TIMEOUT});

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for ${block.name}');

    await page.setViewportSize({
      width: ${viewport.width},
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = '${block.name.toLowerCase().replace(/\s+/g, '-')}-${block.variationIndex}-${viewport.label}.png';
    const screenshot = await page.screenshot({
      clip: box,
      timeout: ${SELECTOR_TIMEOUT},
      animations: 'disabled',
      type: 'png',
    });

    // Use strict visual comparison settings for detecting color and layout changes
    expect(screenshot).toMatchSnapshot(screenshotName, {
      maxDiffPixels: 50,         // Reduced tolerance for better sensitivity
      threshold: 0.05,            // 5% color difference tolerance (more sensitive)
      maxDiffPixelRatio: 0.005,  // 0.5% of total pixels tolerance
    });
  });`);

    return viewportTests;
  }).join('\n');

  return `${imports}test.describe('${blockName} Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set default viewport size
    await page.setViewportSize({ width: 1280, height: 2000 });
${coveoMockSetup}  });

${testContent}
});`;
}

async function generateVisualTests() {
  // Fetch library blocks
  const blocks = await fetchLibraryBlocks();
  if (blocks.length === 0) {
    throw new Error('No blocks found in library. Check that the sidekick library is set up and pages are published.');
  }

  // Group blocks by their name
  const blocksByName = blocks.reduce((acc, block) => {
    if (!acc[block.name]) {
      acc[block.name] = [];
    }
    acc[block.name].push(block);
    return acc;
  }, {});

  // Create blocks directory
  const blocksDir = 'tools/visual-tests/blocks';
  if (!fs.existsSync(blocksDir)) {
    fs.mkdirSync(blocksDir, { recursive: true });
  }

  // Generate separate test file for each block
  let totalTests = 0;
  Object.entries(blocksByName).forEach(([blockName, blockVariations]) => {
    // Create block-specific directory
    const blockDir = path.join(blocksDir, blockName.toLowerCase().replace(/\s+/g, '-'));
    if (!fs.existsSync(blockDir)) {
      fs.mkdirSync(blockDir, { recursive: true });
    }

    // Generate test spec content for this block
    const testSpec = generateTestSpec(blockName, blockVariations);

    // Write to block-specific test file
    const testFileName = `${blockName.toLowerCase().replace(/\s+/g, '-')}.spec.js`;
    fs.writeFileSync(path.join(blockDir, testFileName), testSpec);

    totalTests += blockVariations.length;
    console.log(`Generated test file: blocks/${blockName.toLowerCase().replace(/\s+/g, '-')}/${testFileName}`);
  });

  console.log(`\nSuccessfully generated ${totalTests} test variations across ${Object.keys(blocksByName).length} blocks`);
}

// Run the generator
generateVisualTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
