import { test, expect } from '@playwright/test';

test.describe('marquee Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set default viewport size
    await page.setViewportSize({ width: 1280, height: 2000 });
  });

  test('marquee (straight, bg-spectrum-blue-700, large) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-0-Mobile.png';
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
  test('marquee (straight, bg-spectrum-blue-700, large) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-0-Tablet.png';
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
  test('marquee (straight, bg-spectrum-blue-700, large) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-0-Desktop.png';
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
  test('marquee (straight, bg-spectrum-blue-700, large) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=0&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-0-Large.png';
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
  test('marquee (medium, curved, text-spectrum-gray-900, bg-spectrum-red-700) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=1&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-1-Mobile.png';
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
  test('marquee (medium, curved, text-spectrum-gray-900, bg-spectrum-red-700) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=1&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-1-Tablet.png';
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
  test('marquee (medium, curved, text-spectrum-gray-900, bg-spectrum-red-700) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=1&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-1-Desktop.png';
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
  test('marquee (medium, curved, text-spectrum-gray-900, bg-spectrum-red-700) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=1&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-1-Large.png';
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
  test('marquee (text-spectrum-gray-900, small, straight, bg-spectrum-yellow-700) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=2&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-2-Mobile.png';
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
  test('marquee (text-spectrum-gray-900, small, straight, bg-spectrum-yellow-700) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=2&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-2-Tablet.png';
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
  test('marquee (text-spectrum-gray-900, small, straight, bg-spectrum-yellow-700) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=2&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-2-Desktop.png';
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
  test('marquee (text-spectrum-gray-900, small, straight, bg-spectrum-yellow-700) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=2&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-2-Large.png';
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
  test('marquee (medium, text-spectrum-gray-900, straight, fill-background, bg-spectrum-celery-700) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=3&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-3-Mobile.png';
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
  test('marquee (medium, text-spectrum-gray-900, straight, fill-background, bg-spectrum-celery-700) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=3&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-3-Tablet.png';
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
  test('marquee (medium, text-spectrum-gray-900, straight, fill-background, bg-spectrum-celery-700) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=3&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-3-Desktop.png';
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
  test('marquee (medium, text-spectrum-gray-900, straight, fill-background, bg-spectrum-celery-700) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=3&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-3-Large.png';
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
  test('marquee (bg-spectrum-gray-700, large, straight, fill-background, text-spectrum-gray-50) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=4&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-4-Mobile.png';
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
  test('marquee (bg-spectrum-gray-700, large, straight, fill-background, text-spectrum-gray-50) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=4&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-4-Tablet.png';
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
  test('marquee (bg-spectrum-gray-700, large, straight, fill-background, text-spectrum-gray-50) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=4&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-4-Desktop.png';
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
  test('marquee (bg-spectrum-gray-700, large, straight, fill-background, text-spectrum-gray-50) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=4&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-4-Large.png';
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
  test('marquee (medium, straight, bg-spectrum-fuchsia-700, text-spectrum-gray-900) visual test at Mobile viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 320, height: 568 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=5&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 320,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-5-Mobile.png';
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
  test('marquee (medium, straight, bg-spectrum-fuchsia-700, text-spectrum-gray-900) visual test at Tablet viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=5&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 768,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-5-Tablet.png';
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
  test('marquee (medium, straight, bg-spectrum-fuchsia-700, text-spectrum-gray-900) visual test at Desktop viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1024, height: 768 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=5&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1024,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-5-Desktop.png';
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
  test('marquee (medium, straight, bg-spectrum-fuchsia-700, text-spectrum-gray-900) visual test at Large viewport', async ({ page }) => {
    // Set viewport size
    await page.setViewportSize({ width: 1440, height: 900 });

    // Navigate to the block variation
    await page.goto('/tools/sidekick/library.html?plugin=blocks&path=/tools/sidekick/blocks/marquee&index=5&vtest=true');

    // Wait for the library component to load
    await page.waitForSelector('sidekick-library', { timeout: 30000 });

    // Wait for the iframe to load and switch to its context
    const iframe = await page.waitForSelector('sidekick-library >> sp-theme >> plugin-renderer >> .view block-renderer >> iframe', { timeout: 30000 });
    const frame = await iframe.contentFrame();
    if (!frame) throw new Error('Could not get iframe content frame');

    // Wait for the block to be fully rendered
    const block = await frame.waitForSelector('.marquee', { timeout: 30000, state: 'visible' });

    // Small delay to ensure layout is stable
    await page.waitForTimeout(1000);

    await block.scrollIntoViewIfNeeded();
    await page.evaluate(el => {
      el.style.overflow = 'visible';
      el.style.maxHeight = 'none';
    }, block);

    // Get the bounding box of the block
    const box = await block.boundingBox();
    if (!box) throw new Error('Could not get bounding box for marquee');

    await page.setViewportSize({
      width: 1440,
      height: Math.round(box.height + box.y),
    });

    // Take a screenshot of only the block area
    const screenshotName = 'marquee-5-Large.png';
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