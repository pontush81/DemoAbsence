import type { Express } from "express";
import { createServer, type Server } from "http";
import { saveFile, getFile, listFiles, generateId, getMockData, saveMockData } from "./storage";
import { storage } from "./supabase-storage"; 
import { restStorage } from "./supabase-rest-storage";
import { db } from "./db";
import { timeBalances } from "@shared/schema";
import { generatePAXMLTransactions, generatePAXMLXML, generatePAXMLXMLWithSchedules, validatePAXMLData, convertXMLScheduleToAppSchedule, convertAppScheduleToXMLSchedule } from './lib/paxml.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // ---- API ROUTES ----
  
  // Test endpoint
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date() });
  });

  // Simple test deviation creation
  app.post('/api/test-deviation', async (req, res) => {
    try {
      const mockDeviations = await getMockData('deviations.json');
      const newId = 999;
      const newDeviation = {
        id: newId,
        employeeId: "E001",
        date: "2024-01-15",
        startTime: "08:00:00",
        endTime: "17:00:00", 
        timeCode: "300",
        comment: "Test from simple route",
        status: "approved",
        lastUpdated: new Date().toISOString(),
        submitted: new Date().toISOString()
      };
      
      res.status(201).json(newDeviation);
    } catch (error) {
      console.error('Simple test error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });


  // Test database connection
  app.get('/api/test-data', async (req, res) => {
    try {
      const employees = await restStorage.getEmployees();
      res.json({ success: true, count: employees.length, first: employees[0] || null });
    } catch (error) {
      console.error('Test data error:', error);
      res.status(500).json({ error: (error as Error).message, stack: (error as Error).stack });
    }
  });

  // Debug time balances mock data
    app.get('/api/admin/debug-time-balances', async (req, res) => {
    try {
      const mockData = await getMockData('timebalances.json');
      res.json({
        message: 'Mock time balances data',
        count: mockData.length,
        data: mockData,
        employeeIds: mockData.map((tb: any) => tb.employeeId)
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Seed deviations from mock data to database
  app.post('/api/admin/seed-deviations', async (req, res) => {
    try {
      const deviationData = await getMockData('deviations.json');
      const seededDeviations = [];
      
      for (const deviation of deviationData) {
        try {
          const deviationEntry = {
            employeeId: deviation.employeeId,
            date: deviation.date,
            startTime: deviation.startTime,
            endTime: deviation.endTime,
            timeCode: deviation.timeCode,
            comment: deviation.comment,
            status: deviation.status,
            managerComment: deviation.managerComment,
            lastUpdated: deviation.lastUpdated ? new Date(deviation.lastUpdated) : new Date(),
            submitted: deviation.submitted ? new Date(deviation.submitted) : null,
            approvedBy: deviation.approvedBy,
            approvedAt: deviation.approvedAt ? new Date(deviation.approvedAt) : null,
            rejectedBy: deviation.rejectedBy,
            rejectedAt: deviation.rejectedAt ? new Date(deviation.rejectedAt) : null
          };

          const created = await restStorage.createDeviation(deviationEntry);
          seededDeviations.push({ 
            id: deviation.id, 
            status: 'success',
            timeCode: deviation.timeCode,
            deviationStatus: deviation.status
          });
        } catch (error) {
          console.error(`Error seeding deviation ${deviation.id}:`, error);
          seededDeviations.push({
            id: deviation.id,
            status: 'error',
            error: (error as Error).message
          });
        }
      }

      res.json({
        message: 'Deviation seeding completed',
        results: seededDeviations,
        total: deviationData.length,
        successful: seededDeviations.filter(r => r.status === 'success').length,
        approved: seededDeviations.filter(r => r.deviationStatus === 'approved').length
      });
    } catch (error) {
      console.error('Error during deviation seeding:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Seed time balances from mock data
  app.post('/api/admin/seed-time-balances', async (req, res) => {
    try {
      const timeBalanceData = await getMockData('timebalances.json');
      const seededBalances = [];
      
      for (const balance of timeBalanceData) {
        try {
          // Try to create or update time balance using storage
          const timeBalanceEntry = {
            employeeId: balance.employeeId,
            timeBalance: balance.timeBalance,
            vacationDays: balance.vacationDays, 
            savedVacationDays: balance.savedVacationDays,
            vacationUnit: balance.vacationUnit,
            compensationTime: balance.compensationTime,
            lastUpdated: new Date(balance.lastUpdated)
          };
          
          // For now, let's use a direct database insert since we don't have createTimeBalance in storage
          if (db) {
            await db.insert(timeBalances).values(timeBalanceEntry)
              .onConflictDoUpdate({
                target: timeBalances.employeeId,
                set: {
                  timeBalance: timeBalanceEntry.timeBalance,
                  vacationDays: timeBalanceEntry.vacationDays,
                  savedVacationDays: timeBalanceEntry.savedVacationDays,
                  vacationUnit: timeBalanceEntry.vacationUnit,
                  compensationTime: timeBalanceEntry.compensationTime,
                  lastUpdated: timeBalanceEntry.lastUpdated
                }
              });
            seededBalances.push({ employeeId: balance.employeeId, status: 'success' });
          } else {
            seededBalances.push({ employeeId: balance.employeeId, status: 'no_db' });
          }
        } catch (error) {
          console.error(`Error seeding time balance for ${balance.employeeId}:`, error);
          seededBalances.push({ 
            employeeId: balance.employeeId, 
            status: 'error', 
            error: (error as Error).message 
          });
        }
      }
      
      res.json({ 
        message: 'Time balance seeding completed', 
        results: seededBalances,
        total: timeBalanceData.length,
        successful: seededBalances.filter(r => r.status === 'success').length
      });
    } catch (error) {
      console.error('Error during time balance seeding:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Demo PAXML export matching the test file exactly
  app.post('/api/paxml/demo-franvaro', async (req, res) => {
    try {
      // Create demo transactions exactly like the test file
      const demoTransactions = [
        {
          employeeId: "1001",
          personnummer: "198505121234",
          date: "2025-05-03", 
          timeCode: "SEM",
          hours: 8.00,
          comment: "Planerad semester",
          postId: 1
        },
        {
          employeeId: "1001",
          personnummer: "198505121234",
          date: "2025-05-04",
          timeCode: "SEM", 
          hours: 8.00,
          comment: "Planerad semester",
          postId: 2
        },
        {
          employeeId: "1001",
          personnummer: "198505121234",
          date: "2025-05-05",
          timeCode: "SJK",
          hours: 4.50,
          comment: "Sjukdom - halvdag",
          postId: 3
        }
      ];

      const paXmlContent = generatePAXMLXML(demoTransactions);
      const filename = `paxml-demo-franvaro-${new Date().toISOString().split('T')[0]}.xml`;
      
      // Save file to disk
      try {
        const filePath = saveFile(filename, paXmlContent, 'paxml');
        console.log(`Demo PAXML file saved: ${filePath}`);
      } catch (error) {
        console.error('Error saving demo PAXML file:', error);
      }
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(paXmlContent);
    } catch (error) {
      console.error('Demo PAXML export error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Complete demo with both deviations and schedules
  app.post('/api/paxml/demo-complete', async (req, res) => {
    try {
      console.log('Generating complete demo PAXML with deviations and schedules...');
      
      // Export approved deviations and schedules for May 2025
      const { employeeIds = ["E001", "E002"], startDate = "2025-05-01", endDate = "2025-05-09" } = req.body;
      
      // Get deviations from database
      let deviations = await restStorage.getDeviations({ 
        status: 'approved',
        startDate,
        endDate 
      });
      // Filter by employee IDs if specified
      if (employeeIds && employeeIds.length > 0) {
        deviations = deviations.filter((d: any) => employeeIds.includes(d.employeeId || d.employee_id));
      }
      
      // Get schedules from database
      let schedules = await restStorage.getSchedules({ 
        startDate,
        endDate 
      });
      // Filter by employee IDs if specified  
      if (employeeIds && employeeIds.length > 0) {
        schedules = schedules.filter((s: any) => employeeIds.includes(s.employeeId));
      }
      
      console.log(`Found ${deviations.length} approved deviations and ${schedules.length} schedule entries`);
      
      const employees = await restStorage.getEmployees();
      
      // Transform database format to PAXML expected format
      const transformedDeviations = deviations.map((d: any) => ({
        ...d,
        employeeId: d.employee_id || d.employeeId,
        timeCode: d.time_code || d.timeCode,
        startTime: d.start_time || d.startTime,
        endTime: d.end_time || d.endTime
      }));
      
      const transformedEmployees = employees.map((e: any) => ({
        ...e,
        employeeId: e.employee_id || e.employeeId
      }));
      
      const transactions = generatePAXMLTransactions(transformedDeviations, transformedEmployees);
      const xmlSchedules = convertAppScheduleToXMLSchedule(schedules, transformedEmployees);
      
      const paXmlContent = generatePAXMLXMLWithSchedules(transactions, xmlSchedules);
      const filename = `paxml-demo-complete-${new Date().toISOString().split('T')[0]}.xml`;
      
      // Save file to disk
      try {
        const filePath = saveFile(filename, paXmlContent, 'paxml');
        console.log(`Complete demo PAXML file saved: ${filePath}`);
      } catch (error) {
        console.error('Error saving complete demo PAXML file:', error);
      }
      
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(paXmlContent);
    } catch (error) {
      console.error('Complete demo PAXML export error:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });
  
  // Current logged-in employee
  app.get('/api/employee/current', async (req, res) => {
    try {
      const employees = await restStorage.getEmployees();
      // Return the first employee as the current user
      if (employees && employees.length > 0) {
        res.json(employees[0]);
      } else {
        res.status(404).json({ message: 'No employee found' });
      }
    } catch (error) {
      console.error('Error fetching current employee:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get all employees
  app.get('/api/employees', async (req, res) => {
    try {
      const employees = await restStorage.getEmployees();
      res.json(employees);
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get employee by ID
  app.get('/api/employees/:id', async (req, res) => {
    try {
      const employee = await restStorage.getEmployee(req.params.id);
      if (employee) {
        res.json(employee);
      } else {
        res.status(404).json({ message: 'Employee not found' });
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Update employee
  app.patch('/api/employees/:id', async (req, res) => {
    try {
      const updated = await restStorage.updateEmployee(req.params.id, req.body);
      if (updated) {
        res.json(updated);
      } else {
        res.status(404).json({ message: 'Employee not found' });
      }
    } catch (error) {
      console.error('Error updating employee:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get schedules
  app.get('/api/schedules/:employeeId', async (req, res) => {
    try {
      const { employeeId } = req.params;
      const { date } = req.query;
      
      const filters: any = { employeeId };
      if (date) {
        filters.date = date;
      }
      
      const schedules = await restStorage.getSchedules(filters);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get time codes
  app.get('/api/timecodes', async (req, res) => {
    try {
      const timeCodes = await restStorage.getTimeCodes();
      res.json(timeCodes);
    } catch (error) {
      console.error('Error fetching time codes:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get deviations
  app.get('/api/deviations', async (req, res) => {
    try {
      const { employeeId, period, status, timeCode } = req.query;
      
      // Prepare filters for database query
      const filters: any = {};
      
      if (employeeId) {
        filters.employeeId = employeeId;
      }
      
      if (status && status !== 'all') {
        filters.status = status;
      }
      
      // Handle period filtering with date ranges
      if (period) {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth(); // 0-indexed
        
        if (period === 'current-month') {
          // Use string formatting to avoid timezone issues
          const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
          const lastDay = new Date(year, month + 1, 0).getDate();
          const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          
          filters.startDate = startDate;
          filters.endDate = endDate;
        } else if (period === 'last-month') {
          // Last month calculation
          const lastMonthYear = month === 0 ? year - 1 : year;
          const lastMonth = month === 0 ? 12 : month;
          
          const startDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-01`;
          const lastDay = new Date(lastMonthYear, lastMonth, 0).getDate();
          const endDate = `${lastMonthYear}-${String(lastMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
          
          filters.startDate = startDate;
          filters.endDate = endDate;
        }
      }
      
      // Handle time code filtering
      if (timeCode && timeCode !== 'all') {
        // Check if it's a direct code match or category
        const timeCodes = await restStorage.getTimeCodes();
        const directMatch = timeCodes.find((t: any) => t.code === timeCode);
        
        if (directMatch) {
          filters.timeCode = timeCode;
        } else {
          // It's a category filter - we'll need to post-filter this
          filters.timeCodeCategory = timeCode;
        }
      }
      
      let deviations = await restStorage.getDeviations(filters);
      
      // For now, keep using database data (we have working database via REST API)
      // TODO: Add more test data to database or implement create operations via REST API
      
      // Post-filter for time code categories if needed
      if (timeCode && timeCode !== 'all' && filters.timeCodeCategory) {
        const timeCodes = await restStorage.getTimeCodes();
        const codesInCategory = timeCodes
          .filter((t: any) => t.category === timeCode)
          .map((t: any) => t.code);
        
        deviations = deviations.filter((d: any) => 
          codesInCategory.includes(d.timeCode)
        );
      }
      
      res.json(deviations);
    } catch (error) {
      console.error('Error in deviations endpoint:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get deviation by ID
  app.get('/api/deviations/:id', async (req, res) => {
    try {
      const deviation = await restStorage.getDeviation(parseInt(req.params.id));
      if (deviation) {
        res.json(deviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error fetching deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create deviation
  app.post('/api/deviations', async (req, res) => {
    try {
      const deviationData = {
        ...req.body,
        startTime: req.body.startTime + ':00', // Add seconds for consistency
        endTime: req.body.endTime + ':00',     // Add seconds for consistency
        status: req.body.status || 'pending'
      };
      
      // Use consistent REST API for all operations
      try {
        const newDeviation = await restStorage.createDeviation(deviationData);
        console.log('Created new deviation via REST API:', newDeviation);
        res.status(201).json(newDeviation);
      } catch (restError) {
        console.log('REST API creation failed, falling back to mock data:', restError);
        // Fallback to mock data if REST API fails
        const mockDeviations = await getMockData('deviations.json');
        const newId = Math.max(...mockDeviations.map((d: any) => d.id || 0)) + 1;
        const newDeviation = {
          id: newId,
          ...deviationData,
          lastUpdated: new Date().toISOString(),
          submitted: new Date().toISOString()  
        };
        mockDeviations.push(newDeviation);
        await saveMockData('deviations.json', mockDeviations);
        
        console.log('Created new deviation via mock fallback:', newDeviation);
        res.status(201).json(newDeviation);
      }
    } catch (error) {
      console.error('Error creating deviation:', error);
      res.status(500).json({ 
        error: 'Failed to create deviation', 
        details: (error as Error).message 
      });
    }
  });

  // Update deviation
  app.patch('/api/deviations/:id', async (req, res) => {
    try {
      const updateData = { ...req.body };
      
      // Add seconds for time consistency if provided
      if (updateData.startTime) {
        updateData.startTime = updateData.startTime + ':00';
      }
      if (updateData.endTime) {
        updateData.endTime = updateData.endTime + ':00';
      }
      
      try {
        const updatedDeviation = await restStorage.updateDeviation(parseInt(req.params.id), updateData);
        res.json(updatedDeviation);
      } catch (restError) {
        console.log('REST API update failed:', restError);
        res.status(404).json({ message: 'Deviation not found or update failed' });
      }
    } catch (error) {
      console.error('Error updating deviation:', error);
      res.status(500).json({ 
        error: 'Failed to update deviation', 
        details: (error as Error).message 
      });
    }
  });

  // Delete deviation
  app.delete('/api/deviations/:id', async (req, res) => {
    try {
      try {
        const success = await restStorage.deleteDeviation(parseInt(req.params.id));
        res.status(204).send();
      } catch (restError) {
        console.log('REST API delete failed:', restError);
        res.status(404).json({ message: 'Deviation not found or delete failed' });
      }
    } catch (error) {
      console.error('Error deleting deviation:', error);
      res.status(500).json({ 
        error: 'Failed to delete deviation', 
        details: (error as Error).message 
      });
    }
  });

  // Get leave requests
  app.get('/api/leave-requests', async (req, res) => {
    try {
      const { employeeId, period, status, leaveType } = req.query;
      
      const filters: any = {};
      if (employeeId) filters.employeeId = employeeId;
      if (status && status !== 'all') filters.status = status;
      
      let leaveRequests = await restStorage.getLeaveRequests(filters);
      
      // Post-filter for complex filtering not supported by database layer
      if (period && period !== 'all') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (period === 'upcoming') {
          leaveRequests = leaveRequests.filter((l: any) => {
            const endDate = new Date(l.endDate);
            return endDate >= today;
          });
        } else if (period === 'past') {
          leaveRequests = leaveRequests.filter((l: any) => {
            const endDate = new Date(l.endDate);
            return endDate < today;
          });
        }
      }
      
      // Filter by leave type
      if (leaveType && leaveType !== 'all') {
        leaveRequests = leaveRequests.filter((l: any) => l.leaveType === leaveType);
      }
      
      res.json(leaveRequests);
    } catch (error) {
      console.error('Error fetching leave requests:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get leave request by ID
  app.get('/api/leave-requests/:id', async (req, res) => {
    try {
      const leaveRequest = await restStorage.getLeaveRequest(parseInt(req.params.id));
      if (leaveRequest) {
        res.json(leaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error fetching leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Create leave request
  app.post('/api/leave-requests', async (req, res) => {
    try {
      const now = new Date();
      const leaveRequestData = {
        ...req.body,
        status: req.body.status || 'pending',
        submitted: now,
        lastUpdated: now
      };
      
      let newLeaveRequest;
      
      // Try storage first, fallback to mock data
      try {
        newLeaveRequest = await restStorage.createLeaveRequest(leaveRequestData);
      } catch (storageError) {
        console.log('Storage create failed, using mock data fallback:', storageError);
        // Fallback to mock data creation
        const leaveRequests = await getMockData('leave-requests.json');
        const newId = generateId(leaveRequests);
        newLeaveRequest = {
          id: newId,
          ...leaveRequestData
        };
        leaveRequests.push(newLeaveRequest);
        await saveMockData('leave-requests.json', leaveRequests);
      }
      
      res.status(201).json(newLeaveRequest);
    } catch (error) {
      console.error('Error creating leave request:', error);
      res.status(500).json({ 
        error: 'Failed to create leave request', 
        details: (error as Error).message 
      });
    }
  });

  // Update leave request
  app.patch('/api/leave-requests/:id', async (req, res) => {
    try {
      const updatedLeaveRequest = await restStorage.updateLeaveRequest(parseInt(req.params.id), req.body);
      if (updatedLeaveRequest) {
        res.json(updatedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error updating leave request:', error);
      res.status(500).json({ 
        error: 'Failed to update leave request', 
        details: (error as Error).message 
      });
    }
  });

  // Delete leave request
  app.delete('/api/leave-requests/:id', async (req, res) => {
    try {
      const success = await restStorage.deleteLeaveRequest(parseInt(req.params.id));
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error deleting leave request:', error);
      res.status(500).json({ 
        error: 'Failed to delete leave request', 
        details: (error as Error).message 
      });
    }
  });

  // Get time balance for employee
  app.get('/api/time-balances/:employeeId', async (req, res) => {
    try {
      let timeBalance;
      
      // Try restStorage first
      try {
        timeBalance = await restStorage.getTimeBalance(req.params.employeeId);
      } catch (error) {
        console.log('restStorage failed, trying direct mock fallback:', error);
      }
      
      // If restStorage didn't work, try direct mock data fallback
      if (!timeBalance) {
        const mockTimeBalances = await getMockData('timebalances.json');
        timeBalance = mockTimeBalances.find((tb: any) => tb.employeeId === req.params.employeeId);
      }
      
      if (timeBalance) {
        res.json(timeBalance);
      } else {
        res.status(404).json({ message: 'Time balance not found' });
      }
    } catch (error) {
      console.error('Error fetching time balance:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get payslips for employee
  app.get('/api/payslips/:employeeId', async (req, res) => {
    try {
      const employeePayslips = await restStorage.getPayslips(req.params.employeeId);
      res.json(employeePayslips);
    } catch (error) {
      console.error('Error fetching payslips:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get payslip file
  app.get('/api/payslips/file/:id', (req, res) => {
    // In a real implementation, we would fetch and return the actual PDF file
    // For mock purposes, we return a placeholder response
    res.json({ message: 'Payslip file content would be returned here' });
  });

  // --- MANAGER API ROUTES ---

  // Get pending deviations (for manager)
  app.get('/api/manager/deviations/pending', async (req, res) => {
    try {
      const { managerId } = req.query;
      let pendingDeviations;
      
      // Try storage first, fallback to restStorage
      try {
        pendingDeviations = await restStorage.getDeviations({ status: 'pending' });
      } catch (storageError) {
        console.log('Storage failed, using restStorage fallback:', storageError);
        const allDeviations = await restStorage.getDeviations({ status: 'pending' });
        pendingDeviations = allDeviations.filter((d: any) => d.status === 'pending');
      }
      
      // Filter by manager-employee relationship if managerId is provided
      if (managerId && pendingDeviations) {
        try {
          // Get all employees to find which ones report to this manager
          const allEmployees = await restStorage.getEmployees();
          const managerEmployees = allEmployees.filter((emp: any) => emp.manager === managerId);
          const employeeIds = managerEmployees.map((emp: any) => emp.employeeId);
          
          // Filter deviations to only include those from employees who report to this manager
          pendingDeviations = pendingDeviations.filter((deviation: any) => 
            employeeIds.includes(deviation.employeeId)
          );
          
          console.log(`Manager ${managerId} has ${pendingDeviations.length} pending deviations from employees: ${employeeIds.join(', ')}`);
        } catch (filterError) {
          console.error('Error filtering deviations by manager:', filterError);
          // If filtering fails, return all pending deviations as fallback
        }
      }
      
      res.json(pendingDeviations);
    } catch (error) {
      console.error('Error fetching pending deviations:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Approve deviation
  app.post('/api/manager/deviations/:id/approve', async (req, res) => {
    try {
      const updateData = {
        status: 'approved',
        managerComment: req.body.comment || 'Approved',
        approvedBy: 'E005', // Mock manager ID
        approvedAt: new Date()
      };
      
      let approvedDeviation;
      
      // Try storage first, fallback to mock data update
      try {
        approvedDeviation = await restStorage.updateDeviation(parseInt(req.params.id), updateData);
      } catch (storageError) {
        console.log('Storage update failed, using mock data fallback:', storageError);
        // Fallback to mock data update
        const deviations = await getMockData('deviations.json');
        const index = deviations.findIndex((d: any) => d.id === parseInt(req.params.id));
        if (index !== -1) {
          approvedDeviation = {
            ...deviations[index],
            ...updateData,
            lastUpdated: new Date()
          };
          deviations[index] = approvedDeviation;
          await saveMockData('deviations.json', deviations);
        }
      }
      
      if (approvedDeviation) {
        res.json(approvedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error approving deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reject deviation
  app.post('/api/manager/deviations/:id/reject', async (req, res) => {
    try {
      const updateData = {
        status: 'rejected',
        managerComment: req.body.comment || 'Rejected',
        rejectedBy: 'E005', // Mock manager ID
        rejectedAt: new Date()
      };
      
      const rejectedDeviation = await restStorage.updateDeviation(parseInt(req.params.id), updateData);
      if (rejectedDeviation) {
        res.json(rejectedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error rejecting deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Return deviation for correction
  app.post('/api/manager/deviations/:id/return', async (req, res) => {
    try {
      const updateData = {
        status: 'returned',
        managerComment: req.body.comment || 'Needs correction'
      };
      
      const returnedDeviation = await restStorage.updateDeviation(parseInt(req.params.id), updateData);
      if (returnedDeviation) {
        res.json(returnedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
      }
    } catch (error) {
      console.error('Error returning deviation:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Get pending leave requests (for manager)
  app.get('/api/manager/leave-requests/pending', async (req, res) => {
    try {
      let pendingLeaveRequests;
      
      // Try storage first, fallback to restStorage
      try {
        pendingLeaveRequests = await restStorage.getLeaveRequests({ status: 'pending' });
      } catch (storageError) {
        console.log('Storage failed, using restStorage fallback:', storageError);
        const allLeaveRequests = await restStorage.getLeaveRequests({ status: 'pending' });
        pendingLeaveRequests = allLeaveRequests.filter((lr: any) => lr.status === 'pending');
      }
      
      res.json(pendingLeaveRequests);
    } catch (error) {
      console.error('Error fetching pending leave requests:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Approve leave request
  app.post('/api/manager/leave-requests/:id/approve', async (req, res) => {
    try {
      const updateData = {
        status: 'approved',
        managerComment: req.body.comment || 'Approved',
        approvedBy: 'E005', // Mock manager ID
        approvedAt: new Date()
      };
      
      const approvedLeaveRequest = await restStorage.updateLeaveRequest(parseInt(req.params.id), updateData);
      if (approvedLeaveRequest) {
        res.json(approvedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error approving leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  // Reject leave request
  app.post('/api/manager/leave-requests/:id/reject', async (req, res) => {
    try {
      const updateData = {
        status: 'rejected',
        managerComment: req.body.comment || 'Rejected',
        rejectedBy: 'E005', // Mock manager ID
        rejectedAt: new Date()
      };
      
      const rejectedLeaveRequest = await restStorage.updateLeaveRequest(parseInt(req.params.id), updateData);
      if (rejectedLeaveRequest) {
        res.json(rejectedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/paxml/export', async (req, res) => {
    const { employeeIds, startDate, endDate } = req.body;
    
    // Get approved deviations from database, with fallback to mock data
    let deviations = await restStorage.getDeviations({ 
      status: 'approved',
      startDate,
      endDate 
    });
    
    // Fallback to mock data if we have very few deviations (for testing/demo)
    if (deviations.length <= 1) {
      console.log('Using mock data fallback for PAXML export (insufficient database data)');
      const mockDeviations = await getMockData('deviations.json');
      deviations = mockDeviations.filter((d: any) => d.status === 'approved');
      
      // Apply date filtering to mock data
      if (startDate || endDate) {
        deviations = deviations.filter((d: any) => {
          const deviationDate = new Date(d.date);
          if (startDate && deviationDate < new Date(startDate)) return false;
          if (endDate && deviationDate > new Date(endDate)) return false;
          return true;
        });
      }
    }
    
    // Filter by employee IDs if specified
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employeeId || d.employee_id));
    }
    
    const employees = await restStorage.getEmployees();
    
    // Transform database format to PAXML expected format
    const transformedDeviations = deviations.map((d: any) => ({
      ...d,
      employeeId: d.employee_id || d.employeeId,
      timeCode: d.time_code || d.timeCode,
      startTime: d.start_time || d.startTime,
      endTime: d.end_time || d.endTime
    }));
    
    const transformedEmployees = employees.map((e: any) => ({
      ...e,
      employeeId: e.employee_id || e.employeeId,
      personnummer: e.personnummer || e.personal_number
    }));
    
    
    const transactions = generatePAXMLTransactions(transformedDeviations, transformedEmployees);
    
    const validationErrors = validatePAXMLData(transactions);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const paXmlContent = generatePAXMLXML(transactions);
    const filename = `paxml-export-${new Date().toISOString().split('T')[0]}.xml`;
    
    // Save file to disk
    try {
      const filePath = saveFile(filename, paXmlContent, 'paxml');
      console.log(`PAXML file saved: ${filePath}`);
    } catch (error) {
      console.error('Error saving PAXML file:', error);
    }
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(paXmlContent);
  });

  // Get all schedules (extend existing endpoint)
  app.get('/api/schedules', async (req, res) => {
    try {
      const { employeeId, startDate, endDate } = req.query;
      
      const filters: any = {};
      if (employeeId) filters.employeeId = employeeId;
      if (startDate) filters.startDate = startDate;
      if (endDate) filters.endDate = endDate;
      
      const schedules = await restStorage.getSchedules(filters);
      res.json(schedules);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  });

  app.post('/api/paxml/import-schedules', (req, res) => {
    try {
      const { xmlContent } = req.body;
      
      if (!xmlContent) {
        return res.status(400).json({ error: 'XML content is required' });
      }
      
      const schemaMatches = xmlContent.match(/<schema anstid="([^"]+)">([\s\S]*?)<\/schema>/g);
      
      if (!schemaMatches) {
        return res.status(400).json({ error: 'No schedule data found in XML' });
      }
      
      const xmlSchedules = schemaMatches.map((schemaMatch: string) => {
        const anstidMatch = schemaMatch.match(/anstid="([^"]+)"/);
        const employeeId = anstidMatch ? anstidMatch[1] : '';
        
        const dayMatches = schemaMatch.match(/<dag datum="([^"]+)" timmar="([^"]+)"/g) || [];
        const days = dayMatches.map((dayMatch: string) => {
          const datumMatch = dayMatch.match(/datum="([^"]+)"/);
          const timmarMatch = dayMatch.match(/timmar="([^"]+)"/);
          
          return {
            employeeId,
            date: datumMatch ? datumMatch[1] : '',
            hours: timmarMatch ? parseFloat(timmarMatch[1]) : 0
          };
        });
        
        return { employeeId, days };
      });
      
      const appSchedules = xmlSchedules.flatMap((xmlSchedule: any) => 
        convertXMLScheduleToAppSchedule(xmlSchedule)
      );
      
      res.json({ 
        message: 'Schedules imported successfully',
        schedules: appSchedules,
        count: appSchedules.length
      });
      
    } catch (error) {
      console.error('Error importing schedules:', error);
      res.status(500).json({ error: 'Failed to import schedules' });
    }
  });

  app.post('/api/paxml/export-with-schedules', async (req, res) => {
    const { employeeIds, startDate, endDate, includeSchedules = true } = req.body;
    
    // Get approved deviations from database
    let deviations = await restStorage.getDeviations({ 
      status: 'approved',
      startDate,
      endDate 
    });
    
    // Filter by employee IDs if specified
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employeeId || d.employee_id));
    }
    
    // Get schedules from database
    let schedules: any[] = [];
    if (includeSchedules) {
      schedules = await restStorage.getSchedules({ 
        startDate,
        endDate 
      });
      
      // Filter by employee IDs if specified
      if (employeeIds && employeeIds.length > 0) {
        schedules = schedules.filter((s: any) => employeeIds.includes(s.employeeId));
      }
    }
    
    const employees = await restStorage.getEmployees();
    
    // Transform database format to PAXML expected format
    const transformedDeviations = deviations.map((d: any) => ({
      ...d,
      employeeId: d.employee_id || d.employeeId,
      timeCode: d.time_code || d.timeCode,
      startTime: d.start_time || d.startTime,
      endTime: d.end_time || d.endTime
    }));
    
    const transformedEmployees = employees.map((e: any) => ({
      ...e,
      employeeId: e.employee_id || e.employeeId,
      personnummer: e.personnummer || e.personal_number
    }));
    
    const transactions = generatePAXMLTransactions(transformedDeviations, transformedEmployees);
    const xmlSchedules = convertAppScheduleToXMLSchedule(schedules, transformedEmployees);
    
    const validationErrors = validatePAXMLData(transactions);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationErrors 
      });
    }
    
    const paXmlContent = generatePAXMLXMLWithSchedules(transactions, xmlSchedules);
    const filename = `paxml-export-with-schedules-${new Date().toISOString().split('T')[0]}.xml`;
    
    // Save file to disk
    try {
      const filePath = saveFile(filename, paXmlContent, 'paxml');
      console.log(`PAXML file with schedules saved: ${filePath}`);
    } catch (error) {
      console.error('Error saving PAXML file with schedules:', error);
    }
    
    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(paXmlContent);
  });

  const httpServer = createServer(app);
  return httpServer;
}
