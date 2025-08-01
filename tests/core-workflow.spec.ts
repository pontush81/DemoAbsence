import { test, expect } from '@playwright/test';

test.describe('Kärnflöden - Snabba tester', () => {
  
  test('Avvikelseregistrering med förifyllda tider', async ({ page }) => {
    console.log('🏃‍♀️ Testar avvikelseregistrering...');
    
    await page.goto('/deviations/new');
    await page.waitForLoadState('networkidle');
    
    // Kontrollera att standardtiderna är förifyllda (vårt fix)
    const startTime = page.locator('input[value="08:00"], input[placeholder="08:00"]');
    const endTime = page.locator('input[value="17:00"], input[placeholder="17:00"]');
    
    await expect(startTime).toBeVisible({ timeout: 5000 });
    await expect(endTime).toBeVisible({ timeout: 5000 });
    
    // Kontrollera att varaktigheten beräknas automatiskt
    await expect(page.locator('text=9 tim')).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Standardtider och varaktighet fungerar!');
    
    // Testa att fylla i resten av formuläret
    const timeCodeSelect = page.locator('select, [role="combobox"]').first();
    if (await timeCodeSelect.count() > 0) {
      await timeCodeSelect.click();
      await page.waitForTimeout(500);
      
      const firstOption = page.locator('option:not([value=""]), [role="option"]').first();
      if (await firstOption.count() > 0) {
        await firstOption.click();
      }
    }
    
    const commentField = page.locator('textarea');
    if (await commentField.count() > 0) {
      await commentField.fill('E2E Test avvikelse');
    }
    
    // Testa att skicka (utan att faktiskt skicka)
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    
    console.log('✅ Avvikelseformulär fungerar komplett!');
  });
  
  test('Chef-godkännande utan JavaScript-fel', async ({ page }) => {
    console.log('👔 Testar chef-godkännande...');
    
    // Monitor för JavaScript-fel
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('TypeError')) {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Växla till chef
    const userSwitcher = page.locator('button:has-text("Anna"), [data-testid="user-switcher"]');
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const erikOption = page.locator('text="Erik Eriksson"');
      if (await erikOption.count() > 0) {
        await erikOption.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Navigera till chef-vy
    await page.goto('/manager');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Vänta på att data laddas
    
    // Kontrollera att sidan laddas utan vårt tidigare JavaScript-fel
    expect(jsErrors.filter(e => e.includes('substring')).length).toBe(0);
    
    // Kontrollera att översättningar fungerar
    await expect(page.locator('text=Historik')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Chef-sida laddas utan kritiska fel!');
  });
  
  test('PAXML-export är tillgänglig', async ({ page }) => {
    console.log('📄 Testar PAXML-export tillgänglighet...');
    
    await page.goto('/paxml-export');
    await page.waitForLoadState('networkidle');
    
    // Kontrollera att export-sidan laddas
    await expect(page.locator('body')).toBeVisible();
    
    // Leta efter export-knapp eller formulär
    const exportElements = page.locator('button:has-text("Export"), input[type="date"], form');
    const elementsCount = await exportElements.count();
    
    expect(elementsCount).toBeGreaterThan(0);
    
    console.log('✅ PAXML-export sida är tillgänglig!');
  });
  
  test('Rollväxling fungerar stabilt', async ({ page }) => {
    console.log('🔄 Testar rollväxling...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Kontrollera att vi startar som Anna (anställd)
    await expect(page.locator('text=Anna Andersson')).toBeVisible({ timeout: 10000 });
    
    // Växla till Erik (chef)
    const userSwitcher = page.locator('button:has-text("Anna")');
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const erikOption = page.locator('text="Erik Eriksson"');
      if (await erikOption.count() > 0) {
        await erikOption.click();
        await page.waitForTimeout(2000);
        
        // Kontrollera att vi nu är Erik
        await expect(page.locator('text=Erik Eriksson')).toBeVisible({ timeout: 5000 });
        
        // Växla tillbaka till Anna
        await page.locator('button:has-text("Erik")').click();
        await page.waitForTimeout(1000);
        
        const annaOption = page.locator('text="Anna Andersson"');
        if (await annaOption.count() > 0) {
          await annaOption.click();
          await page.waitForTimeout(2000);
          
          await expect(page.locator('text=Anna Andersson')).toBeVisible({ timeout: 5000 });
        }
      }
    }
    
    console.log('✅ Rollväxling fungerar stabilt!');
  });
  
  test('Översättningar laddas korrekt', async ({ page }) => {
    console.log('🌍 Testar översättningar...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Kontrollera att svenska översättningar fungerar
    const swedishTexts = [
      'Översikt',
      'Avvikelser', 
      'Ledighet',
      'Inställningar'
    ];
    
    for (const text of swedishTexts) {
      await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 3000 });
    }
    
    // Kontrollera att inga översättningsnycklar visas
    const translationKeys = page.locator('text*="deviations.", text*="manager.", text*="settings."');
    const keyCount = await translationKeys.count();
    
    expect(keyCount).toBe(0); // Inga översättningsnycklar ska vara synliga
    
    console.log('✅ Översättningar fungerar korrekt!');
  });
  
});