import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

import { VIEWPORTS as configViewports, SIDEKICK_CONFIG, EXCLUDED_BLOCKS } from './config.js';

const VIEWPORTS = configViewports || [
  { width: '320px', height: '568px', label: 'mobile' },
  { width: '768px', height: '1024px', label: 'tablet' },
  { width: '1024px', height: '768px', label: 'desktop' },
  { width: '1440px', height: '900px', label: 'large' },
];

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

function getBlockSlug(blockName) {
  return blockName.toLowerCase().replace(/\s+/g, '-');
}

function normalizeBlockFilter(blockFilter) {
  const normalizedFilter = blockFilter
    .trim()
    .replace(/[\\/]+$/, '')
    .split(/[\\/]/)
    .pop()
    .toLowerCase()
    .replace(/\s+/g, '-');
  if (!/^[a-z0-9-]+$/.test(normalizedFilter)) {
    throw new Error(`Invalid block name "${blockFilter}". Use a block slug like "accordion" or "announcement-ribbon".`);
  }
  return normalizedFilter;
}

function getBlockFilter(args = process.argv.slice(2)) {
  const blockFlagIndex = args.findIndex((arg) => arg === '--block' || arg === '-b');
  if (blockFlagIndex !== -1) {
    const blockName = args[blockFlagIndex + 1];
    if (!blockName) {
      throw new Error('Missing block name after --block.');
    }
    return normalizeBlockFilter(blockName);
  }

  const blockArg = args.find((arg) => arg.startsWith('--block='));
  if (blockArg) {
    return normalizeBlockFilter(blockArg.slice('--block='.length));
  }

  const positionalBlock = args.find((arg) => !arg.startsWith('-'));
  return positionalBlock ? normalizeBlockFilter(positionalBlock) : null;
}

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

function quote(value) {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

function generateTestSpec(blockName, blockVariations) {
  const blockSlug = getBlockSlug(blockName);

  // Variations can share the same label (e.g. two "Default" entries); Playwright
  // requires unique test titles, so disambiguate duplicates with their variation index.
  const nameCounts = blockVariations.reduce((counts, block) => {
    counts.set(block.variationName, (counts.get(block.variationName) ?? 0) + 1);
    return counts;
  }, new Map());

  const testContent = blockVariations
    .flatMap((block) => {
      const testName =
        nameCounts.get(block.variationName) > 1
          ? `${block.variationName} (${block.variationIndex}) visual test`
          : `${block.variationName} visual test`;

      // Some labels carry a parenthetical path suffix, e.g. "BlockName (something-12)",
      // where the real template folder is actually "something-12-blockname".
      const parenMatch = block.name.match(/\(([^)]*)\)/);
      const cleanSlug = block.name
        .replace(/\s*\([^)]*\)/g, '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-');
      const gotoPath = parenMatch ? `${TEMPLATES_PATH}${parenMatch[1].trim()}-${cleanSlug}` : block.path;
      const url = `/tools/sidekick/library.html?plugin=blocks&path=${gotoPath}&index=${block.variationIndex}&vtest=true`;

      return VIEWPORTS.map(
        (viewport) => `  test(${quote(`${testName} at ${viewport.label} viewport`)}, async ({ page }) => {
    await runBlockVisualTest(page, {
      blockSlug: BLOCK_SLUG,
      url: '${url}',
      viewport: { width: ${viewport.width}, height: ${viewport.height} },
      screenshotName: '${blockSlug}-${block.variationIndex}-${viewport.label}.png',
    });
  });`,
      );
    })
    .join('\n\n');

  return `// Generated by tools/visual-tests/generate-visual-tests.js -- do not edit by hand.
// Readiness/stubbing logic lives in tools/visual-tests/spec-helpers.js.
import { test } from '@playwright/test';
import runBlockVisualTest from '../../spec-helpers.js';

const BLOCK_SLUG = '${blockSlug}';

test.describe(${quote(`${blockName} Visual Tests`)}, () => {
${testContent}
});
`;
}

async function generateVisualTests() {
  const blockFilter = getBlockFilter();

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

  const excluded = Object.keys(blocksByName).filter((blockName) => EXCLUDED_BLOCKS.includes(getBlockSlug(blockName)));
  if (excluded.length) {
    console.log(
      `Skipping excluded blocks (see EXCLUDED_BLOCKS in config.js): ${excluded.map(getBlockSlug).join(', ')}`,
    );
  }

  const blockEntries = Object.entries(blocksByName).filter(
    ([blockName]) =>
      !EXCLUDED_BLOCKS.includes(getBlockSlug(blockName)) && (!blockFilter || getBlockSlug(blockName) === blockFilter),
  );

  if (blockEntries.length === 0) {
    const availableBlocks = Object.keys(blocksByName).map(getBlockSlug).sort().join(', ');
    throw new Error(
      `Block "${blockFilter}" was not found in the Sidekick Library. Available blocks: ${availableBlocks}`,
    );
  }

  // Create blocks directory
  const blocksDir = 'tools/visual-tests/blocks';
  if (!fs.existsSync(blocksDir)) {
    fs.mkdirSync(blocksDir, { recursive: true });
  }

  // Generate separate test file for each block
  let totalTests = 0;
  blockEntries.forEach(([blockName, blockVariations]) => {
    const blockSlug = getBlockSlug(blockName);

    // Create block-specific directory
    const blockDir = path.join(blocksDir, blockSlug);
    if (!fs.existsSync(blockDir)) {
      fs.mkdirSync(blockDir, { recursive: true });
    }

    // Generate test spec content for this block
    const testSpec = generateTestSpec(blockName, blockVariations);

    // Write to block-specific test file
    const testFileName = `${blockSlug}.spec.js`;
    fs.writeFileSync(path.join(blockDir, testFileName), testSpec);

    totalTests += blockVariations.length;
    console.log(`Generated test file: blocks/${blockSlug}/${testFileName}`);
  });

  console.log(
    `\nSuccessfully generated ${totalTests} test variations across ${blockEntries.length} block${
      blockEntries.length === 1 ? '' : 's'
    }`,
  );
}

// Run the generator
generateVisualTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
