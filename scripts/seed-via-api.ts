#!/usr/bin/env tsx

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

// Helper to make API calls
const apiCall = async (endpoint: string, method: string = 'GET', data?: any) => {
  const url = `http://localhost:3000${endpoint}`;
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  
  if (data) {
    options.body = JSON.stringify(data);
  }
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    throw error;
  }
};

async function seedViaAPI() {
  console.log('🌱 Seeding missing data via API...');

  try {
    // Test if server is running
    await apiCall('/api/test');
    console.log('✅ Server is running');

    // Seed time balances - We'll need to create this endpoint
    console.log('🔍 Time balances will need to be added manually since API does not support creation yet');
    
    // For now, let's focus on testing what we have migrated
    console.log('🧪 Testing migrated endpoints...');
    
    // Test current employee
    const currentEmployee = await apiCall('/api/employee/current');
    console.log(`✅ Current employee: ${currentEmployee.first_name} ${currentEmployee.last_name}`);
    
    // Test time balance for existing employee  
    try {
      const timeBalance = await apiCall('/api/time-balances/E001');
      console.log(`✅ Time balance for E001: ${timeBalance.timeBalance} minutes`);
    } catch (error) {
      console.log(`❌ Time balance for E001: Not found (expected if not seeded)`);
    }
    
    // Test payslips
    try {
      const payslips = await apiCall('/api/payslips/E001');
      console.log(`✅ Payslips for E001: ${payslips.length} found`);
    } catch (error) {
      console.log(`❌ Payslips for E001: Error`);
    }

    // Test deviations
    const deviations = await apiCall('/api/deviations');
    console.log(`✅ Deviations: ${deviations.length} found`);
    
    // Test leave requests
    const leaveRequests = await apiCall('/api/leave-requests');
    console.log(`✅ Leave requests: ${leaveRequests.length} found`);
    
    console.log('🎉 API testing completed!');
    
  } catch (error) {
    console.error('❌ Error during API seeding/testing:', error);
    process.exit(1);
  }
}

// Run the seeding
seedViaAPI().then(() => {
  console.log('API seeding/testing finished');
  process.exit(0);
}).catch((error) => {
  console.error('API seeding/testing failed:', error);
  process.exit(1);
});