import { test, expect } from '@playwright/test';

test.describe('Detailed Navigation Debug', () => {
  test('should debug sidebar hierarchy', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(3000);
    
    // Debug sidebar structure
    const sidebar = page.locator('aside.hidden.md\\:flex');
    const sidebarHTML = await sidebar.innerHTML();
    console.log('Desktop sidebar HTML structure:', sidebarHTML.substring(0, 500));
    
    // Check each navigation item individually
    const navItems = await sidebar.locator('nav ul li').all();
    console.log(`Found ${navItems.length} navigation items`);
    
    for (let i = 0; i < navItems.length; i++) {
      const item = navItems[i];
      const link = item.locator('a');
      const href = await link.getAttribute('href'); 
      const text = await link.textContent();
      const isVisible = await link.isVisible();
      const boundingBox = await link.boundingBox();
      
      console.log(`Nav item ${i}: href=${href}, text="${text?.trim()}", visible=${isVisible}`);
      console.log(`  Bounding box:`, boundingBox);
      
      if (boundingBox) {
        // Check if element is actually in viewport
        const inViewport = boundingBox.x >= 0 && boundingBox.y >= 0 && 
                          boundingBox.x + boundingBox.width <= 1024 && 
                          boundingBox.y + boundingBox.height <= 768;
        console.log(`  In viewport: ${inViewport}`);
      }
    }
    
    // Test Material Icons specifically
    await page.addStyleTag({
      content: `
        .material-icons-test::before {
          content: "dashboard";
          font-family: 'Material Icons';
        }
      `
    });
    
    const testIcon = await page.locator('body').evaluate(() => {
      const div = document.createElement('div');
      div.className = 'material-icons-test';
      document.body.appendChild(div);
      const computed = window.getComputedStyle(div, '::before');
      const fontFamily = computed.fontFamily;
      document.body.removeChild(div);
      return { fontFamily };
    });
    console.log('Material Icons font test:', testIcon);
    
    // Check for overlapping elements
    const firstLink = page.locator('a[href="/deviations"]').first();
    const linkBox = await firstLink.boundingBox();
    
    if (linkBox) {
      // Check what element is at the link's position
      const elementAtPoint = await page.locator(`[style*="position: fixed"], [style*="position: absolute"]`).all();
      console.log(`Found ${elementAtPoint.length} positioned elements that might overlap`);
      
      for (let i = 0; i < elementAtPoint.length; i++) {
        const el = elementAtPoint[i];
        const box = await el.boundingBox();
        if (box && 
            box.x < linkBox.x + linkBox.width && 
            box.x + box.width > linkBox.x &&
            box.y < linkBox.y + linkBox.height && 
            box.y + box.height > linkBox.y) {
          const classes = await el.getAttribute('class');
          console.log(`  Overlapping element: classes="${classes}", box:`, box);
        }
      }
    }
  });
  
  test('should test mobile sidebar functionality', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Take screenshot before
    await page.screenshot({ path: 'mobile-before.png' });
    
    // Test mobile menu button
    const menuButton = page.locator('#menu-toggle');
    const buttonExists = await menuButton.count() > 0;
    console.log(`Mobile menu button exists: ${buttonExists}`);
    
    if (buttonExists) {
      const isVisible = await menuButton.isVisible();
      console.log(`Mobile menu button visible: ${isVisible}`);
      
      if (isVisible) {
        await menuButton.click();
        await page.waitForTimeout(500);
        
        // Take screenshot after
        await page.screenshot({ path: 'mobile-after.png' });
        
        // Check mobile sidebar state
        const mobileSidebar = page.locator('#mobile-sidebar');
        const sidebarClasses = await mobileSidebar.getAttribute('class');
        const isOpen = !sidebarClasses?.includes('-translate-x-full');
        
        console.log(`Mobile sidebar classes: ${sidebarClasses}`);
        console.log(`Mobile sidebar is open: ${isOpen}`);
        
        // Test navigation in mobile sidebar
        const mobileLinks = await mobileSidebar.locator('a').all();
        console.log(`Found ${mobileLinks.length} links in mobile sidebar`);
        
        for (let i = 0; i < Math.min(3, mobileLinks.length); i++) {
          const link = mobileLinks[i];
          const href = await link.getAttribute('href');
          const visible = await link.isVisible();
          console.log(`Mobile link ${i}: href=${href}, visible=${visible}`);
        }
      }
    }
  });
});