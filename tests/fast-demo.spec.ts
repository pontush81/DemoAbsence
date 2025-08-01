import { test, expect } from '@playwright/test';

test('🚀 SNABB DEMO - Visar app-interaktion', async ({ page }) => {
  console.log('🎬 Snabb demo startar...');
  
  await page.goto('http://localhost:3000');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
  
  console.log('✅ App laddad, visar interaktion...');
  
  // Musrörelser för att visa aktivitet
  await page.mouse.move(100, 100);
  await page.waitForTimeout(500);
  await page.mouse.move(300, 200);
  await page.waitForTimeout(500);
  await page.mouse.move(500, 300);
  await page.waitForTimeout(1000);
  
  // Scrolla
  await page.evaluate(() => window.scrollTo(0, 200));
  await page.waitForTimeout(1000);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(1000);
  
  console.log('🎉 Snabb demo klar!');
  await expect(page).toHaveURL(/localhost:3000/);
});