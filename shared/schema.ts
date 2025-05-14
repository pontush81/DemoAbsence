import { pgTable, text, serial, integer, boolean, date, time, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Employees (Personnel)
export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(), // Anst.id in Kontek
  personnummer: text("personnummer").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  careOfAddress: text("care_of_address"),
  streetAddress: text("street_address").notNull(),
  postalCode: text("postal_code").notNull(),
  city: text("city").notNull(),
  country: text("country").default("Sverige"),
  phoneNumber: text("phone_number"),
  email: text("email"),
  workEmail: text("work_email"),
  preferredEmail: text("preferred_email").default("work"),
  status: text("status").default("active"), // "active", "inactive", "terminated"
  role: text("role").default("employee"), // "employee", "manager"
  bankClearingNumber: text("bank_clearing_number"),
  bankAccountNumber: text("bank_account_number"),
  bankBIC: text("bank_bic"),
  bankCountryCode: text("bank_country_code"),
  bankIBAN: text("bank_iban"),
  department: text("department"),
  position: text("position"),
  manager: text("manager"), // employeeId of manager
  scheduleTemplate: text("schedule_template"),
});

// Schedules
export const schedules = pgTable("schedules", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStart: time("break_start"),
  breakEnd: time("break_end"),
  status: text("status").default("scheduled"), // "scheduled", "modified", "approved"
});

// Time codes (for deviations)
export const timeCodes = pgTable("time_codes", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  nameSV: text("name_sv").notNull(),
  nameEN: text("name_en").notNull(),
  category: text("category").notNull(), // "overtime", "sick", "vab", etc.
  requiresApproval: boolean("requires_approval").default(true),
});

// Deviations
export const deviations = pgTable("deviations", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  timeCode: text("time_code").notNull(),
  comment: text("comment"),
  status: text("status").default("pending"), // "draft", "pending", "approved", "rejected", "returned"
  managerComment: text("manager_comment"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  submitted: timestamp("submitted"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
});

// Leave requests
export const leaveRequests = pgTable("leave_requests", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  leaveType: text("leave_type").notNull(), // "vacation", "sick", "parental", etc.
  scope: text("scope").default("full-day"), // "full-day", "morning", "afternoon", "custom"
  customStartTime: time("custom_start_time"),
  customEndTime: time("custom_end_time"),
  comment: text("comment"),
  status: text("status").default("pending"), // "draft", "pending", "approved", "rejected"
  managerComment: text("manager_comment"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  submitted: timestamp("submitted"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  rejectedBy: text("rejected_by"),
  rejectedAt: timestamp("rejected_at"),
});

// Time balances (for displaying saldos)
export const timeBalances = pgTable("time_balances", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull().unique(),
  timeBalance: integer("time_balance").default(0), // in minutes
  vacationDays: integer("vacation_days").default(0),
  savedVacationDays: jsonb("saved_vacation_days").default({}),
  vacationUnit: text("vacation_unit").default("days"), // "days" or "hours"
  compensationTime: integer("compensation_time").default(0), // in minutes
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Payslips
export const payslips = pgTable("payslips", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  year: integer("year").notNull(),
  month: integer("month").notNull(),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  published: timestamp("published").defaultNow(),
});

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  employeeId: text("employee_id").notNull(),
  type: text("type").notNull(), // "deviation", "leave", "payslip", etc.
  action: text("action").notNull(), // "created", "updated", "approved", "rejected", etc.
  description: text("description").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  referenceId: text("reference_id"), // ID of the referenced entity
  referenceType: text("reference_type"), // "deviation", "leave", etc.
});

// Insert schemas
export const insertEmployeeSchema = createInsertSchema(employees).omit({ id: true });
export const insertScheduleSchema = createInsertSchema(schedules).omit({ id: true });
export const insertTimeCodeSchema = createInsertSchema(timeCodes).omit({ id: true });
export const insertDeviationSchema = createInsertSchema(deviations).omit({ id: true });
export const insertLeaveRequestSchema = createInsertSchema(leaveRequests).omit({ id: true });
export const insertTimeBalanceSchema = createInsertSchema(timeBalances).omit({ id: true });
export const insertPayslipSchema = createInsertSchema(payslips).omit({ id: true });
export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true });

// Types
export type Employee = typeof employees.$inferSelect;
export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;

export type Schedule = typeof schedules.$inferSelect;
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;

export type TimeCode = typeof timeCodes.$inferSelect;
export type InsertTimeCode = z.infer<typeof insertTimeCodeSchema>;

export type Deviation = typeof deviations.$inferSelect;
export type InsertDeviation = z.infer<typeof insertDeviationSchema>;

export type LeaveRequest = typeof leaveRequests.$inferSelect;
export type InsertLeaveRequest = z.infer<typeof insertLeaveRequestSchema>;

export type TimeBalance = typeof timeBalances.$inferSelect;
export type InsertTimeBalance = z.infer<typeof insertTimeBalanceSchema>;

export type Payslip = typeof payslips.$inferSelect;
export type InsertPayslip = z.infer<typeof insertPayslipSchema>;

export type ActivityLog = typeof activityLogs.$inferSelect;
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
