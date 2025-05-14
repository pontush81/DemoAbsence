import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from 'fs';
import path from 'path';

// Helper to read mock data from files
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

export async function registerRoutes(app: Express): Promise<Server> {
  // ---- API ROUTES ----
  
  // Current logged-in employee
  app.get('/api/employee/current', (req, res) => {
    const employees = getMockData('employees.json');
    // Return the first employee as the current user
    if (employees && employees.length > 0) {
      res.json(employees[0]);
    } else {
      res.status(404).json({ message: 'No employee found' });
    }
  });

  // Get all employees
  app.get('/api/employees', (req, res) => {
    res.json(getMockData('employees.json'));
  });

  // Get employee by ID
  app.get('/api/employees/:id', (req, res) => {
    const employees = getMockData('employees.json');
    const employee = employees.find((e: any) => e.employeeId === req.params.id);
    if (employee) {
      res.json(employee);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  });

  // Update employee
  app.patch('/api/employees/:id', (req, res) => {
    const employees = getMockData('employees.json');
    const index = employees.findIndex((e: any) => e.employeeId === req.params.id);
    if (index !== -1) {
      // In a real implementation, we would validate and sanitize the input
      // and only update allowed fields
      employees[index] = { ...employees[index], ...req.body };
      res.json(employees[index]);
    } else {
      res.status(404).json({ message: 'Employee not found' });
    }
  });

  // Get schedules
  app.get('/api/schedules/:employeeId', (req, res) => {
    const { employeeId } = req.params;
    const { date } = req.query;
    
    const schedules = getMockData('schedules.json');
    let filteredSchedules = schedules.filter((s: any) => s.employeeId === employeeId);
    
    if (date) {
      filteredSchedules = filteredSchedules.filter((s: any) => s.date === date);
    }
    
    res.json(filteredSchedules);
  });

  // Get time codes
  app.get('/api/timecodes', (req, res) => {
    res.json(getMockData('timecodes.json'));
  });

  // Get deviations
  app.get('/api/deviations', (req, res) => {
    const { employeeId, period, status, timeCode } = req.query;
    
    let deviations = getMockData('deviations.json');
    
    // Filter by employee ID
    if (employeeId) {
      deviations = deviations.filter((d: any) => d.employeeId === employeeId);
    }
    
    // Filter by period
    if (period) {
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
      
      if (period === 'current-month') {
        deviations = deviations.filter((d: any) => {
          const deviationDate = new Date(d.date);
          return deviationDate >= startOfMonth;
        });
      } else if (period === 'last-month') {
        deviations = deviations.filter((d: any) => {
          const deviationDate = new Date(d.date);
          return deviationDate >= startOfLastMonth && deviationDate <= endOfLastMonth;
        });
      }
      // 'custom' period would be handled with additional query parameters
    }
    
    // Filter by status
    if (status && status !== 'all') {
      deviations = deviations.filter((d: any) => d.status === status);
    }
    
    // Filter by time code
    if (timeCode && timeCode !== 'all') {
      // For category filtering (overtime, sick, vab)
      const timeCodes = getMockData('timecodes.json');
      const codesInCategory = timeCodes
        .filter((t: any) => t.category === timeCode)
        .map((t: any) => t.code);
      
      deviations = deviations.filter((d: any) => 
        timeCode === d.timeCode || codesInCategory.includes(d.timeCode)
      );
    }
    
    res.json(deviations);
  });

  // Get deviation by ID
  app.get('/api/deviations/:id', (req, res) => {
    const deviations = getMockData('deviations.json');
    const deviation = deviations.find((d: any) => d.id === parseInt(req.params.id));
    if (deviation) {
      res.json(deviation);
    } else {
      res.status(404).json({ message: 'Deviation not found' });
    }
  });

  // Create deviation
  app.post('/api/deviations', (req, res) => {
    const deviations = getMockData('deviations.json');
    const newId = Math.max(0, ...deviations.map((d: any) => d.id)) + 1;
    const newDeviation = {
      id: newId,
      ...req.body,
      lastUpdated: new Date().toISOString()
    };
    
    // Return the new deviation
    res.status(201).json(newDeviation);
  });

  // Update deviation
  app.patch('/api/deviations/:id', (req, res) => {
    const deviations = getMockData('deviations.json');
    const index = deviations.findIndex((d: any) => d.id === parseInt(req.params.id));
    if (index !== -1) {
      const updatedDeviation = {
        ...deviations[index],
        ...req.body,
        lastUpdated: new Date().toISOString()
      };
      
      res.json(updatedDeviation);
    } else {
      res.status(404).json({ message: 'Deviation not found' });
    }
  });

  // Delete deviation
  app.delete('/api/deviations/:id', (req, res) => {
    // In a real implementation we would remove the deviation from storage
    res.status(204).send();
  });

  // Get leave requests
  app.get('/api/leave-requests', (req, res) => {
    const { employeeId, period, status, leaveType } = req.query;
    
    let leaveRequests = getMockData('leave-requests.json');
    
    // Filter by employee ID
    if (employeeId) {
      leaveRequests = leaveRequests.filter((l: any) => l.employeeId === employeeId);
    }
    
    // Filter by period (all, upcoming, past)
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
    
    // Filter by status
    if (status && status !== 'all') {
      leaveRequests = leaveRequests.filter((l: any) => l.status === status);
    }
    
    // Filter by leave type
    if (leaveType && leaveType !== 'all') {
      leaveRequests = leaveRequests.filter((l: any) => l.leaveType === leaveType);
    }
    
    res.json(leaveRequests);
  });

  // Get leave request by ID
  app.get('/api/leave-requests/:id', (req, res) => {
    const leaveRequests = getMockData('leave-requests.json');
    const leaveRequest = leaveRequests.find((l: any) => l.id === parseInt(req.params.id));
    if (leaveRequest) {
      res.json(leaveRequest);
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  });

  // Create leave request
  app.post('/api/leave-requests', (req, res) => {
    const leaveRequests = getMockData('leave-requests.json');
    const newId = Math.max(0, ...leaveRequests.map((l: any) => l.id)) + 1;
    const newLeaveRequest = {
      id: newId,
      ...req.body,
      lastUpdated: new Date().toISOString()
    };
    
    res.status(201).json(newLeaveRequest);
  });

  // Update leave request
  app.patch('/api/leave-requests/:id', (req, res) => {
    const leaveRequests = getMockData('leave-requests.json');
    const index = leaveRequests.findIndex((l: any) => l.id === parseInt(req.params.id));
    if (index !== -1) {
      const updatedLeaveRequest = {
        ...leaveRequests[index],
        ...req.body,
        lastUpdated: new Date().toISOString()
      };
      
      res.json(updatedLeaveRequest);
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  });

  // Delete leave request
  app.delete('/api/leave-requests/:id', (req, res) => {
    // In a real implementation we would remove the leave request from storage
    res.status(204).send();
  });

  // Get time balance for employee
  app.get('/api/time-balances/:employeeId', (req, res) => {
    const timeBalances = getMockData('timebalances.json');
    const timeBalance = timeBalances.find((t: any) => t.employeeId === req.params.employeeId);
    if (timeBalance) {
      res.json(timeBalance);
    } else {
      res.status(404).json({ message: 'Time balance not found' });
    }
  });

  // Get payslips for employee
  app.get('/api/payslips/:employeeId', (req, res) => {
    const payslips = getMockData('payslips.json');
    const employeePayslips = payslips.filter((p: any) => p.employeeId === req.params.employeeId);
    res.json(employeePayslips);
  });

  // Get payslip file
  app.get('/api/payslips/file/:id', (req, res) => {
    // In a real implementation, we would fetch and return the actual PDF file
    // For mock purposes, we return a placeholder response
    res.json({ message: 'Payslip file content would be returned here' });
  });

  // --- MANAGER API ROUTES ---

  // Get pending deviations (for manager)
  app.get('/api/manager/deviations/pending', (req, res) => {
    const deviations = getMockData('deviations.json');
    const pendingDeviations = deviations.filter((d: any) => d.status === 'pending');
    res.json(pendingDeviations);
  });

  // Approve deviation
  app.post('/api/manager/deviations/:id/approve', (req, res) => {
    const deviations = getMockData('deviations.json');
    const index = deviations.findIndex((d: any) => d.id === parseInt(req.params.id));
    if (index !== -1) {
      const approvedDeviation = {
        ...deviations[index],
        status: 'approved',
        managerComment: req.body.comment || 'Approved',
        approvedBy: 'E005', // Mock manager ID
        approvedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      res.json(approvedDeviation);
    } else {
      res.status(404).json({ message: 'Deviation not found' });
    }
  });

  // Reject deviation
  app.post('/api/manager/deviations/:id/reject', (req, res) => {
    const deviations = getMockData('deviations.json');
    const index = deviations.findIndex((d: any) => d.id === parseInt(req.params.id));
    if (index !== -1) {
      const rejectedDeviation = {
        ...deviations[index],
        status: 'rejected',
        managerComment: req.body.comment || 'Rejected',
        rejectedBy: 'E005', // Mock manager ID
        rejectedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      res.json(rejectedDeviation);
    } else {
      res.status(404).json({ message: 'Deviation not found' });
    }
  });

  // Return deviation for correction
  app.post('/api/manager/deviations/:id/return', (req, res) => {
    const deviations = getMockData('deviations.json');
    const index = deviations.findIndex((d: any) => d.id === parseInt(req.params.id));
    if (index !== -1) {
      const returnedDeviation = {
        ...deviations[index],
        status: 'returned',
        managerComment: req.body.comment || 'Needs correction',
        lastUpdated: new Date().toISOString()
      };
      
      res.json(returnedDeviation);
    } else {
      res.status(404).json({ message: 'Deviation not found' });
    }
  });

  // Get pending leave requests (for manager)
  app.get('/api/manager/leave-requests/pending', (req, res) => {
    const leaveRequests = getMockData('leave-requests.json');
    const pendingLeaveRequests = leaveRequests.filter((l: any) => l.status === 'pending');
    res.json(pendingLeaveRequests);
  });

  // Approve leave request
  app.post('/api/manager/leave-requests/:id/approve', (req, res) => {
    const leaveRequests = getMockData('leave-requests.json');
    const index = leaveRequests.findIndex((l: any) => l.id === parseInt(req.params.id));
    if (index !== -1) {
      const approvedLeaveRequest = {
        ...leaveRequests[index],
        status: 'approved',
        managerComment: req.body.comment || 'Approved',
        approvedBy: 'E005', // Mock manager ID
        approvedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      res.json(approvedLeaveRequest);
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  });

  // Reject leave request
  app.post('/api/manager/leave-requests/:id/reject', (req, res) => {
    const leaveRequests = getMockData('leave-requests.json');
    const index = leaveRequests.findIndex((l: any) => l.id === parseInt(req.params.id));
    if (index !== -1) {
      const rejectedLeaveRequest = {
        ...leaveRequests[index],
        status: 'rejected',
        managerComment: req.body.comment || 'Rejected',
        rejectedBy: 'E005', // Mock manager ID
        rejectedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
      
      res.json(rejectedLeaveRequest);
    } else {
      res.status(404).json({ message: 'Leave request not found' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
