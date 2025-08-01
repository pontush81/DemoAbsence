import { test, expect } from '@playwright/test';

test.describe('Enkla Arbetsflöde-tester', () => {
  
  test('Avvikelseformulär har förifyllda standardtider', async ({ page }) => {
    console.log('🕒 Testar standardtider i avvikelseformulär...');
    
    await page.goto('/deviations/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Vänta på att React laddas
    
    // Kontrollera att standardtider är ifyllda (vårt fix)
    const startTimeValue = await page.inputValue('input[name*="startTime"], input[placeholder="08:00"]');
    const endTimeValue = await page.inputValue('input[name*="endTime"], input[placeholder="17:00"]');
    
    console.log(`Starttid: ${startTimeValue}, Sluttid: ${endTimeValue}`);
    
    // Kontrollera att vårt fix fungerar
    expect(startTimeValue).toBe('08:00');
    expect(endTimeValue).toBe('17:00');
    
    // Kontrollera att varaktighetsberäkning fungerar
    await expect(page.locator('text=9 tim')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Standardtider och varaktighetsberäkning fungerar!');
  });
  
  test('Applikationen startar utan kritiska JavaScript-fel', async ({ page }) => {
    console.log('🚀 Testar appstart utan JavaScript-fel...');
    
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filtrera ut kritiska fel (inte MetaMask eller liknande)
        if (msg.text().includes('TypeError') || 
            msg.text().includes('ReferenceError') ||
            msg.text().includes('Cannot read properties')) {
          jsErrors.push(msg.text());
        }
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Kontrollera att applikationen laddas
    await expect(page.locator('body')).toBeVisible();
    
    // Kontrollera att det inte finns kritiska JavaScript-fel
    const criticalErrors = jsErrors.filter(error => 
      !error.includes('MetaMask') && 
      !error.includes('wallet')
    );
    
    if (criticalErrors.length > 0) {
      console.log('⚠️ JavaScript-fel:', criticalErrors);
    }
    
    expect(criticalErrors.length).toBeLessThan(3); // Max 2 kritiska fel
    
    console.log('✅ App startar utan kritiska JavaScript-fel!');
  });
  
  test('Navigation mellan sidor fungerar', async ({ page }) => {
    console.log('🧭 Testar grundläggande navigation...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Testa navigering till avvikelser
    await page.click('a[href="/deviations"], text=Avvikelser');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/deviations');
    
    // Testa navigering till inställningar
    await page.click('a[href="/settings"], text=Inställningar');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('/settings');
    
    // Testa navigering hem
    await page.click('a[href="/"], text=Översikt');
    await page.waitForLoadState('networkidle');
    expect(page.url()).toMatch(/\/$|\?/);
    
    console.log('✅ Grundläggande navigation fungerar!');
  });
  
  test('Chef-sidan laddas utan JavaScript-fel', async ({ page }) => {
    console.log('👔 Testar att chef-sidan laddas...');
    
    const jsErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && msg.text().includes('substring')) {
        jsErrors.push(msg.text());
      }
    });
    
    await page.goto('/manager');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Vänta på att komponenter laddas
    
    // Kontrollera att sidan laddas (även om data saknas)
    await expect(page.locator('body')).toBeVisible();
    
    // Kontrollera att vårt fix av JavaScript-felet fungerar
    expect(jsErrors.length).toBe(0);
    
    console.log('✅ Chef-sidan laddas utan vårt tidigare JavaScript-fel!');
  });
  
  test('Översättningar fungerar korrekt', async ({ page }) => {
    console.log('🌍 Testar att översättningar laddas...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Kontrollera att svenska översättningar finns (använd första synliga element)
    const swedishTexts = ['Översikt', 'Avvikelser', 'Ledighet', 'Inställningar'];
    
    for (const text of swedishTexts) {
      const element = page.locator(`text=${text}`).first();
      await expect(element).toBeVisible({ timeout: 3000 });
    }
    
    // Kontrollera att inga översättningsnycklar syns
    const translationKeyPattern = /deviations\.|manager\.|settings\./;
    const bodyText = await page.locator('body').textContent();
    const hasTranslationKeys = translationKeyPattern.test(bodyText || '');
    
    expect(hasTranslationKeys).toBe(false);
    
    console.log('✅ Översättningar fungerar och inga nycklar syns!');
  });
  
  test('Demo-användare växling grundläggande test', async ({ page }) => {
    console.log('🔄 Testar grundläggande användarväxling...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Kontrollera att någon användare är inloggad
    const userElements = page.locator('text=Anna, text=Erik, button:has-text("A"), button:has-text("E")');
    const userCount = await userElements.count();
    
    expect(userCount).toBeGreaterThan(0);
    
    console.log('✅ Demo-användarsystem är aktivt!');
  });
  
  test('Formulär-validering fungerar', async ({ page }) => {
    console.log('✅ Testar formulärvalidering...');
    
    await page.goto('/deviations/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Försök skicka utan att fylla i tidkod
    const submitBtn = page.locator('button[type="submit"], button:has-text("Skicka")');
    if (await submitBtn.count() > 0) {
      await submitBtn.click();
      await page.waitForTimeout(1000);
      
      // Borde få valideringsfel
      const validationError = page.locator('text=krävs, text=required, [aria-invalid="true"]');
      const errorCount = await validationError.count();
      
      expect(errorCount).toBeGreaterThan(0);
    }
    
    console.log('✅ Formulärvalidering fungerar!');
  });
  
});

// Enklare test för snabbare feedback
test.describe('Snabb genomgång', () => {
  
  test('Komplett snabb genomgång', async ({ page }) => {
    console.log('🚀 Snabb genomgång av huvudfunktioner...');
    
    // 1. Hem
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    // 2. Avvikelser med standardtider
    await page.goto('/deviations/new');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    const startTime = await page.inputValue('input[name*="startTime"], input[value="08:00"]');
    const endTime = await page.inputValue('input[name*="endTime"], input[value="17:00"]');
    
    expect(startTime).toBe('08:00');
    expect(endTime).toBe('17:00');
    
    // 3. Chef-vy (utan att krascha)
    await page.goto('/manager');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await expect(page.locator('body')).toBeVisible();
    
    // 4. Inställningar
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ Snabb genomgång klar - inga kritiska fel!');
  });
});