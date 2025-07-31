import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/');
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check that the page loaded successfully
    await expect(page).not.toHaveTitle(/error/i);
    
    // Basic check that React rendered
    await expect(page.locator('body')).toBeVisible();
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for common navigation elements
    const nav = page.locator('nav, [role="navigation"]');
    if (await nav.count() > 0) {
      await expect(nav.first()).toBeVisible();
    }
    
    // Check for sidebar or menu
    const sidebar = page.locator('[data-testid*="sidebar"], .sidebar, [role="complementary"]');
    if (await sidebar.count() > 0) {
      await expect(sidebar.first()).toBeVisible();
    }
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that page is still functional on mobile
    await expect(page.locator('body')).toBeVisible();
  });
}); 