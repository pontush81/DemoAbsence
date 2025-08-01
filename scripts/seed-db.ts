import { db } from "../server/db";
import fs from 'fs';
import path from 'path';

// Load mock data from JSON files
const mockTimeCodes = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/timecodes.json"), "utf8"));
const mockDeviations = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/deviations.json"), "utf8"));
const mockLeaveRequests = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/leave-requests.json"), "utf8"));
const mockTimeBalances = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/timebalances.json"), "utf8"));
const mockPayslips = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/payslips.json"), "utf8"));
const mockEmployees = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/employees.json"), "utf8"));
const mockSchedules = JSON.parse(fs.readFileSync(path.join(__dirname, "../mock-data/schedules.json"), "utf8"));
import { 
  employees, 
  schedules, 
  timeCodes, 
  deviations, 
  leaveRequests,
  timeBalances,
  payslips,
  activityLogs
} from "../shared/schema";
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Läs data från JSON-filer
const employeesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock-data/employees.json'), 'utf8'));
const schedulesData = JSON.parse(fs.readFileSync(path.join(__dirname, '../mock-data/schedules.json'), 'utf8'));

async function seedDatabase() {
  console.log("Starting database seeding...");
  
  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(activityLogs);
    await db.delete(payslips);
    await db.delete(timeBalances);
    await db.delete(leaveRequests);
    await db.delete(deviations);
    await db.delete(schedules);
    await db.delete(timeCodes);
    await db.delete(employees);
    
    // Insert data
    console.log("Inserting employees...");
    for (const employee of employeesData) {
      await db.insert(employees).values({
        id: employee.id,
        employeeId: employee.employeeId,
        personnummer: employee.personnummer,
        firstName: employee.firstName,
        lastName: employee.lastName,
        careOfAddress: employee.careOfAddress || null,
        streetAddress: employee.streetAddress,
        postalCode: employee.postalCode,
        city: employee.city,
        country: employee.country || "Sverige",
        phoneNumber: employee.phoneNumber || null,
        email: employee.email || null,
        workEmail: employee.workEmail || null,
        preferredEmail: employee.preferredEmail || "work",
        status: employee.status || "active",
        role: employee.role || "employee",
        bankClearingNumber: employee.bankClearingNumber || null,
        bankAccountNumber: employee.bankAccountNumber || null,
        bankBIC: employee.bankBIC || null,
        bankCountryCode: employee.bankCountryCode || null,
        bankIBAN: employee.bankIBAN || null,
        department: employee.department || null,
        position: employee.position || null,
        manager: employee.manager || null,
        scheduleTemplate: employee.scheduleTemplate || null
      });
    }
    
    console.log("Inserting time codes...");
    for (const timeCode of mockTimeCodes) {
      await db.insert(timeCodes).values({
        id: timeCode.id,
        code: timeCode.code,
        name: timeCode.name,
        nameSV: timeCode.nameSV,
        nameEN: timeCode.nameEN,
        category: timeCode.category,
        requiresApproval: timeCode.requiresApproval
      });
    }
    
    console.log("Inserting schedules...");
    console.log(`Found ${schedulesData.length} schedules to insert...`);
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
    }
    
    console.log("Inserting deviations...");
    for (const deviation of mockDeviations) {
      await db.insert(deviations).values({
        id: deviation.id,
        employeeId: deviation.employeeId,
        date: deviation.date,
        startTime: deviation.startTime,
        endTime: deviation.endTime,
        timeCode: deviation.timeCode,
        comment: deviation.comment || null,
        status: deviation.status || "pending",
        managerComment: deviation.managerComment || null,
        lastUpdated: new Date(),
        submitted: deviation.submitted ? new Date(deviation.submitted) : null,
        approvedBy: deviation.approvedBy || null,
        approvedAt: deviation.approvedAt ? new Date(deviation.approvedAt) : null,
        rejectedBy: deviation.rejectedBy || null,
        rejectedAt: deviation.rejectedAt ? new Date(deviation.rejectedAt) : null
      });
    }
    
    console.log("Inserting leave requests...");
    for (const leaveRequest of mockLeaveRequests) {
      await db.insert(leaveRequests).values({
        id: leaveRequest.id,
        employeeId: leaveRequest.employeeId,
        startDate: leaveRequest.startDate,
        endDate: leaveRequest.endDate,
        leaveType: leaveRequest.leaveType,
        scope: leaveRequest.scope || "full-day",
        customStartTime: leaveRequest.customStartTime || null,
        customEndTime: leaveRequest.customEndTime || null,
        comment: leaveRequest.comment || null,
        status: leaveRequest.status || "pending",
        managerComment: leaveRequest.managerComment || null,
        lastUpdated: new Date(),
        submitted: leaveRequest.submitted ? new Date(leaveRequest.submitted) : null,
        approvedBy: leaveRequest.approvedBy || null,
        approvedAt: leaveRequest.approvedAt ? new Date(leaveRequest.approvedAt) : null,
        rejectedBy: leaveRequest.rejectedBy || null,
        rejectedAt: leaveRequest.rejectedAt ? new Date(leaveRequest.rejectedAt) : null
      });
    }
    
    console.log("Inserting time balances...");
    for (const timeBalance of mockTimeBalances) {
      await db.insert(timeBalances).values({
        id: timeBalance.id,
        employeeId: timeBalance.employeeId,
        timeBalance: timeBalance.timeBalance || 0,
        vacationDays: timeBalance.vacationDays || 0,
        savedVacationDays: timeBalance.savedVacationDays || {},
        vacationUnit: timeBalance.vacationUnit || "days",
        compensationTime: timeBalance.compensationTime || 0,
        lastUpdated: new Date()
      });
    }
    
    console.log("Inserting payslips...");
    for (const payslip of mockPayslips) {
      await db.insert(payslips).values({
        id: payslip.id,
        employeeId: payslip.employeeId,
        year: payslip.year,
        month: payslip.month,
        fileName: payslip.fileName,
        fileUrl: payslip.fileUrl,
        published: new Date()
      });
    }
    
    console.log("Inserting activity logs...");
    for (const activityLog of mockActivityLogs) {
      await db.insert(activityLogs).values({
        id: activityLog.id,
        employeeId: activityLog.employeeId,
        type: activityLog.type,
        action: activityLog.action,
        description: activityLog.description,
        timestamp: new Date(),
        referenceId: activityLog.referenceId || null,
        referenceType: activityLog.referenceType || null
      });
    }
    
    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
}

// Execute the seeding
seedDatabase();