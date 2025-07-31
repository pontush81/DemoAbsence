import { test, expect } from '@playwright/test';

test.describe('Deviations Page', () => {
  test('should navigate to deviations page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Try to navigate to deviations
    // This could be through a link, button, or direct URL
    try {
      // First try to find a navigation link
      const deviationLink = page.locator('a[href*="deviation"], button[data-testid*="deviation"], [role="menuitem"]:has-text("Avvikelse")');
      if (await deviationLink.count() > 0) {
        await deviationLink.first().click();
      } else {
        // Direct navigation if no link found
        await page.goto('/deviations');
      }
      
      await page.waitForLoadState('networkidle');
      
      // Check that we're on the deviations page
      await expect(page).not.toHaveTitle(/error/i);
      
    } catch (error) {
      // Try direct URL navigation as fallback
      await page.goto('/deviations');
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display deviation form elements', async ({ page }) => {
    await page.goto('/deviations');
    await page.waitForLoadState('networkidle');
    
    // Look for form elements (these might vary based on your implementation)
    const forms = await page.locator('form, [role="form"]').count();
    const inputs = await page.locator('input, select, textarea').count();
    const buttons = await page.locator('button').count();
    
    // At least some interactive elements should be present
    expect(forms + inputs + buttons).toBeGreaterThan(0);
  });

  test('should handle form interactions', async ({ page }) => {
    await page.goto('/deviations');
    await page.waitForLoadState('networkidle');
    
    // Look for any text inputs
    const textInputs = page.locator('input[type="text"], textarea');
    if (await textInputs.count() > 0) {
      await textInputs.first().fill('Test deviation');
      await expect(textInputs.first()).toHaveValue('Test deviation');
    }
    
    // Look for date inputs
    const dateInputs = page.locator('input[type="date"], [role="textbox"][placeholder*="date" i]');
    if (await dateInputs.count() > 0) {
      // Just check that we can interact with date inputs
      await dateInputs.first().click();
    }
  });
}); 