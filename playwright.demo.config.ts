import { defineConfig, devices } from '@playwright/test';

/**
 * 🎥 DEMO-KONFIGURATION FÖR PLAYWRIGHT
 * Optimerad för videoinspelning och presentationer
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Kör sekventiellt för bättre demo-flöde
  retries: 0, // Inga retry för demo - visa faktisk prestanda
  workers: 1, // En worker för konsekvent upplevelse
  
  /* HTML-rapport med videos och screenshots */
  reporter: [
    ['html', { 
      outputFolder: 'demo-report',
      open: 'always' // Öppna automatiskt efter tester
    }],
    ['line'], // Konsol-output också
  ],
  
  use: {
    baseURL: 'http://localhost:3000',
    
    /* 🎥 FULLSTÄNDIG VIDEO-INSPELNING */
    video: 'on', // Spela in ALLA tester
    
    /* 📸 SCREENSHOTS VID VARJE STEG */
    screenshot: 'on', // Ta bilder vid varje viktigt steg
    
    /* 🐌 DEMO-MODE - Perfekt hastighet för presentation */
    slowMo: 1500, // 1.5 sekunder - lagom för att kunna följa med
    
    /* 📊 FULLSTÄNDIG TRACE */
    trace: 'on', // Detaljerad trace för alla tester
    
    /* 👀 SYNLIG BROWSER FÖR LIVE-DEMO */
    headless: false, // Visa browser-fönster under testerna
    
    /* 📏 STOR VIEWPORT FÖR PROJEKTORVÄNLIG DEMO */
    viewport: { width: 1920, height: 1080 },
    
    /* ⏱️ LÄNGRE TIMEOUTS FÖR KOMPLEXA FLÖDEN */
    actionTimeout: 30000, // 30 sekunder för varje action
    navigationTimeout: 60000, // 1 minut för navigation
  },

  /* Kör bara på Chrome för demo */
  projects: [
    {
      name: 'demo-chrome',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Använd riktig Chrome istället för Chromium
      },
    },
  ],

  /* Använd befintlig dev-server istället för att starta egen */
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true, // Använd alltid befintlig server
    timeout: 120000,
  },
});