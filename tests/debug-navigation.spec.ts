import { test, expect } from '@playwright/test';

test.describe('Debug Navigation Issues', () => {
  test('should debug navigation visibility', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'debug-navigation.png', fullPage: true });
    
    // Check desktop sidebar
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    const sidebarVisible = await desktopSidebar.isVisible();
    console.log(`Desktop sidebar visible: ${sidebarVisible}`);
    
    if (sidebarVisible) {
      const sidebarClasses = await desktopSidebar.getAttribute('class');
      console.log(`Desktop sidebar classes: ${sidebarClasses}`);
      
      // Get computed styles
      const sidebarStyles = await desktopSidebar.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          display: computed.display,
          visibility: computed.visibility,
          opacity: computed.opacity,
          width: computed.width,
          height: computed.height
        };
      });
      console.log('Desktop sidebar computed styles:', sidebarStyles);
    }
    
    // Check all navigation links
    const deviationsLinks = await page.locator('a[href="/deviations"]').all();
    console.log(`Found ${deviationsLinks.length} deviations links`);
    
    for (let i = 0; i < deviationsLinks.length; i++) {
      const link = deviationsLinks[i];
      const isVisible = await link.isVisible();
      const classes = await link.getAttribute('class');
      const parentClasses = await link.locator('..').getAttribute('class');
      
      console.log(`Link ${i}: visible=${isVisible}, classes="${classes}", parent="${parentClasses}"`);
      
      if (!isVisible) {
        const styles = await link.evaluate(el => {
          const computed = window.getComputedStyle(el);
          const parent = el.parentElement;
          const parentComputed = parent ? window.getComputedStyle(parent) : null;
          
          return {
            element: {
              display: computed.display,
              visibility: computed.visibility,
              opacity: computed.opacity,
              position: computed.position,
              transform: computed.transform,
              width: computed.width,
              height: computed.height
            },
            parent: parentComputed ? {
              display: parentComputed.display,
              visibility: parentComputed.visibility,
              opacity: parentComputed.opacity,
              overflow: parentComputed.overflow,
              transform: parentComputed.transform
            } : null
          };
        });
        console.log(`Link ${i} computed styles:`, styles);
      }
    }
    
    // Check if Material Icons are loaded
    const materialIcons = await page.locator('.material-icons').first();
    if (await materialIcons.count() > 0) {
      const iconVisible = await materialIcons.isVisible();
      console.log(`Material icons visible: ${iconVisible}`);
    }
    
    // Check CSS custom properties
    const cssVars = await page.evaluate(() => {
      const root = document.documentElement;
      const computed = window.getComputedStyle(root);
      return {
        sidebar: computed.getPropertyValue('--sidebar'),
        sidebarForeground: computed.getPropertyValue('--sidebar-foreground'),
        primary: computed.getPropertyValue('--primary'),
      };
    });
    console.log('CSS variables:', cssVars);
  });
});