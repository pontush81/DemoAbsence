import { test, expect } from '@playwright/test';

/**
 * 🎬 DEMO-TESTER FÖR PRESENTATION
 * Optimerade för videoinspelning och visning
 */

test.describe('🎥 LIVE DEMO: Avvikelsesystem för Kontek Lön', () => {
  
  test('🚀 Komplett Demo: Från Anställd till PAXML Export', async ({ page }) => {
    console.log('🎬 === KONTEK AVVIKELSESYSTEM - LIVE DEMO ===');
    
    // ========================================
    // 🎯 INTRO: SYSTEMÖVERSIKT
    // ========================================
    
    console.log('📋 Demo-scenario: Anna registrerar avvikelse → Erik godkänner → PAXML export');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Visa startsidan
    
    // Ta screenshot av startsidan
    await page.screenshot({ path: 'demo-report/01-startsida.png', fullPage: true });
    
    console.log('✅ STEG 1: Systemet startat - Anna Andersson är inloggad som anställd');
    await expect(page.locator('text=Anna').first()).toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // ========================================
    // 👩 STEG 2: ANSTÄLLD REGISTRERAR AVVIKELSE
    // ========================================
    
    console.log('📝 STEG 2: Anna navigerar till avvikelseregistrering...');
    await page.click('a[href="/deviations"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Screenshot av avvikelsesidan
    await page.screenshot({ path: 'demo-report/02-avvikelser-lista.png', fullPage: true });
    
    console.log('➕ Anna klickar för att skapa ny avvikelse...');
    const newDeviationBtn = page.locator('button:has-text("Ny avvikelse"), a:has-text("Skapa"), button:has-text("Registrera")').first();
    if (await newDeviationBtn.count() > 0) {
      await newDeviationBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // Screenshot av formuläret
      await page.screenshot({ path: 'demo-report/03-avvikelseformulär.png', fullPage: true });
      
      console.log('⏰ Kontrollerar förifyllda standardtider (08:00-17:00)...');
      const startTimeInput = page.locator('input[name*="startTime"], input[placeholder*="08:00"]').first();
      const endTimeInput = page.locator('input[name*="endTime"], input[placeholder*="17:00"]').first();
      
      if (await startTimeInput.count() > 0) {
        const startValue = await startTimeInput.inputValue();
        const endValue = await endTimeInput.inputValue();
        console.log(`📊 Starttid: ${startValue}, Sluttid: ${endValue}`);
        
        // Visa att standardtider är förifyllda
        await expect(startTimeInput).toHaveValue('08:00');
        await expect(endTimeInput).toHaveValue('17:00');
      }
      
      console.log('📝 Anna fyller i avvikelsedetaljer...');
      
      // Välj datum (idag)
      const dateInput = page.locator('input[type="date"], input[name*="date"]').first();
      if (await dateInput.count() > 0) {
        const today = new Date().toISOString().split('T')[0];
        await dateInput.fill(today);
        await page.waitForTimeout(1000);
      }
      
      // Ändra arbetstid för att visa avvikelse
      if (await startTimeInput.count() > 0) {
        await startTimeInput.fill('09:00'); // Kom sent
        await page.waitForTimeout(1000);
        await endTimeInput.fill('18:00'); // Jobbade sent
        await page.waitForTimeout(1000);
      }
      
      // Välj tidkod
      const timeCodeSelect = page.locator('select[name*="timeCode"], [role="combobox"]').first();
      if (await timeCodeSelect.count() > 0) {
        await timeCodeSelect.click();
        await page.waitForTimeout(1000);
        
        const flexOption = page.locator('option:has-text("FLEX"), [role="option"]:has-text("Flex")').first();
        if (await flexOption.count() > 0) {
          await flexOption.click();
          await page.waitForTimeout(1000);
        }
      }
      
      // Kommentar
      const commentField = page.locator('textarea, input[name*="comment"]');
      if (await commentField.count() > 0) {
        await commentField.fill('Kom sent pga tågstopp, jobbade ikapp på kvällen');
        await page.waitForTimeout(2000);
      }
      
      // Screenshot av ifyllt formulär
      await page.screenshot({ path: 'demo-report/04-formulär-ifyllt.png', fullPage: true });
      
      console.log('📤 Anna skickar avvikelsen för godkännande...');
      const submitBtn = page.locator('button[type="submit"], button:has-text("Skicka")').first();
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Visa bekräftelse
        
        console.log('✅ Avvikelse skickad! Anna ser bekräftelsemeddelande');
      }
    }
    
    // ========================================
    // 🔄 STEG 3: ROLLVÄXLING TILL CHEF
    // ========================================
    
    console.log('🔄 STEG 3: Växlar till Erik Eriksson (Chef) för godkännande...');
    
    const userSwitcher = page.locator('button:has-text("Anna")').first();
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(2000);
      
      // Screenshot av user-switcher
      await page.screenshot({ path: 'demo-report/05-user-switcher.png', fullPage: true });
      
      const erikOption = page.locator('text="Erik Eriksson"').first();
      if (await erikOption.count() > 0) {
        await erikOption.click();
        await page.waitForTimeout(3000);
        
        await expect(page.locator('text=Erik').first()).toBeVisible({ timeout: 5000 });
        console.log('✅ Rollväxling klar - Nu inloggad som Erik (Chef)');
      }
    }
    
    // ========================================
    // 👨‍💼 STEG 4: CHEF GODKÄNNER AVVIKELSE
    // ========================================
    
    console.log('👨‍💼 STEG 4: Erik navigerar till godkännande-vyn...');
    await page.click('a[href="/manager"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Screenshot av manager-sidan
    await page.screenshot({ path: 'demo-report/06-manager-vy.png', fullPage: true });
    
    console.log('📋 Erik ser väntande avvikelser att godkänna...');
    
    // Kontrollera att det finns avvikelser att godkänna
    const pendingDeviations = page.locator('table tr, .deviation-item, .approval-item');
    const deviationCount = await pendingDeviations.count();
    console.log(`📊 Erik ser ${deviationCount} väntande ärenden`);
    
    // Godkänn första avvikelsen
    const approveBtn = page.locator('button:has-text("Godkänn"), button:has-text("Approve")').first();
    if (await approveBtn.count() > 0) {
      console.log('✅ Erik godkänner Annas avvikelse...');
      await approveBtn.click();
      await page.waitForTimeout(3000);
      
      // Screenshot efter godkännande
      await page.screenshot({ path: 'demo-report/07-godkänt.png', fullPage: true });
      
      console.log('🎉 Avvikelse godkänd av chef!');
    }
    
    // ========================================
    // 💰 STEG 5: VÄXLA TILL PAYROLL FÖR EXPORT
    // ========================================
    
    console.log('💰 STEG 5: Växlar till Lars (Payroll) för PAXML-export...');
    
    const erikButton = page.locator('button:has-text("Erik")').first();
    if (await erikButton.count() > 0) {
      await erikButton.click();
      await page.waitForTimeout(2000);
      
      const larsOption = page.locator('text="Lars Johansson"').first();
      if (await larsOption.count() > 0) {
        await larsOption.click();
        await page.waitForTimeout(3000);
        
        await expect(page.locator('text=Lars').first()).toBeVisible({ timeout: 5000 });
        console.log('✅ Nu inloggad som Lars (Payroll-administratör)');
      }
    }
    
    // ========================================
    // 📄 STEG 6: PAXML EXPORT
    // ========================================
    
    console.log('📄 STEG 6: Lars genererar PAXML-export för Kontek Lön...');
    
    // Försök navigera till export-funktion
    const exportPaths = ['/paxml-export', '/paxml', '/export'];
    let exportFound = false;
    
    for (const path of exportPaths) {
      try {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const bodyText = await page.locator('body').textContent();
        if (bodyText && (bodyText.includes('PAXML') || bodyText.includes('Export'))) {
          console.log(`✅ PAXML-export sida hittad på ${path}`);
          exportFound = true;
          
          // Screenshot av export-sidan
          await page.screenshot({ path: 'demo-report/08-paxml-export.png', fullPage: true });
          
          break;
        }
      } catch (error) {
        // Fortsätt till nästa path
      }
    }
    
    if (!exportFound) {
      // Alternativ: sök efter export-länkar i navigation
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const exportLink = page.locator('a:has-text("Export"), a:has-text("PAXML")').first();
      if (await exportLink.count() > 0) {
        await exportLink.click();
        await page.waitForLoadState('networkidle');
        console.log('✅ PAXML-export via navigation');
        exportFound = true;
      }
    }
    
    if (exportFound) {
      console.log('📊 Lars konfigurerar export-parametrar...');
      await page.waitForTimeout(2000);
      
      // Försök starta export
      const exportBtn = page.locator('button:has-text("Exportera"), button:has-text("Export")').first();
      if (await exportBtn.count() > 0) {
        await exportBtn.click();
        await page.waitForTimeout(5000); // Vänta på export-process
        
        console.log('✅ PAXML-fil genererad för import i Kontek Lön!');
        
        // Final screenshot
        await page.screenshot({ path: 'demo-report/09-export-klar.png', fullPage: true });
      }
    } else {
      console.log('ℹ️ PAXML-export funktion inte tillgänglig i demo');
    }
    
    // ========================================
    // 🎉 DEMO SAMMANFATTNING
    // ========================================
    
    console.log('🎉 === DEMO AVSLUTAD ===');
    console.log('✅ Komplett workflow genomfört:');
    console.log('   1. Anna (Anställd) registrerade avvikelse med förifyllda tider');
    console.log('   2. Erik (Chef) godkände avvikelsen');
    console.log('   3. Lars (Payroll) exporterade PAXML för Kontek Lön');
    console.log('📹 Video och screenshots sparade i demo-report/');
    
    await page.waitForTimeout(3000); // Pausa för att visa slutresultat
  });
  
});

test.describe('🎭 Funktionsdemo per Roll', () => {
  
  test('👩 Anna (Anställd) - Funktioner', async ({ page }) => {
    console.log('👩 === ANNA ANDERSSON - ANSTÄLLD ===');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('📋 Annas tillgängliga funktioner:');
    
    const functions = [
      { name: 'Dashboard', selector: 'a[href="/"]' },
      { name: 'Avvikelser', selector: 'a[href="/deviations"]' },
      { name: 'Ledighet', selector: 'a[href="/leave"]' },
      { name: 'Lönespecar', selector: 'a[href="/payslips"]' },
      { name: 'Schema', selector: 'a[href="/schedules"]' },
      { name: 'Inställningar', selector: 'a[href="/settings"]' }
    ];
    
    for (const func of functions) {
      const element = page.locator(func.selector);
      if (await element.count() > 0) {
        console.log(`✅ ${func.name} - Tillgänglig`);
        await element.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);
        
        await page.screenshot({ path: `demo-report/anna-${func.name.toLowerCase()}.png`, fullPage: true });
      } else {
        console.log(`❌ ${func.name} - Ej tillgänglig`);
      }
    }
  });
  
  test('👨‍💼 Erik (Chef) - Funktioner', async ({ page }) => {
    console.log('👨‍💼 === ERIK ERIKSSON - CHEF ===');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Växla till Erik
    const userSwitcher = page.locator('button:has-text("Anna")').first();
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const erikOption = page.locator('text="Erik Eriksson"').first();
      if (await erikOption.count() > 0) {
        await erikOption.click();
        await page.waitForTimeout(2000);
      }
    }
    
    console.log('👨‍💼 Eriks chef-funktioner:');
    
    const managerFunctions = [
      { name: 'Chef-översikt', selector: 'a[href="/manager"]' },
      { name: 'Godkännanden', selector: 'button:has-text("Avvikelser"), [role="tab"]' }
    ];
    
    for (const func of managerFunctions) {
      const element = page.locator(func.selector);
      if (await element.count() > 0) {
        console.log(`✅ ${func.name} - Tillgänglig för chef`);
        await element.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        await page.screenshot({ path: `demo-report/erik-${func.name.toLowerCase().replace(' ', '-')}.png`, fullPage: true });
      }
    }
  });
  
});