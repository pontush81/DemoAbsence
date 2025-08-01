# 🎥 Demo & Video-inspelning Guide

Detta system har omfattande stöd för **video-inspelning av tester** som är perfekt för demos, dokumentation och troubleshooting.

## 🚀 Snabbstart - Spela in Demo

### **1. VERKLIGA WORKFLOW DEMOS (Rekommenderat!):**
```bash
# 🎬 KOMPLETT ANVÄNDARRESA (10-15 min)
# Anställd registrerar → Chef godkänner → PAXML export
npm run demo

# 👀 LIVE-DEMO med synlig browser (perfekt för presentation)
npm run demo:record

# 📊 Visa interaktiv rapport med videos
npm run demo:show
```

### **2. Snabba funktionstest (3-5 min):**
```bash
# Korta tekniska tester av kärnfunktioner
npm run demo:fast
```

### **3. Fullständig demo-suite:**
```bash
# Alla scenarios: Avvikelse + Semester + Rollväxling
npm run demo:full
```

## 🎬 Alla Video-alternativ

### **A. Automatisk Video-inspelning**
```bash
# Standard tester med video vid fel
npx playwright test --project=chromium

# Alla tester med video
npx playwright test --project=chromium --video=on

# Specifik testfil med video
npx playwright test tests/simple-workflow.spec.ts --video=on
```

### **B. Live Demo (Synlig Browser)**
```bash
# Visa browser under testerna - perfekt för live-presentation
npx playwright test --headed --project=chromium

# Långsam demo-mode (2 sek mellan actions)
npx playwright test --headed --config=playwright.demo.config.ts

# Interaktiv debugging (pausa mellan steg)
npx playwright test --debug tests/demo-presentation.spec.ts
```

### **C. Fullständig Inspelning för Dokumentation**
```bash
# Komplett demo med allt material
npx playwright test tests/demo-presentation.spec.ts --config=playwright.demo.config.ts

# Alla workflows med video
npx playwright test tests/leave-workflow.spec.ts tests/role-switching.spec.ts --video=on
```

## 📂 Vart Sparas Videorna?

### **Vanliga tester:**
- **Videos:** `test-results/[test-name]/video.webm`
- **Screenshots:** `test-results/[test-name]/test-failed-1.png`
- **HTML-rapport:** `playwright-report/index.html`

### **Demo-tester:**
- **Videos:** `demo-report/videos/`
- **Screenshots:** `demo-report/screenshots/`
- **HTML-rapport:** `demo-report/index.html`

## 🎯 Demo-scenarios Som Finns

### **🎬 VERKLIGA WORKFLOWS (`tests/real-workflow-demo.spec.ts`) - NYA & FÖRBÄTTRADE!**

#### **📋 SCENARIO 1: Komplett Avvikelseflöde (10-15 min)**
1. **Anna kommer sent** → ser dashboard → navigerar till avvikelser
2. **Registrerar avvikelse** → förifyllda tider → ändrar 09:00-18:00 → FLEX → kommentar
3. **Skickar för godkännande** → bekräftelse
4. **Växlar till Erik (Chef)** → ser väntande godkännanden
5. **Erik granskar** → läser förklaring → godkänner
6. **Växlar till Lars (Payroll)** → PAXML export → Kontek Lön
7. **Slutresultat:** Komplett kedja från anställd till lönesystem!

#### **🏖️ SCENARIO 2: Komplett Semesterflöde (8-12 min)**
1. **Anna planerar semester** → 5 dagars familjesemester
2. **Fyller ansökan** → väljer datum → förklaring
3. **Erik godkänner** → kontrollerar sparade dagar
4. **Semester exporteras** automatiskt i PAXML

### **⚡ SNABBA FUNKTIONSTEST (`tests/simple-workflow.spec.ts`):**
- Förifyllda tider (10 sek)
- Chef-sida laddar (15 sek)  
- App-stabilitet (20 sek)
- **OBS:** Dessa är tekniska tester, inte användarscenarios!

### **🎭 ANDRA SCENARIOS (Tillgängliga men ej optimerade):**
- **Rollväxling** (`tests/role-switching.spec.ts`)
- **Ledighetstyper** (`tests/leave-workflow.spec.ts`)  
- **PAXML Export** (`tests/paxml-export.spec.ts`)

## 🛠️ Konfigurera Egen Demo

### **1. Anpassa video-inställningar:**
```typescript
// playwright.demo.config.ts
use: {
  video: 'on',              // Spela in alla tester
  slowMo: 2000,            // 2 sekunder mellan actions
  headless: false,         // Visa browser
  screenshot: 'on',        // Screenshots vid varje steg
}
```

### **2. Skapa egna demo-tester:**
```typescript
test('Min Demo', async ({ page }) => {
  console.log('🎬 Startar min demo...');
  
  // Ta screenshot för dokumentation
  await page.screenshot({ path: 'demo-report/min-demo.png' });
  
  // Långsam navigation för demo
  await page.waitForTimeout(2000);
});
```

## 📹 Använda Videos för Presentation

### **1. Öppna HTML-rapporten:**
```bash
npm run demo:show
# eller
npx playwright show-report demo-report
```

### **2. Video-format:**
- **Format:** WebM (fungerar i alla moderna browsers)
- **Kvalitet:** HD 1920x1080
- **Storlek:** ~2-5MB per minut

### **3. Extrahera specifika videos:**
```bash
# Hitta video-filer
find demo-report -name "*.webm"

# Kopiera för presentation
cp demo-report/videos/* presentation-videos/
```

## 🎯 Rekommenderade Demo-kommandon

### **För Live-presentation:**
```bash
# Starta dev-server
npm run dev

# I separat terminal - kör live demo
npm run demo:record
```

### **För Dokumentation:**
```bash
# Generera fullständig video-dokumentation
npm run demo
npm run demo:show
```

### **För Snabb Verifiering:**
```bash
# Test kärnfunktioner med video-bekräftelse
npm run demo:fast
```

## 🚨 Troubleshooting

### **Problem: Browser öppnas inte**
```bash
# Installera browsers
npx playwright install

# Specifik browser
npx playwright install chromium
```

### **Problem: Videos sparas inte**
```bash
# Kontrollera konfiguration
cat playwright.config.ts | grep video

# Tvinga video på
npx playwright test --video=on
```

### **Problem: Långsamma tester**
```bash
# Snabbare demo utan slowMo
npx playwright test --config=playwright.config.ts

# Bara Chrome
npx playwright test --project=chromium
```

## 🎉 Resultat

Efter att ha kört demo-testerna får du:
- ✅ **HD-videos** av hela workflows
- ✅ **Screenshots** vid viktiga steg
- ✅ **Interaktiv HTML-rapport** 
- ✅ **Trace-filer** för detaljerad analys
- ✅ **Presentation-material** redo att visa

Perfect för att visa:
- Kunder hur systemet fungerar
- Utvecklare vad som ska byggas
- Support-team hur man troubleshootar
- Chefer vad som är klart