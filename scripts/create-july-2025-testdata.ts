#!/usr/bin/env tsx

/**
 * Script to create realistic July 2025 test data for PAXML export
 * This creates approved deviations for demonstration purposes
 */

import fs from 'fs';
import path from 'path';

interface Deviation {
  id: number;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  timeCode: string;
  comment: string;
  status: 'approved' | 'pending' | 'rejected';
  managerComment: string | null;
  lastUpdated: string;
  submitted: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectedBy: string | null;
  rejectedAt: string | null;
}

// Juli 2025 arbetsdagar (måndag-fredag, exklusive helger)
const julyWorkdays = [
  '2025-07-01', '2025-07-02', '2025-07-03', '2025-07-04', // Vecka 27
  '2025-07-07', '2025-07-08', '2025-07-09', '2025-07-10', '2025-07-11', // Vecka 28
  '2025-07-14', '2025-07-15', '2025-07-16', '2025-07-17', '2025-07-18', // Vecka 29
  '2025-07-21', '2025-07-22', '2025-07-23', '2025-07-24', '2025-07-25', // Vecka 30
  '2025-07-28', '2025-07-29', '2025-07-30', '2025-07-31' // Vecka 31
];

const employees = ['E001', 'E002', 'E003', 'E004', 'E005'];

// Realistiska tidkoder och beskrivningar
const timeCodeScenarios = [
  {
    code: '200',
    scenarios: [
      'Akut projektleverans',
      'Kundmöte efter kontorstid',
      'Systemunderhåll',
      'Månadsrapport deadline',
      'Akut support'
    ]
  },
  {
    code: '300',
    scenarios: [
      'Förkylning',
      'Magsjuka',
      'Huvudvärk',
      'Feber',
      'Ryggproblem'
    ]
  },
  {
    code: '400',
    scenarios: [
      'Barn sjukt - förkylning',
      'VAB - feber hos barn',
      'Sjukt barn hemma',
      'Barn kräks',
      'VAB - magsjuka'
    ]
  },
  {
    code: '500',
    scenarios: [
      'Läkarbesök',
      'Tandläkare',
      'Physiotherapy',
      'Läkarkontroll',
      'Specialistbesök'
    ]
  },
  {
    code: '600',
    scenarios: [
      'Familjedag',
      'Semester halvdag',
      'Ledigt för privat ärende',
      'Bröllop i familjen',
      'Flyttdag'
    ]
  }
];

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function generateRandomTime(baseHour: number, variance: number = 2): string {
  const hour = Math.max(8, Math.min(18, baseHour + Math.floor(Math.random() * variance) - variance/2));
  const minute = Math.random() < 0.5 ? 0 : 30;
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
}

function createJulyDeviations(): Deviation[] {
  const deviations: Deviation[] = [];
  let currentId = 1000; // Start från högt ID för att undvika konflikter

  // Skapa 40-50 avvikelser för juli 2025
  for (let i = 0; i < 45; i++) {
    const employeeId = getRandomElement(employees);
    const date = getRandomElement(julyWorkdays);
    const timeCodeScenario = getRandomElement(timeCodeScenarios);
    const scenario = getRandomElement(timeCodeScenario.scenarios);
    
    let startTime: string;
    let endTime: string;
    
    // Olika tidsscheman beroende på tidkod
    switch (timeCodeScenario.code) {
      case '200': // Övertid
        startTime = generateRandomTime(17); // Efter ordinarie arbetstid
        endTime = generateRandomTime(19);
        break;
      case '300': // Sjukdom - ofta hela dagen
      case '400': // VAB - ofta hela dagen
        startTime = '08:00:00';
        endTime = '17:00:00';
        break;
      case '500': // Privat ärende - ofta kortare
        startTime = generateRandomTime(13);
        endTime = generateRandomTime(15);
        break;
      case '600': // Semester/ledigt - halv eller hel dag
        if (Math.random() < 0.5) {
          startTime = '08:00:00';
          endTime = '12:00:00'; // Halvdag
        } else {
          startTime = '08:00:00';
          endTime = '17:00:00'; // Heldag
        }
        break;
      default:
        startTime = '08:00:00';
        endTime = '17:00:00';
    }

    // Skapa approved datum som är några dagar efter submitted
    const submittedDate = new Date(date);
    submittedDate.setDate(submittedDate.getDate() + 1);
    const approvedDate = new Date(submittedDate);
    approvedDate.setDate(approvedDate.getDate() + 1);

    const deviation: Deviation = {
      id: currentId++,
      employeeId,
      date,
      startTime,
      endTime,
      timeCode: timeCodeScenario.code,
      comment: scenario,
      status: 'approved',
      managerComment: 'Godkänt enligt policy',
      lastUpdated: approvedDate.toISOString(),
      submitted: submittedDate.toISOString(),
      approvedBy: 'M001', // Manager ID
      approvedAt: approvedDate.toISOString(),
      rejectedBy: null,
      rejectedAt: null
    };

    deviations.push(deviation);
  }

  return deviations;
}

async function main() {
  try {
    console.log('🎯 Skapar historisk testdata för Juli 2025...');
    
    // Läs befintlig mock data
    const mockDataPath = path.join(process.cwd(), 'mock-data', 'deviations.json');
    let existingDeviations: Deviation[] = [];
    
    if (fs.existsSync(mockDataPath)) {
      const existingData = fs.readFileSync(mockDataPath, 'utf-8');
      existingDeviations = JSON.parse(existingData);
      console.log(`📂 Hittade ${existingDeviations.length} befintliga avvikelser`);
    }

    // Ta bort befintliga Juli 2025 data för att undvika dubbletter
    const filteredExisting = existingDeviations.filter(d => 
      !d.date.startsWith('2025-07')
    );
    
    if (filteredExisting.length !== existingDeviations.length) {
      console.log(`🗑️ Tog bort ${existingDeviations.length - filteredExisting.length} befintliga Juli 2025 poster`);
    }

    // Generera ny Juli 2025 data
    const julyDeviations = createJulyDeviations();
    console.log(`✨ Skapade ${julyDeviations.length} nya Juli 2025 avvikelser`);

    // Kombinera och sortera
    const allDeviations = [...filteredExisting, ...julyDeviations]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Spara tillbaka till fil
    fs.writeFileSync(mockDataPath, JSON.stringify(allDeviations, null, 2));
    
    console.log('✅ Juli 2025 testdata skapad!');
    console.log('\n📊 Sammanfattning:');
    
    // Sammanställning per anställd
    const summaryByEmployee = julyDeviations.reduce((acc, dev) => {
      acc[dev.employeeId] = (acc[dev.employeeId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Sammanställning per tidkod
    const summaryByTimeCode = julyDeviations.reduce((acc, dev) => {
      acc[dev.timeCode] = (acc[dev.timeCode] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.log('\n👥 Per anställd:');
    Object.entries(summaryByEmployee).forEach(([emp, count]) => {
      console.log(`   ${emp}: ${count} avvikelser`);
    });

    console.log('\n🏷️ Per tidkod:');
    Object.entries(summaryByTimeCode).forEach(([code, count]) => {
      const codeNames = {
        '200': 'Övertid',
        '300': 'Sjukdom',  
        '400': 'VAB',
        '500': 'Privat ärende',
        '600': 'Semester/ledigt'
      };
      console.log(`   ${code} (${codeNames[code as keyof typeof codeNames]}): ${count} avvikelser`);
    });

    console.log('\n🎯 Nu kan du testa PAXML export med Juli 2025 data!');
    console.log('   - Gå till http://localhost:3000/paxml-export');
    console.log('   - Välj "Föregående månad" eller "Juli 2025"');
    console.log('   - Alla avvikelser är redan godkända och redo för export');

  } catch (error) {
    console.error('❌ Fel vid skapande av testdata:', error);
    process.exit(1);
  }
}

// Kör scriptet
main();