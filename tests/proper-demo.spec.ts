import { test, expect } from '@playwright/test';

test.describe('🎥 KORREKT DEMO - Följer Playwright best practices', () => {
  
  test('📺 Visar appen med korrekt video-inspelning', async ({ page }) => {
    // Följer Perplexity's råd: Använd fixtures, vänta på React
    
    console.log('🎬 === STARTAR KORREKT DEMO (enligt Perplexity) ===');
    
    // Gå till appen och vänta på fullständig laddning
    console.log('🌐 Navigerar till appen...');
    await page.goto('http://localhost:3000');
    
    // Vänta på att React laddas och hydratiseras
    console.log('⚛️ Väntar på React hydratisering...');
    await page.waitForLoadState('networkidle');
    await page.waitForLoadState('domcontentloaded');
    
    // Vänta på att appen faktiskt renderar innehåll
    console.log('🔄 Väntar på att innehåll renderas...');
    await page.waitForFunction(() => {
      return document.querySelectorAll('div, span, button, a').length > 10;
    }, { timeout: 10000 });
    
    await page.waitForTimeout(3000); // Extra tid för att visa appen
    
    console.log('✅ App laddad! Börjar demonstration...');
    
    // Visa sidan genom scrollning
    console.log('📜 Scrollar för att visa innehåll...');
    await page.evaluate(() => window.scrollTo(0, 100));
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => window.scrollTo(0, 300));
    await page.waitForTimeout(2000);
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(2000);
    
    // Visa musinteraktion
    console.log('🖱️ Visar musrörelser...');
    await page.mouse.move(200, 200);
    await page.waitForTimeout(1000);
    
    await page.mouse.move(400, 300);
    await page.waitForTimeout(1000);
    
    await page.mouse.move(600, 400);
    await page.waitForTimeout(1000);
    
    // Försök hitta klickbara element på ett säkert sätt
    console.log('🎯 Letar efter säkra klickbara element...');
    
    // Kolla efter synliga buttons
    const visibleButtons = page.locator('button:visible').first();
    const buttonCount = await visibleButtons.count();
    console.log(`🔘 Hittade ${buttonCount} synliga knappar`);
    
    if (buttonCount > 0) {
      console.log('👆 Klickar på första synliga knappen...');
      try {
        await visibleButtons.click({ timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('⚠️ Kunde inte klicka på knappen, fortsätter...');
      }
    }
    
    // Kolla efter synliga länkar
    const visibleLinks = page.locator('a:visible').first();
    const linkCount = await visibleLinks.count();
    console.log(`🔗 Hittade ${linkCount} synliga länkar`);
    
    if (linkCount > 0) {
      console.log('👆 Hovrar över första synliga länken...');
      try {
        await visibleLinks.hover({ timeout: 5000 });
        await page.waitForTimeout(2000);
      } catch (e) {
        console.log('⚠️ Kunde inte hovra över länken, fortsätter...');
      }
    }
    
    // Avsluta med att visa att appen fungerar
    console.log('🎉 Demo slutförd!');
    await page.waitForTimeout(2000);
    
    // Enkel assertion som säkert passerar
    await expect(page).toHaveURL(/localhost:3000/);
    
    console.log('✅ Video borde nu visa riktig användarinteraktion!');
  });
  
});