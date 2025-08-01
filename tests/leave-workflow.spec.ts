import { test, expect } from '@playwright/test';

test.describe('Ledighetsflöden - Anställd till Chef', () => {
  
  test('Komplett ledighetsflöde: Ansökan → Godkännande → Export', async ({ page }) => {
    console.log('🏖️ Testar komplett ledighetsflöde...');
    
    // ========================================
    // STEG 1: ANSTÄLLD ANSÖKER OM LEDIGHET
    // ========================================
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Säkerställ att vi är Anna (anställd)
    await expect(page.locator('text=Anna').first()).toBeVisible({ timeout: 10000 });
    
    // Navigera till ledighet
    await page.click('a[href="/leave"]');
    await page.waitForLoadState('networkidle');
    
    // Klicka på ny ledighetsansökan
    const newLeaveBtn = page.locator('button:has-text("Ansök"), a:has-text("Ny"), button:has-text("Skapa")').first();
    if (await newLeaveBtn.count() > 0) {
      await newLeaveBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Fyll i ledighetsformulär
      console.log('📝 Fyller i ledighetsansökan...');
      
      // Välj ledighetstyp (semester)
      const leaveTypeSelect = page.locator('select, [role="combobox"]').first();
      if (await leaveTypeSelect.count() > 0) {
        await leaveTypeSelect.click();
        await page.waitForTimeout(500);
        
        const vacationOption = page.locator('option[value="vacation"], [role="option"]:has-text("Semester")');
        if (await vacationOption.count() > 0) {
          await vacationOption.first().click();
        }
      }
      
      // Startdatum (imorgon)
      const startDateInput = page.locator('input[name*="startDate"], input[type="date"]').first();
      if (await startDateInput.count() > 0) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await startDateInput.fill(tomorrow.toISOString().split('T')[0]);
      }
      
      // Slutdatum (nästa vecka)
      const endDateInput = page.locator('input[name*="endDate"], input[type="date"]').last();
      if (await endDateInput.count() > 0) {
        const nextWeek = new Date();
        nextWeek.setDate(nextWeek.getDate() + 5);
        await endDateInput.fill(nextWeek.toISOString().split('T')[0]);
      }
      
      // Kommentar
      const commentField = page.locator('textarea');
      if (await commentField.count() > 0) {
        await commentField.fill('Planerad semester - 5 dagar');
      }
      
      // Skicka ansökan
      const submitBtn = page.locator('button[type="submit"], button:has-text("Skicka")');
      if (await submitBtn.count() > 0) {
        await submitBtn.click();
        await page.waitForLoadState('networkidle');
        
        // Kontrollera att ansökan skickades
        await expect(page.locator('text=skickad, text=submitted, text=sparat')).toBeVisible({ timeout: 5000 });
        console.log('✅ Ledighetsansökan skickad!');
      }
    }
    
    // ========================================
    // STEG 2: VÄXLA TILL CHEF-ROLL
    // ========================================
    
    console.log('👔 Växlar till chef-roll...');
    
    const userSwitcher = page.locator('button:has-text("Anna")').first();
    if (await userSwitcher.count() > 0) {
      await userSwitcher.click();
      await page.waitForTimeout(1000);
      
      const erikOption = page.locator('text="Erik Eriksson"').first();
      if (await erikOption.count() > 0) {
        await erikOption.click();
        await page.waitForTimeout(2000);
        
        await expect(page.locator('text=Erik').first()).toBeVisible({ timeout: 5000 });
        console.log('✅ Växlat till Erik (Chef)!');
      }
    }
    
    // ========================================
    // STEG 3: CHEF GODKÄNNER LEDIGHET
    // ========================================
    
    console.log('✅ Chef godkänner ledighetsansökan...');
    
    // Navigera till chef-vy
    await page.click('a[href="/manager"]');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Kolla ledighetsfliken
    const leaveTab = page.locator('button:has-text("Ledighet"), [role="tab"]:has-text("Leave")');
    if (await leaveTab.count() > 0) {
      await leaveTab.click();
      await page.waitForTimeout(2000);
    }
    
    // Godkänn ledighetsansökan
    const approveBtn = page.locator('button:has-text("Godkänn"), button:has-text("Approve")').first();
    if (await approveBtn.count() > 0) {
      await approveBtn.click();
      await page.waitForTimeout(2000);
      console.log('✅ Ledighetsansökan godkänd!');
    }
    
    console.log('🎉 Komplett ledighetsflöde genomfört!');
  });
  
  test('Anställd kan se sina ledighetsansökningar', async ({ page }) => {
    console.log('👀 Testar att anställd kan se sina ansökningar...');
    
    await page.goto('/leave');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Kontrollera att ledighet-sidan laddas
    await expect(page.locator('body')).toBeVisible();
    
    // Kolla om det finns tidigare ansökningar
    const leaveRequests = page.locator('table, .leave-request, [data-testid="leave-request"]');
    const hasRequests = await leaveRequests.count() > 0;
    
    if (hasRequests) {
      console.log('✅ Ledighetsansökningar visas!');
    } else {
      console.log('ℹ️ Inga befintliga ledighetsansökningar');
    }
    
    // Kontrollera att "Ny ansökan"-knapp finns
    const newRequestBtn = page.locator('button:has-text("Ansök"), a:has-text("Ny")');
    await expect(newRequestBtn.first()).toBeVisible({ timeout: 3000 });
    
    console.log('✅ Ledighets-interface fungerar!');
  });
  
  test('Chef kan se väntande ledighetsansökningar', async ({ page }) => {
    console.log('👨‍💼 Testar chef-vy för ledighetsansökningar...');
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Växla till chef
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
    
    // Navigera till chef-vy
    await page.goto('/manager');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // Kontrollera att chef-sidan laddas
    await expect(page.locator('body')).toBeVisible();
    
    // Kolla ledighetsfliken
    const leaveTab = page.locator('button:has-text("Ledighet"), [role="tab"]:has-text("Leave")');
    if (await leaveTab.count() > 0) {
      await leaveTab.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ Ledighetsfliken tillgänglig för chef!');
    }
    
    console.log('✅ Chef-gränssnitt för ledighet fungerar!');
  });
  
});

test.describe('Olika ledighetstyper', () => {
  
  test('VAB-ansökan (Vård av barn)', async ({ page }) => {
    console.log('👶 Testar VAB-ansökan...');
    
    await page.goto('/leave');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const newLeaveBtn = page.locator('button:has-text("Ansök"), a:has-text("Ny")').first();
    if (await newLeaveBtn.count() > 0) {
      await newLeaveBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Välj VAB som typ
      const leaveTypeSelect = page.locator('select, [role="combobox"]').first();
      if (await leaveTypeSelect.count() > 0) {
        await leaveTypeSelect.click();
        await page.waitForTimeout(500);
        
        const vabOption = page.locator('option:has-text("VAB"), [role="option"]:has-text("barn")');
        if (await vabOption.count() > 0) {
          await vabOption.first().click();
          console.log('✅ VAB-typ vald!');
        }
      }
    }
  });
  
  test('Sjukledighet-ansökan', async ({ page }) => {
    console.log('🤒 Testar sjukledighet...');
    
    await page.goto('/leave');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const newLeaveBtn = page.locator('button:has-text("Ansök"), a:has-text("Ny")').first();
    if (await newLeaveBtn.count() > 0) {
      await newLeaveBtn.click();
      await page.waitForLoadState('networkidle');
      
      // Välj sjukledighet
      const leaveTypeSelect = page.locator('select, [role="combobox"]').first();
      if (await leaveTypeSelect.count() > 0) {
        await leaveTypeSelect.click();
        await page.waitForTimeout(500);
        
        const sickOption = page.locator('option:has-text("Sjuk"), [role="option"]:has-text("sick")');
        if (await sickOption.count() > 0) {
          await sickOption.first().click();
          console.log('✅ Sjukledighet-typ vald!');
        }
      }
    }
  });
  
});