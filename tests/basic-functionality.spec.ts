import { test, expect } from '@playwright/test';

test.describe('Basic App Functionality', () => {
  test('should load the application successfully', async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
    
    // Wait for React to load (we can see React DevTools message in console)
    await page.waitForLoadState('domcontentloaded');
    
    // Check that we don't have a completely broken page
    const hasErrorPage = await page.locator('text=Error').count();
    expect(hasErrorPage).toBe(0);
    
    // The page should have some content
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toBe('');
  });

  test('should navigate to deviations page', async ({ page }) => {
    await page.goto('/deviations');
    await page.waitForLoadState('domcontentloaded');
    
    // The page should load (even if API fails)
    await expect(page.locator('body')).toBeVisible();
    
    // URL should be correct
    expect(page.url()).toContain('/deviations');
  });

  test('should have working navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for navigation to load
    
    const viewport = page.viewportSize();
    const isMobile = viewport ? viewport.width < 768 : false;
    
    if (isMobile) {
      // Test mobile navigation
      const menuButton = page.locator('#menu-toggle');
      if (await menuButton.count() > 0) {
        await expect(menuButton).toBeVisible();
        await menuButton.click();
        await page.waitForTimeout(500);
        
        const mobileSidebar = page.locator('#mobile-sidebar');
        const deviationsLink = mobileSidebar.locator('a[href="/deviations"]');
        
        if (await deviationsLink.count() > 0) {
          await deviationsLink.click();
          await page.waitForLoadState('domcontentloaded');
          expect(page.url()).toContain('/deviations');
        }
      }
    } else {
      // Test desktop navigation
      const desktopSidebar = page.locator('aside.hidden.md\\:flex');
      const sidebarCount = await desktopSidebar.count();
      
      if (sidebarCount > 0) {
        await expect(desktopSidebar).toBeVisible();
        
        const deviationsLink = desktopSidebar.locator('a[href="/deviations"]');
        
        if (await deviationsLink.count() > 0) {
          await deviationsLink.click();
          await page.waitForLoadState('domcontentloaded');
          expect(page.url()).toContain('/deviations');
        }
      }
    }
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Intercept API calls and let them fail, but make sure UI handles it
    await page.route('**/api/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Test error' })
      });
    });
    
    await page.goto('/deviations');
    await page.waitForLoadState('domcontentloaded');
    
    // Page should still render despite API errors
    await expect(page.locator('body')).toBeVisible();
    
    // Should not crash the entire app
    const hasReactError = await page.locator('text="Something went wrong"').count();
    expect(hasReactError).toBe(0);
  });

  test('should be responsive', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Should still be functional on mobile
    await expect(page.locator('body')).toBeVisible();
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).not.toBe('');
  });
}); 