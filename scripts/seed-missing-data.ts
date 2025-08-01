#!/usr/bin/env tsx

import { db } from '../server/db';
import { timeBalances, payslips } from '@shared/schema';
import fs from 'fs';
import path from 'path';

// Helper to read mock data
const getMockData = (filename: string) => {
  try {
    const filePath = path.join(process.cwd(), 'mock-data', filename);
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
    console.warn(`Mock data file not found: ${filename}`);
    return [];
  } catch (error) {
    console.error(`Error reading mock data file ${filename}:`, error);
    return [];
  }
};

async function seedMissingData() {
  if (!db) {
    console.error('Database not available');
    process.exit(1);
  }

  console.log('🌱 Seeding missing data to database...');

  try {
    // Seed time balances
    console.log('Seeding time balances...');
    const timeBalanceData = getMockData('timebalances.json');
    
    for (const balance of timeBalanceData) {
      try {
        await db.insert(timeBalances).values({
          employeeId: balance.employeeId,
          timeBalance: balance.timeBalance,
          vacationDays: balance.vacationDays,
          savedVacationDays: balance.savedVacationDays,
          vacationUnit: balance.vacationUnit,
          compensationTime: balance.compensationTime,
          lastUpdated: new Date(balance.lastUpdated)
        }).onConflictDoUpdate({
          target: timeBalances.employeeId,
          set: {
            timeBalance: balance.timeBalance,
            vacationDays: balance.vacationDays,
            savedVacationDays: balance.savedVacationDays,
            vacationUnit: balance.vacationUnit,
            compensationTime: balance.compensationTime,
            lastUpdated: new Date(balance.lastUpdated)
          }
        });
        console.log(`✅ Seeded time balance for ${balance.employeeId}`);
      } catch (error) {
        console.error(`❌ Error seeding time balance for ${balance.employeeId}:`, error);
      }
    }

    // Seed payslips
    console.log('Seeding payslips...');
    const payslipData = getMockData('payslips.json');
    
    for (const payslip of payslipData) {
      try {
        await db.insert(payslips).values({
          employeeId: payslip.employeeId,
          year: payslip.year,
          month: payslip.month,
          payDate: payslip.payDate,
          grossAmount: payslip.grossAmount,
          netAmount: payslip.netAmount,
          status: payslip.status,
          fileName: payslip.fileName,
          fileUrl: payslip.fileUrl,
          published: new Date(payslip.published),
          viewed: payslip.viewed,
          viewedAt: payslip.viewedAt ? new Date(payslip.viewedAt) : null
        }).onConflictDoNothing();
        console.log(`✅ Seeded payslip for ${payslip.employeeId} ${payslip.year}-${payslip.month}`);
      } catch (error) {
        console.error(`❌ Error seeding payslip for ${payslip.employeeId}:`, error);
      }
    }

    console.log('🎉 Seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Run the seeding
seedMissingData().then(() => {
  console.log('Database seeding finished');
  process.exit(0);
}).catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});