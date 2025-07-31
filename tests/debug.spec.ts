import { test, expect } from '@playwright/test';

test.describe('Debug Tests', () => {
  test('should inspect page structure for navigation', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Take a screenshot for debugging
    await page.screenshot({ path: 'debug-desktop.png', fullPage: true });
    
    // Log all aside elements
    const asides = await page.locator('aside').all();
    console.log(`Found ${asides.length} aside elements`);
    
    for (let i = 0; i < asides.length; i++) {
      const aside = asides[i];
      const classes = await aside.getAttribute('class');
      const isVisible = await aside.isVisible();
      console.log(`Aside ${i}: classes="${classes}", visible=${isVisible}`);
    }
    
    // Log all navigation links
    const navLinks = await page.locator('a[href*="/"]').all();
    console.log(`Found ${navLinks.length} navigation links`);
    
    for (let i = 0; i < Math.min(10, navLinks.length); i++) {
      const link = navLinks[i];
      const href = await link.getAttribute('href');
      const text = await link.textContent();
      const isVisible = await link.isVisible();
      console.log(`Link ${i}: href="${href}", text="${text?.trim()}", visible=${isVisible}`);
    }
    
    // Check for any element with "deviations" text
    const deviationElements = await page.locator('text="Avvikelse", text="Deviations", text="deviation"').all();
    console.log(`Found ${deviationElements.length} elements containing 'deviation' text`);
  });

  test('should test mobile menu functionality', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Take screenshot before
    await page.screenshot({ path: 'debug-mobile-before.png' });
    
    // Find menu button
    const menuButton = page.locator('#menu-toggle');
    const menuButtonExists = await menuButton.count() > 0;
    console.log(`Menu button exists: ${menuButtonExists}`);
    
    if (menuButtonExists) {
      await menuButton.click();
      await page.waitForTimeout(500); // Wait for animation
      
      // Take screenshot after
      await page.screenshot({ path: 'debug-mobile-after.png' });
      
      // Check mobile sidebar
      const mobileSidebar = page.locator('#mobile-sidebar');
      const sidebarClasses = await mobileSidebar.getAttribute('class');
      console.log(`Mobile sidebar classes after click: ${sidebarClasses}`);
    }
  });

  test('should run basic app functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Just verify the app loads
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    const bodyText = await page.locator('body').textContent();
    const hasContent = bodyText && bodyText.length > 100;
    console.log(`Body has content: ${hasContent} (${bodyText?.length} chars)`);
    
    expect(hasContent).toBe(true);
  });
}); 