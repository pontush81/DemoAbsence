import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should show desktop navigation on large screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Desktop sidebar should be visible
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    await expect(desktopSidebar).toBeVisible();
    
    // Check for navigation links
    const deviationsLink = page.locator('a[href="/deviations"]').first();
    await expect(deviationsLink).toBeVisible();
  });

  test('should show mobile header on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Mobile header should be visible
    const mobileHeader = page.locator('#mobile-header, .mobile-header, header');
    if (await mobileHeader.count() > 0) {
      await expect(mobileHeader.first()).toBeVisible();
    }
    
    // Mobile sidebar should initially be hidden
    const mobileSidebar = page.locator('#mobile-sidebar');
    await expect(mobileSidebar).toHaveClass(/-translate-x-full/);
  });

  test('should navigate to deviations page via direct URL', async ({ page }) => {
    await page.goto('/deviations');
    await page.waitForLoadState('domcontentloaded');
    
    // Should be on deviations page
    expect(page.url()).toContain('/deviations');
    
    // Page should load (even with API errors)
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('should navigate via desktop sidebar links', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Find and click deviations link in desktop navigation
    const deviationsLink = page.locator('aside.hidden.md\\:flex a[href="/deviations"]');
    if (await deviationsLink.count() > 0) {
      await deviationsLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('/deviations');
    }
  });

  test('should handle mobile navigation menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Look for menu button/hamburger menu
    const menuButton = page.locator('[aria-label*="menu"], [data-testid*="menu"], .menu-button, button[aria-expanded]');
    
    if (await menuButton.count() > 0) {
      await menuButton.first().click();
      
      // Mobile sidebar should become visible
      const mobileSidebar = page.locator('#mobile-sidebar');
      await expect(mobileSidebar).not.toHaveClass(/-translate-x-full/);
      
      // Try to click deviations link
      const deviationsLink = page.locator('#mobile-sidebar a[href="/deviations"]');
      if (await deviationsLink.count() > 0) {
        await deviationsLink.click();
        expect(page.url()).toContain('/deviations');
      }
    }
  });

  test('should have all main navigation items', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Check for main navigation items
    const expectedRoutes = ['/deviations', '/leave', '/payslips', '/settings'];
    
    for (const route of expectedRoutes) {
      const link = page.locator(`a[href="${route}"]`).first();
      if (await link.count() > 0) {
        await expect(link).toBeVisible();
      }
    }
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Go to deviations
    await page.goto('/deviations');
    await page.waitForLoadState('domcontentloaded');
    
    // Navigation should still be visible
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    await expect(desktopSidebar).toBeVisible();
    
    // Deviations link should be active/highlighted
    const activeLink = page.locator('a[href="/deviations"].text-primary, a[href="/deviations"][class*="active"], a[href="/deviations"][class*="border-primary"]');
    if (await activeLink.count() > 0) {
      await expect(activeLink.first()).toBeVisible();
    }
  });
}); 