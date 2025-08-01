import type { Express } from "express";
import { createServer, type Server } from "http";
import { saveFile, getFile, listFiles, generateId, getMockData, saveMockData } from "./storage";
import { storage } from "./supabase-storage"; 
import { restStorage } from "./supabase-rest-storage";
import { generatePAXMLTransactions, generatePAXMLXML, generatePAXMLXMLWithSchedules, validatePAXMLData, convertXMLScheduleToAppSchedule, convertAppScheduleToXMLSchedule } from './lib/paxml.js';

export async function registerRoutes(app: Express): Promise<Server> {
  // ---- API ROUTES ----
  
  // Test endpoint
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working', timestamp: new Date().toISOString() });
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

  // Demo PAXML export matching the test file exactly
  app.post('/api/paxml/demo-franvaro', async (req, res) => {
    try {
      // Create demo transactions exactly like the test file
      const demoTransactions = [
        {
          employeeId: "1001",
          date: "2025-05-03", 
          timeCode: "SEM",
          hours: 8.00,
          comment: "Planerad semester"
        },
        {
          employeeId: "1001",
          date: "2025-05-04",
          timeCode: "SEM", 
          hours: 8.00,
          comment: "Planerad semester"
        },
        {
          employeeId: "1001",
          date: "2025-05-05",
          timeCode: "SJK",
          hours: 4.50,
          comment: "Sjukdom - halvdag"
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
      
      // Get deviations (already filtered in the existing logic)
      let deviations = await getMockData('deviations.json');
      deviations = deviations.filter((d: any) => 
        d.status === 'approved' && 
        employeeIds.includes(d.employeeId) &&
        d.date >= startDate && 
        d.date <= endDate
      );
      
      // Get schedules
      let schedules = await getMockData('schedules.json');
      schedules = schedules.filter((s: any) => 
        employeeIds.includes(s.employeeId) &&
        s.date >= startDate && 
        s.date <= endDate
      );
      
      console.log(`Found ${deviations.length} approved deviations and ${schedules.length} schedule entries`);
      
      const employees = await getMockData('employees.json');
      const transactions = generatePAXMLTransactions(deviations, employees);
      const xmlSchedules = convertAppScheduleToXMLSchedule(schedules);
      
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
      const updated = await storage.updateEmployee(req.params.id, req.body);
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
        if (period === 'current-month') {
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
          filters.startDate = startOfMonth.toISOString().split('T')[0];
        } else if (period === 'last-month') {
          const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
          const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
          filters.startDate = startOfLastMonth.toISOString().split('T')[0];
          filters.endDate = endOfLastMonth.toISOString().split('T')[0];
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
        status: req.body.status || 'pending',
        submitted: new Date().toISOString()
      };
      
      const newDeviation = await storage.createDeviation(deviationData);
      
      console.log('Created new deviation:', newDeviation);
      res.status(201).json(newDeviation);
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
      
      const updatedDeviation = await storage.updateDeviation(parseInt(req.params.id), updateData);
      
      if (updatedDeviation) {
        res.json(updatedDeviation);
      } else {
        res.status(404).json({ message: 'Deviation not found' });
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
      const success = await storage.deleteDeviation(parseInt(req.params.id));
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: 'Deviation not found' });
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
      const leaveRequestData = {
        ...req.body,
        status: req.body.status || 'pending',
        submitted: new Date().toISOString()
      };
      
      const newLeaveRequest = await storage.createLeaveRequest(leaveRequestData);
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
      const updatedLeaveRequest = await storage.updateLeaveRequest(parseInt(req.params.id), req.body);
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
      const success = await storage.deleteLeaveRequest(parseInt(req.params.id));
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
      const timeBalance = await restStorage.getTimeBalance(req.params.employeeId);
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
      const pendingDeviations = await storage.getDeviations({ status: 'pending' });
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
        approvedAt: new Date().toISOString()
      };
      
      const approvedDeviation = await storage.updateDeviation(parseInt(req.params.id), updateData);
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
        rejectedAt: new Date().toISOString()
      };
      
      const rejectedDeviation = await storage.updateDeviation(parseInt(req.params.id), updateData);
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
      
      const returnedDeviation = await storage.updateDeviation(parseInt(req.params.id), updateData);
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
      const pendingLeaveRequests = await storage.getLeaveRequests({ status: 'pending' });
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
        approvedAt: new Date().toISOString()
      };
      
      const approvedLeaveRequest = await storage.updateLeaveRequest(parseInt(req.params.id), updateData);
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
        rejectedAt: new Date().toISOString()
      };
      
      const rejectedLeaveRequest = await storage.updateLeaveRequest(parseInt(req.params.id), updateData);
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
    
    let deviations = await getMockData('deviations.json');
    deviations = deviations.filter((d: any) => d.status === 'approved');
    
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employeeId));
    }
    
    if (startDate) {
      deviations = deviations.filter((d: any) => d.date >= startDate);
    }
    
    if (endDate) {
      deviations = deviations.filter((d: any) => d.date <= endDate);
    }
    
    const employees = await getMockData('employees.json');
    const transactions = generatePAXMLTransactions(deviations, employees);
    
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
    const { employeeId, startDate, endDate } = req.query;
    
    let schedules = await getMockData('schedules.json');
    
    if (employeeId) {
      schedules = schedules.filter((s: any) => s.employeeId === employeeId);
    }
    
    if (startDate) {
      schedules = schedules.filter((s: any) => s.date >= startDate);
    }
    
    if (endDate) {
      schedules = schedules.filter((s: any) => s.date <= endDate);
    }
    
    res.json(schedules);
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
    
    // Get and filter deviations
    let deviations = await getMockData('deviations.json');
    deviations = deviations.filter((d: any) => d.status === 'approved');
    
    if (employeeIds && employeeIds.length > 0) {
      deviations = deviations.filter((d: any) => employeeIds.includes(d.employeeId));
    }
    
    if (startDate) {
      deviations = deviations.filter((d: any) => d.date >= startDate);
    }
    
    if (endDate) {
      deviations = deviations.filter((d: any) => d.date <= endDate);
    }
    
    // Get and filter schedules
    let schedules: any[] = [];
    if (includeSchedules) {
      schedules = await getMockData('schedules.json');
      
      if (employeeIds && employeeIds.length > 0) {
        schedules = schedules.filter((s: any) => employeeIds.includes(s.employeeId));
      }
      
      if (startDate) {
        schedules = schedules.filter((s: any) => s.date >= startDate);
      }
      
      if (endDate) {
        schedules = schedules.filter((s: any) => s.date <= endDate);
      }
    }
    
    const employees = await getMockData('employees.json');
    const transactions = generatePAXMLTransactions(deviations, employees);
    const xmlSchedules = convertAppScheduleToXMLSchedule(schedules);
    
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
