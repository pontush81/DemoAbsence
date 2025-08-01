import { db } from "../server/db";
import { schedules } from "../shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedYearlySchedules() {
  console.log("🗓️  Seedar årets scheman till databasen...");
  
  try {
    // Läs scheman från JSON-fil
    const schedulesPath = path.join(__dirname, '../mock-data/schedules.json');
    const schedulesData = JSON.parse(fs.readFileSync(schedulesPath, 'utf8'));
    
    console.log(`📊 Läste ${schedulesData.length} scheman från JSON-fil`);
    
    // Rensa befintliga scheman
    console.log("🗑️  Rensar befintliga scheman...");
    await db.delete(schedules);
    
    // Infoga nya scheman
    console.log("➕ Infogar nya scheman...");
    let inserted = 0;
    
    for (const schedule of schedulesData) {
      await db.insert(schedules).values({
        id: schedule.id,
        employeeId: schedule.employeeId,
        date: schedule.date,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        breakStart: schedule.breakStart || null,
        breakEnd: schedule.breakEnd || null,
        status: schedule.status || "scheduled"
      });
      inserted++;
      
      if (inserted % 100 === 0) {
        console.log(`   ✅ Infogade ${inserted}/${schedulesData.length} scheman...`);
      }
    }
    
    console.log(`\n✅ Klart! Infogade totalt ${inserted} scheman i databasen`);
    
    // Visa statistik
    const employeeStats = schedulesData.reduce((acc: any, schedule: any) => {
      if (!acc[schedule.employeeId]) {
        acc[schedule.employeeId] = 0;
      }
      acc[schedule.employeeId]++;
      return acc;
    }, {});
    
    console.log("\n📊 Statistik per anställd:");
    Object.entries(employeeStats).forEach(([employeeId, count]) => {
      console.log(`   ${employeeId}: ${count} schema-poster`);
    });
    
    // Visa datum-intervall
    const dates = schedulesData.map((s: any) => s.date).sort();
    const firstDate = dates[0];
    const lastDate = dates[dates.length - 1];
    console.log(`\n📅 Schema-intervall: ${firstDate} till ${lastDate}`);
    
  } catch (error) {
    console.error("❌ Fel vid seeding av scheman:", error);
    process.exit(1);
  }
}

// Kör script om det körs direkt
if (import.meta.url === `file://${process.argv[1]}`) {
  seedYearlySchedules().then(() => {
    console.log("\n🎉 Schema-seeding slutförd!");
    process.exit(0);
  }).catch(error => {
    console.error("❌ Script misslyckades:", error);
    process.exit(1);
  });
}

export { seedYearlySchedules };