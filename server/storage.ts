import fs from 'fs';
import path from 'path';
import { db } from './db';
import { employees, deviations, leaveRequests, timeCodes, schedules, timeBalances, payslips, activityLogs } from '@shared/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

// Use database if available, fallback to JSON files
const USE_DATABASE = false; // Temporarily disabled for demo - use JSON files

// Helper to read mock data from files (fallback)
export const getMockData = async (filename: string) => {
  if (USE_DATABASE) {
    return await getDatabaseData(filename);
  }
  
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

// Get data from database
const getDatabaseData = async (filename: string) => {
  try {
    switch (filename) {
      case 'employees.json':
        return await db.select().from(employees);
      case 'deviations.json':
        return await db.select().from(deviations);
      case 'leave-requests.json':
        return await db.select().from(leaveRequests);
      case 'timecodes.json':
        return await db.select().from(timeCodes);
      case 'schedules.json':
        return await db.select().from(schedules);
      case 'timebalances.json':
        return await db.select().from(timeBalances);
      case 'payslips.json':
        return await db.select().from(payslips);
      case 'activity-logs.json':
        return await db.select().from(activityLogs);
      default:
        console.warn(`Unknown database table for filename: ${filename}`);
        return [];
    }
  } catch (error) {
    console.error(`Error reading from database for ${filename}:`, error);
    return [];
  }
};

// Helper to write mock data to files or database
export const saveMockData = async (filename: string, data: any) => {
  if (USE_DATABASE) {
    return await saveDatabaseData(filename, data);
  }
  
  try {
    const filePath = path.join(process.cwd(), 'mock-data', filename);
    const dirPath = path.dirname(filePath);
    
    // Ensure directory exists
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // Write data with pretty formatting
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully saved mock data to ${filename}`);
    return true;
  } catch (error) {
    console.error(`Error writing mock data file ${filename}:`, error);
    return false;
  }
};

// Save data to database (Note: This would typically be handled by individual CRUD operations)
const saveDatabaseData = async (filename: string, data: any) => {
  try {
    // For database mode, we don't bulk replace data as it's handled by CRUD operations
    // This is mainly for compatibility with the existing JSON approach
    console.log(`Database mode: ${filename} changes are handled by individual CRUD operations`);
    return true;
  } catch (error) {
    console.error(`Error saving to database for ${filename}:`, error);
    return false;
  }
};

// Helper to save files (PAXML, PDFs, etc.)
export const saveFile = (filename: string, content: string | Buffer, subfolder: string = 'exports'): string => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads', subfolder);
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const filePath = path.join(uploadsDir, filename);
    fs.writeFileSync(filePath, content);
    
    // Return relative path for URL
    return `/uploads/${subfolder}/${filename}`;
  } catch (error) {
    console.error(`Error saving file ${filename}:`, error);
    throw error;
  }
};

// Helper to read saved files
export const getFile = (filePath: string): Buffer | null => {
  try {
    const fullPath = path.join(process.cwd(), filePath.replace(/^\//, ''));
    if (fs.existsSync(fullPath)) {
      return fs.readFileSync(fullPath);
    }
    return null;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
};

// Helper to list files in a directory
export const listFiles = (subfolder: string = 'exports'): string[] => {
  try {
    const dirPath = path.join(process.cwd(), 'uploads', subfolder);
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath);
  } catch (error) {
    console.error(`Error listing files in ${subfolder}:`, error);
    return [];
  }
};

// Helper for generating unique IDs
export const generateId = (existingData: any[]): number => {
  return Math.max(0, ...existingData.map((item: any) => item.id || 0)) + 1;
};
