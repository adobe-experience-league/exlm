import { test, expect } from '@playwright/test';

test.describe('curated-cards Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set default viewport size
    await page.setViewportSize({ width: 1280, height: 2000 });
  });

  test('curated-cards (header-left) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/curated-cards&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.curated-cards', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for curated-cards');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'curated-cards-0-Mobile.png';
    const screenshot = await page.screenshot({
      clip: box,
      timeout: 30000,
      animations: 'disabled',
      type: 'png',
    });

    // Use strict visual comparison settings for detecting color and layout changes
    expect(screenshot).toMatchSnapshot(screenshotName, {
      maxDiffPixels: 50,         // Reduced tolerance for better sensitivity
      threshold: 0.05,            // 5% color difference tolerance (more sensitive)
      maxDiffPixelRatio: 0.005,  // 0.5% of total pixels tolerance
    });
  });
  test('curated-cards (header-left) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/curated-cards&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.curated-cards', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for curated-cards');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'curated-cards-0-Tablet.png';
    const screenshot = await page.screenshot({
      clip: box,
      timeout: 30000,
      animations: 'disabled',
      type: 'png',
    });

    // Use strict visual comparison settings for detecting color and layout changes
    expect(screenshot).toMatchSnapshot(screenshotName, {
      maxDiffPixels: 50,         // Reduced tolerance for better sensitivity
      threshold: 0.05,            // 5% color difference tolerance (more sensitive)
      maxDiffPixelRatio: 0.005,  // 0.5% of total pixels tolerance
    });
  });
  test('curated-cards (header-left) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/curated-cards&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.curated-cards', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for curated-cards');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'curated-cards-0-Desktop.png';
    const screenshot = await page.screenshot({
      clip: box,
      timeout: 30000,
      animations: 'disabled',
      type: 'png',
    });

    // Use strict visual comparison settings for detecting color and layout changes
    expect(screenshot).toMatchSnapshot(screenshotName, {
      maxDiffPixels: 50,         // Reduced tolerance for better sensitivity
      threshold: 0.05,            // 5% color difference tolerance (more sensitive)
      maxDiffPixelRatio: 0.005,  // 0.5% of total pixels tolerance
    });
  });
  test('curated-cards (header-left) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/curated-cards&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.curated-cards', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for curated-cards');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'curated-cards-0-Large.png';
    const screenshot = await page.screenshot({
      clip: box,
      timeout: 30000,
      animations: 'disabled',
      type: 'png',
    });

    // Use strict visual comparison settings for detecting color and layout changes
    expect(screenshot).toMatchSnapshot(screenshotName, {
      maxDiffPixels: 50,         // Reduced tolerance for better sensitivity
      threshold: 0.05,            // 5% color difference tolerance (more sensitive)
      maxDiffPixelRatio: 0.005,  // 0.5% of total pixels tolerance
    });
  });
});