import { test, expect } from '@playwright/test';

test.describe('Navigation Tests', () => {
  test('should show desktop navigation on large screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Wait for navigation to fully load
    
    // Desktop sidebar should be visible
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    await expect(desktopSidebar).toBeVisible();
    
    // Check for navigation links in desktop sidebar specifically
    const deviationsLink = desktopSidebar.locator('a[href="/deviations"]');
    await expect(deviationsLink).toBeVisible();
    
    // Verify all main navigation items are present and visible
    const navigationItems = [
      { href: '/', text: 'Översikt' },
      { href: '/deviations', text: 'Avvikelser' },
      { href: '/leave', text: 'Ledighet' },
      { href: '/payslips', text: 'Lönespecifikationer' },
      { href: '/schedules', text: 'Scheman' },
      { href: '/settings', text: 'Inställningar' }
    ];
    
    for (const item of navigationItems) {
      const link = desktopSidebar.locator(`a[href="${item.href}"]`);
      await expect(link).toBeVisible();
    }
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
    await page.waitForTimeout(1000); // Wait for mobile UI to load
    
    // Mobile menu button should be visible
    const menuButton = page.locator('#menu-toggle');
    await expect(menuButton).toBeVisible();
    
    // Click menu button to open sidebar  
    await menuButton.click();
    await page.waitForTimeout(500); // Wait for animation
    
    // Mobile sidebar should become visible (not have -translate-x-full)
    const mobileSidebar = page.locator('#mobile-sidebar');
    await expect(mobileSidebar).toHaveClass(/translate-x-0/);
    
    // Check that navigation links are visible in mobile sidebar
    const deviationsLink = mobileSidebar.locator('a[href="/deviations"]');
    await expect(deviationsLink).toBeVisible();
    
    // Test navigation functionality
    await deviationsLink.click();
    await page.waitForLoadState('domcontentloaded');
    expect(page.url()).toContain('/deviations');
  });

  test('should have all main navigation items', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);
    
    // Get desktop sidebar and check all navigation items
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    await expect(desktopSidebar).toBeVisible();
    
    const expectedRoutes = ['/', '/deviations', '/leave', '/payslips', '/schedules', '/settings'];
    
    for (const route of expectedRoutes) {
      const link = desktopSidebar.locator(`a[href="${route}"]`);
      await expect(link).toBeVisible();
    }
  });

  test('should maintain navigation state across pages', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Start at home
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Go to deviations
    await page.goto('/deviations');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);
    
    // Navigation should still be visible
    const desktopSidebar = page.locator('aside.hidden.md\\:flex');
    await expect(desktopSidebar).toBeVisible();
    
    // Check that deviations link exists and is functional
    const deviationsLink = desktopSidebar.locator('a[href="/deviations"]');
    await expect(deviationsLink).toBeVisible();
    
    // Verify we're on the correct page
    expect(page.url()).toContain('/deviations');
  });
}); 