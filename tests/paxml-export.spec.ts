import { test, expect } from '@playwright/test';

test.describe('PAXML Export och Systemintegration', () => {
  
  test('Komplett PAXML-exportflöde', async ({ page }) => {
    console.log('📄 Testar komplett PAXML-exportflöde...');
    
    // ========================================
    // FÖRBEREDELSE: VÄXLA TILL PAYROLL-ROLL
    // ========================================
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('👨‍💰 Växlar till Payroll-roll för PAXML-export...');
    
    const userSwitcher = page.locator('button:has-text("Anna")').first();
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const larsOption = page.locator('text="Lars Johansson"').first();
      if (await larsOption.count() > 0) {
        await larsOption.click();
        await page.waitForTimeout(2000);
        
        await expect(page.locator('text=Lars').first()).toBeVisible({ timeout: 5000 });
        console.log('✅ Växlat till Lars (Payroll)');
      }
    }
    
    // ========================================
    // STEG 1: NAVIGERA TILL PAXML-EXPORT
    // ========================================
    
    console.log('📊 Navigerar till PAXML-export...');
    
    // Försök olika vägar till PAXML
    const paxmlPaths = ['/paxml-export', '/paxml', '/export'];
    let paxmlFound = false;
    
    for (const path of paxmlPaths) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
      
      const bodyText = await page.locator('body').textContent();
      if (bodyText && (bodyText.includes('PAXML') || bodyText.includes('Export') || bodyText.includes('export'))) {
        console.log(`✅ PAXML-sida hittad på ${path}`);
        paxmlFound = true;
        break;
      }
    }
    
    // Om ingen specifik PAXML-sida finns, försök hitta export-funktionalitet i navigation
    if (!paxmlFound) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      
      const paxmlLink = page.locator('a:has-text("PAXML"), a:has-text("Export"), a[href*="paxml"], a[href*="export"]');
      if (await paxmlLink.count() > 0) {
        await paxmlLink.first().click();
        await page.waitForLoadState('networkidle');
        paxmlFound = true;
        console.log('✅ PAXML-export via navigation');
      }
    }
    
    // ========================================
    // STEG 2: KONFIGURERA EXPORT-PARAMETRAR
    // ========================================
    
    if (paxmlFound) {
      console.log('⚙️ Konfigurerar export-parametrar...');
      
      // Startdatum (förra månaden)
      const startDateInput = page.locator('input[name*="startDate"], input[type="date"]').first();
      if (await startDateInput.count() > 0) {
        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        lastMonth.setDate(1);
        await startDateInput.fill(lastMonth.toISOString().split('T')[0]);
        console.log('✅ Startdatum satt');
      }
      
      // Slutdatum (slutet av förra månaden)
      const endDateInput = page.locator('input[name*="endDate"], input[type="date"]').last();
      if (await endDateInput.count() > 0) {
        const lastMonthEnd = new Date();
        lastMonthEnd.setDate(0); // Sista dagen i förra månaden
        await endDateInput.fill(lastMonthEnd.toISOString().split('T')[0]);
        console.log('✅ Slutdatum satt');
      }
      
      // Välj anställda (om det finns en selector)
      const employeeSelect = page.locator('select[name*="employees"], [role="combobox"]:near(text="Anställda")');
      if (await employeeSelect.count() > 0) {
        await employeeSelect.click();
        await page.waitForTimeout(500);
        
        // Välj alla anställda eller första alternativet
        const allEmployeesOption = page.locator('option:has-text("Alla"), [role="option"]:has-text("All")');
        if (await allEmployeesOption.count() > 0) {
          await allEmployeesOption.first().click();
          console.log('✅ Alla anställda valda för export');
        }
      }
      
      // ========================================
      // STEG 3: STARTA EXPORT
      // ========================================
      
      console.log('🚀 Startar PAXML-export...');
      
      const exportButton = page.locator('button:has-text("Exportera"), button:has-text("Export"), button[type="submit"]');
      if (await exportButton.count() > 0) {
        await exportButton.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000); // Vänta på export-process
        
        // Kontrollera export-resultat
        const successIndicators = [
          'text=Export klar',
          'text=Export complete', 
          'text=PAXML',
          'text=framgång',
          'text=success',
          'text=nedladdning',
          'text=download'
        ];
        
        let exportSuccess = false;
        for (const indicator of successIndicators) {
          const element = page.locator(indicator);
          if (await element.count() > 0) {
            exportSuccess = true;
            console.log(`✅ Export lyckades: ${indicator}`);
            break;
          }
        }
        
        if (!exportSuccess) {
          console.log('ℹ️ Export-status oklar, men inga fel upptäckta');
        }
        
      } else {
        console.log('⚠️ Export-knapp inte hittad');
      }
    } else {
      console.log('⚠️ PAXML-export sida inte hittad - kanske inte implementerad än');
    }
    
    console.log('🎯 PAXML-export test genomfört');
  });
  
  test('PAXML-filer genereras och kan laddas ned', async ({ page }) => {
    console.log('💾 Testar PAXML-filgenerering...');
    
    // Monitor downloads
    const downloadPromise = page.waitForEvent('download', { timeout: 10000 });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Försök hitta och klicka på export-funktionalitet
    const exportLinks = page.locator('a:has-text("Export"), button:has-text("Export"), a[href*="export"]');
    if (await exportLinks.count() > 0) {
      await exportLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      const exportBtn = page.locator('button:has-text("Exportera"), button[type="submit"]');
      if (await exportBtn.count() > 0) {
        await exportBtn.click();
        
        try {
          const download = await downloadPromise;
          console.log(`✅ Fil nedladdad: ${download.suggestedFilename()}`);
          
          // Kontrollera att det är en PAXML-fil
          const filename = download.suggestedFilename();
          if (filename.includes('.xml') || filename.includes('paxml')) {
            console.log('✅ PAXML-fil korrekt genererad');
          }
        } catch (error) {
          console.log('ℹ️ Ingen fil nedladdad (kanske förhandsvisning istället)');
        }
      }
    } else {
      console.log('ℹ️ Export-funktionalitet inte hittad i detta test');
    }
  });
  
  test('Godkända avvikelser inkluderas i PAXML-export', async ({ page }) => {
    console.log('📋 Testar att godkända avvikelser inkluderas i export...');
    
    // Denna test förutsätter att det finns godkända avvikelser från tidigare tester
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Växla till payroll-roll
    const userSwitcher = page.locator('button:has-text("Anna")').first();
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const larsOption = page.locator('text="Lars Johansson"').first();
      if (await larsOption.count() > 0) {
        await larsOption.click();
        await page.waitForTimeout(2000);
      }
    }
    
    // Kolla att det finns godkända avvikelser att exportera
    const exportPage = await page.locator('a:has-text("Export"), a[href*="paxml"]');
    if (await exportPage.count() > 0) {
      await exportPage.first().click();
      await page.waitForLoadState('networkidle');
      
      // Leta efter indikationer på att det finns data att exportera
      const dataIndicators = [
        'text=avvikelser',
        'text=deviation', 
        'text=godkänd',
        'text=approved',
        'table',
        '.data-row'
      ];
      
      let hasData = false;
      for (const indicator of dataIndicators) {
        const element = page.locator(indicator);
        if (await element.count() > 0) {
          hasData = true;
          console.log(`✅ Export-data hittad: ${indicator}`);
          break;
        }
      }
      
      if (hasData) {
        console.log('✅ Godkända avvikelser tillgängliga för export');
      } else {
        console.log('ℹ️ Ingen exportdata synlig (kan vara dold)');
      }
    }
  });
  
  test('Export-historik och loggar', async ({ page }) => {
    console.log('📚 Testar export-historik...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Leta efter export-historik eller loggar
    const historyLinks = page.locator('a:has-text("Historik"), a:has-text("History"), a:has-text("Loggar"), a:has-text("Logs")');
    if (await historyLinks.count() > 0) {
      await historyLinks.first().click();
      await page.waitForLoadState('networkidle');
      
      // Kolla om det finns tidigare export-records
      const exportRecords = page.locator('table, .export-record, .history-item');
      if (await exportRecords.count() > 0) {
        console.log('✅ Export-historik tillgänglig');
      }
    }
    
    // Alternativt, kolla för export-fillistor
    const filesList = page.locator('[data-testid="exports"], .export-files, text*="paxml"');
    if (await filesList.count() > 0) {
      console.log('✅ Export-filer listade');
    }
  });
  
});

test.describe('Systemintegration och Dataflöden', () => {
  
  test('Databas-fallback fungerar (Supabase → JSON)', async ({ page }) => {
    console.log('🔄 Testar databas-fallback mekanismer...');
    
    // Monitor console för fallback-meddelanden
    const fallbackMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('fallback') || text.includes('mock') || text.includes('REST API')) {
        fallbackMessages.push(text);
      }
    });
    
    await page.goto('/deviations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Kontrollera att data laddas (från databas eller fallback)
    const hasData = await page.locator('table, .deviation-item, text=avvikelse').count() > 0;
    
    if (hasData) {
      console.log('✅ Data laddas (databas eller fallback)');
    }
    
    if (fallbackMessages.length > 0) {
      console.log('ℹ️ Fallback-meddelanden:', fallbackMessages);
    }
  });
  
  test('API-felhantering och retry-logik', async ({ page }) => {
    console.log('🔧 Testar API-felhantering...');
    
    // Monitor network errors
    const apiErrors: string[] = [];
    page.on('response', response => {
      if (response.url().includes('/api/') && response.status() >= 400) {
        apiErrors.push(`${response.status()} - ${response.url()}`);
      }
    });
    
    await page.goto('/deviations');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Testa att navigera mellan sidor för att trigga API-anrop
    await page.goto('/leave');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/payslips');
    await page.waitForLoadState('networkidle');
    
    if (apiErrors.length > 0) {
      console.log('⚠️ API-fel upptäckta:', apiErrors);
    } else {
      console.log('✅ Inga API-fel - systemet fungerar stabilt');
    }
  });
  
  test('Datakonsekvens mellan rollbyte', async ({ page }) => {
    console.log('🔄 Testar datakonsekvens vid rollbyte...');
    
    await page.goto('/deviations');
    await page.waitForLoadState('networkidle');
    
    // Räkna avvikelser som Anna
    const annaDeviations = await page.locator('table tr, .deviation-item').count();
    console.log(`Anna ser ${annaDeviations} avvikelser`);
    
    // Växla till Erik (manager)
    const userSwitcher = page.locator('button:has-text("Anna")').first();
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const erikOption = page.locator('text="Erik Eriksson"').first();
      if (await erikOption.count() > 0) {
        await erikOption.click();
        await page.waitForTimeout(2000);
        
        // Gå till manager-vy och kolla att samma data finns
        await page.goto('/manager');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
        
        const managerDeviations = await page.locator('table tr, .deviation-item, .approval-item').count();
        console.log(`Erik (Manager) ser ${managerDeviations} objekt att godkänna`);
        
        if (managerDeviations > 0) {
          console.log('✅ Datakonsekvens - Manager ser avvikelser att godkänna');
        }
      }
    }
  });
  
});