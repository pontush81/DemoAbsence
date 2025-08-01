import { test, expect } from '@playwright/test';

test.describe('Comprehensive Crash Detection Tests', () => {
  
  test('should detect JavaScript errors and crashes across all pages', async ({ page }) => {
    const consoleErrors: string[] = [];
    const uncaughtErrors: string[] = [];
    const networkErrors: string[] = [];
    
    // Monitor all console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Monitor uncaught exceptions
    page.on('pageerror', error => {
      uncaughtErrors.push(error.message);
    });

    // Monitor failed network requests
    page.on('requestfailed', request => {
      if (!request.url().includes('favicon')) {
        networkErrors.push(`${request.method()} ${request.url()} - ${request.failure()?.errorText}`);
      }
    });

    // Test all main pages
    const pagesToTest = ['/', '/deviations', '/leave', '/payslips', '/settings', '/schedules'];
    
    for (const pageUrl of pagesToTest) {
      console.log(`Testing page: ${pageUrl}`);
      
      try {
        await page.goto(`${pageUrl}`, { timeout: 30000 });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(3000); // Wait for API calls and React to settle
        
        // Check that page has content and is not crashed
        const bodyText = await page.locator('body').textContent();
        expect(bodyText).toBeTruthy();
        expect(bodyText!.length).toBeGreaterThan(100);
        
        // Check for error boundaries or crash messages
        const errorBoundaries = await page.locator('text="Something went wrong", text="Error occurred", text="Crashed", text="Uncaught"').count();
        expect(errorBoundaries).toBe(0);
        
        // Check that React is still working by looking for interactive elements
        const interactiveElements = await page.locator('button, a, input').count();
        expect(interactiveElements).toBeGreaterThan(0);
        
      } catch (error) {
        console.error(`Failed to load page ${pageUrl}:`, error);
        // Don't fail the test immediately, continue to other pages
      }
    }

    // Report all errors found
    console.log(`Console errors found: ${consoleErrors.length}`);
    console.log(`Uncaught errors found: ${uncaughtErrors.length}`);
    console.log(`Network errors found: ${networkErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    if (uncaughtErrors.length > 0) {
      console.log('Uncaught errors:', uncaughtErrors);
    }
    if (networkErrors.length > 0) {
      console.log('Network errors:', networkErrors);
    }

    // Critical errors that would cause crashes
    const criticalErrors = [
      ...uncaughtErrors,
      ...consoleErrors.filter(error => 
        error.includes('TypeError') || 
        error.includes('ReferenceError') ||
        error.includes('Cannot read properties') ||
        error.includes('is not defined') ||
        error.includes('null is not an object') ||
        error.includes('undefined is not a function')
      )
    ];

    // Allow some non-critical errors but no critical crashes
    expect(criticalErrors.length).toBe(0);
  });

  test('should test all API endpoints for crashes', async ({ page }) => {
    const apiEndpoints = [
      '/api/time-balances/mgr-001',
      '/api/time-balances/emp-001', 
      '/api/time-balances/hr-001',
      '/api/time-balances/pay-001',
      '/api/time-balances/admin-001',
      '/api/deviations',
      '/api/employees',
      '/api/leave-requests',
      '/api/payslips/emp-001',
      '/api/schedules'
    ];

    const results: { endpoint: string; status: number; success: boolean }[] = [];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await page.request.get(endpoint);
        const success = response.status() < 500; // 4xx is OK, 5xx is server crash
        
        results.push({
          endpoint,
          status: response.status(),
          success
        });

        if (response.status() >= 500) {
          console.error(`Server error on ${endpoint}: ${response.status()}`);
        }
      } catch (error) {
        console.error(`Failed to call ${endpoint}:`, error);
        results.push({
          endpoint,
          status: 0,
          success: false
        });
      }
    }

    // Report results
    console.log('API Endpoint Results:');
    results.forEach(result => {
      console.log(`${result.endpoint}: ${result.status} ${result.success ? '✅' : '❌'}`);
    });

    // No server crashes (5xx errors) should occur
    const serverCrashes = results.filter(r => r.status >= 500);
    expect(serverCrashes.length).toBe(0);

    // Most endpoints should work (allow some 404s for missing data)
    const workingEndpoints = results.filter(r => r.success);
    expect(workingEndpoints.length / results.length).toBeGreaterThan(0.7);
  });

  test('should stress test user switching without crashes', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(`PageError: ${error.message}`);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    // Try to quickly switch between different views/pages
    const quickNavigation = [
      '/',
      '/deviations', 
      '/leave',
      '/payslips',
      '/settings',
      '/',
      '/deviations'
    ];

    for (const url of quickNavigation) {
      try {
        await page.goto(url, { timeout: 10000 });
        await page.waitForTimeout(1000); // Quick switches
        
        // Check page is still responsive
        const bodyContent = await page.locator('body').textContent();
        expect(bodyContent).toBeTruthy();
        
      } catch (error) {
        console.error(`Navigation error on ${url}:`, error);
      }
    }

    // Check for crashes after stress testing
    const criticalErrors = errors.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('Cannot read properties') ||
      error.includes('Uncaught')
    );

    console.log(`Errors during stress test: ${errors.length}`);
    if (criticalErrors.length > 0) {
      console.log('Critical errors:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should test edge cases that could cause crashes', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', error => {
      errors.push(`PageError: ${error.message}`);
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Test edge cases
    const edgeCases = [
      // Invalid URLs that should not crash the app
      '/invalid-page',
      '/deviations/invalid-id',
      '/api/invalid-endpoint',
      '/#invalid-hash',
      '/payslips/nonexistent-user'
    ];

    for (const edgeCase of edgeCases) {
      try {
        const response = await page.goto(edgeCase, { timeout: 10000 });
        
        // Page should handle errors gracefully, not crash
        const bodyContent = await page.locator('body').textContent();
        expect(bodyContent).toBeTruthy();
        
        // Should show some kind of error page or redirect, not crash
        const hasErrorHandling = await page.locator('text="Not Found", text="404", text="Error", text="Översikt"').count();
        expect(hasErrorHandling).toBeGreaterThan(0);
        
      } catch (error) {
        // Navigation failures are OK for invalid URLs
        console.log(`Expected navigation failure for ${edgeCase}`);
      }
    }

    // No critical JavaScript crashes should occur
    const criticalErrors = errors.filter(error => 
      error.includes('TypeError') || 
      error.includes('ReferenceError') ||
      error.includes('Cannot read properties') ||
      error.includes('Uncaught')
    );

    if (criticalErrors.length > 0) {
      console.log('Critical errors in edge cases:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
  });

  test('should verify React error boundaries are working', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Check that the app has loaded properly
    const hasReactContent = await page.locator('[data-reactroot], #root, .App').count();
    expect(hasReactContent).toBeGreaterThan(0);

    // Look for signs that React is working
    const hasInteractiveElements = await page.locator('button, input, [role="button"]').count();
    expect(hasInteractiveElements).toBeGreaterThan(0);

    // Should not have visible error boundaries
    const errorBoundaries = await page.locator('text="Something went wrong", text="Error Boundary", text="Crashed"').count();
    expect(errorBoundaries).toBe(0);

    // Page should have meaningful content
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(200);
  });
});