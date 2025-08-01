import { test, expect } from '@playwright/test';

test.describe('🎥 ULTRA-ENKEL DEMO - Visar appen i aktion', () => {
  
  test('📺 Visar hela appen och gör grundläggande användarinteraktion', async ({ page }) => {
    console.log('🎬 === STARTAR ULTRA-ENKEL DEMO ===');
    
    // Gå till appen
    console.log('🌐 Laddar appen...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('📱 Appen laddad! Visar huvudsidan...');
    
    // Vänta några sekunder för att visa appen
    await page.waitForTimeout(3000);
    
    // Kolla om det finns användarinfo
    console.log('👤 Kollar om vi ser användare...');
    const userElements = await page.locator('text=Anna, text=Erik, .user-name, [data-testid*="user"]').count();
    console.log(`👥 Hittade ${userElements} användarelement`);
    
    // Scrolla lite för att visa innehåll
    console.log('📜 Scrollar för att visa innehåll...');
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2000);
    
    // Försök hover på olika element
    console.log('🖱️ Rör mig runt i UI:t...');
    const hoverTargets = await page.locator('button, a, .card, [role="button"]').all();
    
    for (let i = 0; i < Math.min(3, hoverTargets.length); i++) {
      try {
        await hoverTargets[i].hover();
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log(`⚠️ Kunde inte hovra på element ${i}`);
      }
    }
    
    // Försök klicka på säkra saker
    console.log('🎯 Försöker hitta säkra klickbara element...');
    
    // Mobil-menu knapp (om den finns)
    const mobileMenuButton = page.locator('button[aria-label*="menu"], button:has-text("☰"), [data-testid="mobile-menu"]').first();
    if (await mobileMenuButton.count() > 0) {
      console.log('📱 Öppnar mobilmeny...');
      try {
        await mobileMenuButton.click();
        await page.waitForTimeout(2000);
        
        // Stäng den igen
        await mobileMenuButton.click();
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('⚠️ Mobilmeny fungerade inte');
      }
    }
    
    // Dropdown eller select
    const dropdowns = page.locator('select, [role="combobox"], .dropdown-trigger').first();
    if (await dropdowns.count() > 0) {
      console.log('📋 Interagerar med dropdown...');
      try {
        await dropdowns.click();
        await page.waitForTimeout(2000);
        
        // Klicka någon annanstans för att stänga
        await page.click('body');
        await page.waitForTimeout(1000);
      } catch (e) {
        console.log('⚠️ Dropdown fungerade inte');
      }
    }
    
    // Visa att sidan är interaktiv
    console.log('✨ Visar att sidan är levande och interaktiv...');
    await page.mouse.move(100, 100);
    await page.waitForTimeout(500);
    await page.mouse.move(200, 200);
    await page.waitForTimeout(500);
    await page.mouse.move(300, 300);
    await page.waitForTimeout(1000);
    
    console.log('🎉 Demo slutförd! Videor borde visa riktig användarinteraktion nu.');
    
    // Bara kolla att sidan finns
    await expect(page).toHaveURL(/localhost:3000/);
  });
  
});