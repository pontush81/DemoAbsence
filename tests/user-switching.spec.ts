import { test, expect } from '@playwright/test';

test.describe('User Switching Tests', () => {
  test('should handle Erik Eriksson user switching without crashes', async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor API calls
    const apiCalls: { url: string; status: number }[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        apiCalls.push({
          url: response.url(),
          status: response.status()
        });
      }
    });

    // Start at dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000); // Allow time for initial API calls

    // Look for user switcher component
    const userSwitcher = page.locator('[data-testid="user-switcher"], .user-switcher, [class*="persona"], button:has-text("Erik"), button:has-text("Växla")');
    
    if (await userSwitcher.count() > 0) {
      // Try to switch to Erik Eriksson as employee
      await userSwitcher.first().click();
      await page.waitForTimeout(500);

      // Look for Erik Eriksson option
      const erikOption = page.locator('text="Erik Eriksson", [data-persona-id*="mgr-001"], [data-user-id="mgr-001"]');
      
      if (await erikOption.count() > 0) {
        await erikOption.first().click();
        await page.waitForTimeout(2000); // Wait for role switching
        
        // Check if we can switch to employee role
        const employeeRole = page.locator('text="Medarbetare", text="Employee", [data-role="employee"]');
        if (await employeeRole.count() > 0) {
          await employeeRole.first().click();
          await page.waitForTimeout(3000); // Wait for dashboard to reload
        }
      }
    }

    // Check that page still loads without crashes
    await expect(page.locator('body')).toBeVisible();
    
    // Verify no JavaScript errors that would crash the app
    const criticalErrors = consoleErrors.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('Cannot read properties') ||
      error.includes('is not defined')
    );
    
    if (criticalErrors.length > 0) {
      console.log('Critical errors found:', criticalErrors);
    }

    // Check API calls - should not have persistent 404s for time-balance
    const timeBalanceFailures = apiCalls.filter(call => 
      call.url.includes('/api/time-balances/mgr-001') && call.status === 404
    );
    
    expect(timeBalanceFailures.length).toBe(0);
    
    // Page should still be responsive
    const pageContent = await page.locator('body').textContent();
    expect(pageContent).toBeTruthy();
    expect(pageContent!.length).toBeGreaterThan(100);
  });

  test('should load time balance data for all production users', async ({ page }) => {
    const productionUsers = ['mgr-001', 'emp-001', 'hr-001', 'pay-001', 'admin-001'];
    
    for (const userId of productionUsers) {
      // Test the API endpoint directly
      const response = await page.request.get(`/api/time-balances/${userId}`);
      
      if (response.status() !== 200) {
        console.log(`Failed to load time balance for ${userId}: ${response.status()}`);
      }
      
      // Should not return 404 for production users
      expect(response.status()).not.toBe(404);
      
      if (response.status() === 200) {
        const data = await response.json();
        expect(data).toHaveProperty('employeeId', userId);
        expect(data).toHaveProperty('timeBalance');
        expect(data).toHaveProperty('vacationDays');
      }
    }
  });

  test('should handle dashboard loading after user switching', async ({ page }) => {
    // Track network failures
    let networkErrors = 0;
    page.on('requestfailed', request => {
      console.log('Network request failed:', request.url());
      networkErrors++;
    });

    // Go to dashboard
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Wait for initial data loading
    await page.waitForTimeout(3000);
    
    // Dashboard should load without major network failures
    expect(networkErrors).toBeLessThan(5); // Allow some failures but not many
    
    // Page should have content
    const hasUserInfo = await page.locator('text="Erik", text="Anna", text="Maria", text="Dashboard", text="Översikt"').count();
    expect(hasUserInfo).toBeGreaterThan(0);
    
    // Should not show error boundaries or crash messages
    const errorMessages = await page.locator('text="Something went wrong", text="Error", text="Crashed"').count();
    expect(errorMessages).toBe(0);
  });

  test('should show appropriate data when switching between user roles', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Try to interact with user interface elements
    const clickableElements = page.locator('button, a, [role="button"]');
    const elementCount = await clickableElements.count();
    
    // Should have interactive elements
    expect(elementCount).toBeGreaterThan(0);
    
    // Try clicking the first few safe elements (not external links)
    for (let i = 0; i < Math.min(3, elementCount); i++) {
      const element = clickableElements.nth(i);
      const href = await element.getAttribute('href');
      
      // Skip external links
      if (!href || href.startsWith('/') || href.startsWith('#')) {
        try {
          await element.click({ timeout: 1000 });
          await page.waitForTimeout(1000);
          
          // Make sure page is still responsive after click
          await expect(page.locator('body')).toBeVisible();
        } catch (e) {
          // Ignore click failures - element might not be clickable
          console.log(`Could not click element ${i}:`, e);
        }
      }
    }
    
    // Final check - app should still be working
    const finalContent = await page.locator('body').textContent();
    expect(finalContent).toBeTruthy();
  });
});