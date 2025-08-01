import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Typer
interface Employee {
  id: number;
  employeeId: string;
  firstName: string;
  lastName: string;
  scheduleTemplate: string;
  status: string;
}

interface Schedule {
  id: number;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  breakStart: string | null;
  breakEnd: string | null;
  status: string;
}

// Schema-mallar
const scheduleTemplates = {
  standard: {
    startTime: "08:00:00",
    endTime: "17:00:00",
    breakStart: "12:00:00",
    breakEnd: "13:00:00"
  },
  flexible: {
    startTime: "08:30:00",
    endTime: "17:30:00",
    breakStart: "12:00:00",
    breakEnd: "13:00:00"
  },
  manager: {
    startTime: "09:00:00",
    endTime: "18:00:00",
    breakStart: "12:30:00",
    breakEnd: "13:30:00"
  }
};

// Hjälpfunktioner
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // Söndag eller lördag
}

function isSwedishHoliday(date: Date): boolean {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Grundläggande svenska helger (förenklad version)
  const holidays = [
    `${year}-01-01`, // Nyårsdagen
    `${year}-01-06`, // Trettondedag jul
    `${year}-05-01`, // Första maj
    `${year}-06-06`, // Sveriges nationaldag
    `${year}-12-24`, // Julafton
    `${year}-12-25`, // Juldagen
    `${year}-12-26`, // Annandag jul
    `${year}-12-31`, // Nyårsafton
  ];
  
  const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  return holidays.includes(dateStr);
}

function shouldGenerateSchedule(date: Date): boolean {
  return !isWeekend(date) && !isSwedishHoliday(date);
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function generateSchedulesForEmployee(employee: Employee, startDate: Date, endDate: Date, startId: number): Schedule[] {
  const schedules: Schedule[] = [];
  const template = scheduleTemplates[employee.scheduleTemplate as keyof typeof scheduleTemplates] || scheduleTemplates.standard;
  
  let currentId = startId;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (shouldGenerateSchedule(currentDate)) {
      schedules.push({
        id: currentId++,
        employeeId: employee.employeeId,
        date: formatDate(currentDate),
        startTime: template.startTime,
        endTime: template.endTime,
        breakStart: template.breakStart,
        breakEnd: template.breakEnd,
        status: "scheduled"
      });
    }
    
    // Gå till nästa dag
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return schedules;
}

async function generateYearlySchedules() {
  console.log("🗓️  Genererar scheman från idag till slutet av året...");
  
  try {
    // Läs anställda
    const employeesPath = path.join(__dirname, '../mock-data/employees.json');
    const employeesData = JSON.parse(fs.readFileSync(employeesPath, 'utf8')) as Employee[];
    
    // Filtrera aktiva anställda
    const activeEmployees = employeesData.filter(emp => emp.status === 'active');
    
    // Definiera datum-intervall
    const today = new Date();
    const endOfYear = new Date(today.getFullYear(), 11, 31); // 31 december
    
    console.log(`📅 Genererar scheman från ${formatDate(today)} till ${formatDate(endOfYear)}`);
    console.log(`👥 Antal aktiva anställda: ${activeEmployees.length}`);
    
    // Generera scheman för alla anställda
    let allSchedules: Schedule[] = [];
    let currentId = 1;
    
    for (const employee of activeEmployees) {
      console.log(`   Genererar schema för ${employee.firstName} ${employee.lastName} (${employee.employeeId}) - ${employee.scheduleTemplate}`);
      
      const employeeSchedules = generateSchedulesForEmployee(employee, today, endOfYear, currentId);
      allSchedules = allSchedules.concat(employeeSchedules);
      currentId += employeeSchedules.length;
      
      console.log(`   ✅ Genererade ${employeeSchedules.length} schema-poster`);
    }
    
    // Spara till fil
    const schedulesPath = path.join(__dirname, '../mock-data/schedules.json');
    fs.writeFileSync(schedulesPath, JSON.stringify(allSchedules, null, 2));
    
    console.log(`\n✅ Klart! Genererade totalt ${allSchedules.length} schema-poster`);
    console.log(`📁 Sparat till: ${schedulesPath}`);
    
    // Visa statistik
    const scheduleStats = activeEmployees.map(emp => ({
      name: `${emp.firstName} ${emp.lastName}`,
      employeeId: emp.employeeId,
      template: emp.scheduleTemplate,
      count: allSchedules.filter(s => s.employeeId === emp.employeeId).length
    }));
    
    console.log("\n📊 Statistik per anställd:");
    scheduleStats.forEach(stat => {
      console.log(`   ${stat.name} (${stat.employeeId}): ${stat.count} dagar [${stat.template}]`);
    });
    
  } catch (error) {
    console.error("❌ Fel vid generering av scheman:", error);
    process.exit(1);
  }
}

// Kör script om det körs direkt
if (import.meta.url === `file://${process.argv[1]}`) {
  generateYearlySchedules().then(() => {
    console.log("\n🎉 Schema-generering slutförd!");
    process.exit(0);
  }).catch(error => {
    console.error("❌ Script misslyckades:", error);
    process.exit(1);
  });
}

export { generateYearlySchedules };