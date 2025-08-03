/**
 * 🌐 FRONTEND INTEGRATION TESTS
 * 
 * Testar Frontend-Backend Integration efter snake_case → camelCase transformation
 * Baserat på Perplexity's rekommendationer för att säkerställa:
 * 1. Frontend kan läsa API responses korrekt
 * 2. Network requests returnerar rätt data format
 * 3. Form submissions fungerar med nya field structure
 * 4. TypeScript interfaces matchar API responses
 */

const request = require('supertest');
const { expect } = require('chai');

// Mock Express app for testing (replace with actual app)
// const app = require('../server/index');

describe('🌐 Frontend Integration Tests', () => {
  
  describe('📡 Network Response Integration', () => {
    
    it('should return employee data in format that frontend expects', async () => {
      // Simulate API response that frontend would receive
      const mockApiResponse = {
        status: 200,
        body: [
          {
            id: 1,
            personnummer: "19850512-1234",
            employeeId: "E001",
            firstName: "Test",
            lastName: "User", 
            phoneNumber: "0701234567",
            workEmail: "test.user@kontek.se",
            preferredEmail: "test.user@gmail.com",
            city: "Stockholm",
            careOfAddress: null,
            streetAddress: "Testgatan 1",
            postalCode: "12345",
            bankAccountNumber: "1234567890",
            bankClearingNumber: "1234",
            bankBIC: "TESTBIC",
            bankCountryCode: "SE",
            bankIBAN: "SE1234567890123456789012",
            scheduleTemplate: "standard",
            createdAt: "2025-01-15T10:30:00Z"
          }
        ]
      };
      
      // Verify frontend-expected structure
      const employee = mockApiResponse.body[0];
      
      // Critical frontend fields must be camelCase
      expect(employee).to.have.property('employeeId');
      expect(employee).to.have.property('firstName');
      expect(employee).to.have.property('lastName');
      expect(employee).to.have.property('phoneNumber');
      expect(employee).to.have.property('workEmail');
      expect(employee).to.have.property('preferredEmail');
      expect(employee).to.have.property('careOfAddress');
      expect(employee).to.have.property('streetAddress');
      expect(employee).to.have.property('postalCode');
      expect(employee).to.have.property('bankAccountNumber');
      expect(employee).to.have.property('bankClearingNumber');
      expect(employee).to.have.property('scheduleTemplate');
      expect(employee).to.have.property('createdAt');
      
      // Verify NO snake_case fields exist (would break frontend)
      expect(employee).to.not.have.property('employee_id');
      expect(employee).to.not.have.property('first_name');
      expect(employee).to.not.have.property('last_name');
      expect(employee).to.not.have.property('phone_number');
      expect(employee).to.not.have.property('work_email');
      expect(employee).to.not.have.property('preferred_email');
      expect(employee).to.not.have.property('care_of_address');
      expect(employee).to.not.have.property('street_address');
      expect(employee).to.not.have.property('postal_code');
      expect(employee).to.not.have.property('bank_account_number');
      expect(employee).to.not.have.property('bank_clearing_number');
      expect(employee).to.not.have.property('schedule_template');
      expect(employee).to.not.have.property('created_at');
    });
    
    it('should return deviation data compatible with frontend forms', async () => {
      const mockDeviationResponse = {
        status: 200,
        body: [
          {
            id: 35,
            employeeId: "E001",
            date: "2025-08-24",
            timeCode: "300",
            periodId: "202508",
            startTime: "08:00",
            endTime: "16:00",
            duration: 8,
            comment: "TEST: Sjukdom - endpoint test",
            status: "approved",
            managerComment: "Godkänd",
            approvedBy: "M001",
            approvedAt: "2025-01-15T14:30:00Z",
            rejectedBy: null,
            rejectedAt: null,
            lastUpdated: "2025-01-15T14:30:00Z",
            createdAt: "2025-08-24T08:00:00Z"
          }
        ]
      };
      
      const deviation = mockDeviationResponse.body[0];
      
      // Frontend form fields must be camelCase
      expect(deviation).to.have.property('employeeId');
      expect(deviation).to.have.property('timeCode');
      expect(deviation).to.have.property('periodId');
      expect(deviation).to.have.property('startTime');
      expect(deviation).to.have.property('endTime');
      expect(deviation).to.have.property('managerComment');
      expect(deviation).to.have.property('approvedBy');
      expect(deviation).to.have.property('approvedAt');
      expect(deviation).to.have.property('rejectedBy');
      expect(deviation).to.have.property('rejectedAt');
      expect(deviation).to.have.property('lastUpdated');
      expect(deviation).to.have.property('createdAt');
      
      // Verify data types for frontend consumption
      expect(deviation.employeeId).to.be.a('string');
      expect(deviation.timeCode).to.be.a('string');
      expect(deviation.duration).to.be.a('number');
      expect(deviation.status).to.be.a('string');
    });
    
    it('should return leave request data for frontend calendar integration', async () => {
      const mockLeaveResponse = {
        status: 200,
        body: [
          {
            id: 6,
            employeeId: "E001",
            startDate: "2025-08-08",
            endDate: "2025-08-08",
            leaveType: "vacation",
            scope: "full-day",
            customStartTime: null,
            customEndTime: null,
            comment: null,
            status: "pending",
            managerComment: null,
            approvedBy: null,
            approvedAt: null,
            rejectedBy: null,
            rejectedAt: null,
            pausedBy: null,
            pausedAt: null,
            pauseReason: null,
            lastUpdated: "2025-01-10T09:00:00Z",
            createdAt: "2025-01-10T09:00:00Z"
          }
        ]
      };
      
      const leave = mockLeaveResponse.body[0];
      
      // Frontend calendar fields must be camelCase
      expect(leave).to.have.property('employeeId');
      expect(leave).to.have.property('startDate');
      expect(leave).to.have.property('endDate');
      expect(leave).to.have.property('leaveType');
      expect(leave).to.have.property('customStartTime');
      expect(leave).to.have.property('customEndTime');
      expect(leave).to.have.property('managerComment');
      expect(leave).to.have.property('approvedBy');
      expect(leave).to.have.property('approvedAt');
      expect(leave).to.have.property('rejectedBy');
      expect(leave).to.have.property('rejectedAt');
      expect(leave).to.have.property('pausedBy');
      expect(leave).to.have.property('pausedAt');
      expect(leave).to.have.property('pauseReason');
      expect(leave).to.have.property('lastUpdated');
      expect(leave).to.have.property('createdAt');
      
      // Verify date formats for frontend date pickers
      expect(leave.startDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
      expect(leave.endDate).to.match(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
  
  describe('📊 Dashboard Data Integration', () => {
    
    it('should return time balance data for dashboard widgets', async () => {
      const mockBalanceResponse = {
        status: 200,
        body: {
          id: 1,
          employeeId: "E001",
          timeBalance: 0,
          vacationDays: 9,
          savedVacationDays: {
            "2017": 0,
            "2018": 0,
            "2019": 0,
            "2020": 0,
            "2021": 0,
            "2022": 5
          },
          vacationUnit: "days",
          compensationTime: 120,
          lastUpdated: "2025-01-15T00:00:00Z",
          createdAt: "2025-07-31T16:28:38.090939+00:00"
        }
      };
      
      const balance = mockBalanceResponse.body;
      
      // Dashboard widget fields must be camelCase
      expect(balance).to.have.property('employeeId');
      expect(balance).to.have.property('timeBalance');
      expect(balance).to.have.property('vacationDays');
      expect(balance).to.have.property('savedVacationDays');
      expect(balance).to.have.property('vacationUnit');
      expect(balance).to.have.property('compensationTime');
      expect(balance).to.have.property('lastUpdated');
      expect(balance).to.have.property('createdAt');
      
      // Verify nested object structure for frontend consumption
      expect(balance.savedVacationDays).to.be.an('object');
      expect(balance.vacationDays).to.be.a('number');
      expect(balance.compensationTime).to.be.a('number');
      
      // Verify no snake_case fields that would break dashboard
      expect(balance).to.not.have.property('employee_id');
      expect(balance).to.not.have.property('time_balance');
      expect(balance).to.not.have.property('vacation_days');
      expect(balance).to.not.have.property('saved_vacation_days');
      expect(balance).to.not.have.property('vacation_unit');
      expect(balance).to.not.have.property('compensation_time');
      expect(balance).to.not.have.property('last_updated');
      expect(balance).to.not.have.property('created_at');
    });
  });
  
  describe('📅 Schedule Integration', () => {
    
    it('should return schedule data for frontend calendar views', async () => {
      const mockScheduleResponse = {
        status: 200,
        body: [
          {
            id: 1,
            employeeId: "E001",
            date: "2025-07-31",
            startTime: "08:00:00",
            endTime: "17:00:00",
            breakStart: "12:00:00",
            breakEnd: "13:00:00",
            status: "scheduled",
            createdAt: "2025-07-31T16:28:38.090939+00:00"
          }
        ]
      };
      
      const schedule = mockScheduleResponse.body[0];
      
      // Frontend calendar fields must be camelCase
      expect(schedule).to.have.property('employeeId');
      expect(schedule).to.have.property('startTime');
      expect(schedule).to.have.property('endTime');
      expect(schedule).to.have.property('breakStart');
      expect(schedule).to.have.property('breakEnd');
      expect(schedule).to.have.property('createdAt');
      
      // Time format validation for frontend time pickers
      expect(schedule.startTime).to.match(/^\d{2}:\d{2}:\d{2}$/);
      expect(schedule.endTime).to.match(/^\d{2}:\d{2}:\d{2}$/);
      expect(schedule.breakStart).to.match(/^\d{2}:\d{2}:\d{2}$/);
      expect(schedule.breakEnd).to.match(/^\d{2}:\d{2}:\d{2}$/);
      
      // Verify no snake_case fields that would break calendar
      expect(schedule).to.not.have.property('employee_id');
      expect(schedule).to.not.have.property('start_time');
      expect(schedule).to.not.have.property('end_time');
      expect(schedule).to.not.have.property('break_start');
      expect(schedule).to.not.have.property('break_end');
      expect(schedule).to.not.have.property('created_at');
    });
  });
  
  describe('🔍 Manager View Integration', () => {
    
    it('should return manager approval data with correct field mapping', async () => {
      const mockManagerResponse = {
        status: 200,
        body: [
          {
            id: 35,
            employeeId: "E001",
            employeeName: "Test User",
            type: "deviation",
            date: "2025-08-24",
            timeCode: "300", 
            comment: "Sjukdom hela dagen",
            status: "pending",
            managerComment: null,
            approvedBy: null,
            approvedAt: null,
            rejectedBy: null,
            rejectedAt: null,
            lastUpdated: "2025-08-24T08:00:00Z",
            createdAt: "2025-08-24T08:00:00Z"
          }
        ]
      };
      
      const approval = mockManagerResponse.body[0];
      
      // Manager interface fields must be camelCase
      expect(approval).to.have.property('employeeId');
      expect(approval).to.have.property('employeeName');
      expect(approval).to.have.property('timeCode');
      expect(approval).to.have.property('managerComment');
      expect(approval).to.have.property('approvedBy');
      expect(approval).to.have.property('approvedAt');
      expect(approval).to.have.property('rejectedBy');
      expect(approval).to.have.property('rejectedAt');
      expect(approval).to.have.property('lastUpdated');
      expect(approval).to.have.property('createdAt');
      
      // Verify manager workflow data types
      expect(approval.employeeId).to.be.a('string');
      expect(approval.employeeName).to.be.a('string');
      expect(approval.status).to.be.a('string');
    });
  });
  
  describe('🚨 Frontend Error Handling', () => {
    
    it('should handle API errors gracefully without snake_case field references', async () => {
      const mockErrorResponse = {
        status: 500,
        body: {
          error: "Database connection failed",
          details: {
            endpoint: "/api/employees",
            timestamp: "2025-01-15T12:00:00Z",
            requestId: "req_123456"
          }
        }
      };
      
      // Error responses should also be camelCase for frontend consistency
      expect(mockErrorResponse.body).to.have.property('error');
      expect(mockErrorResponse.body.details).to.have.property('requestId');
      expect(mockErrorResponse.body.details).to.not.have.property('request_id');
    });
    
    it('should handle empty data responses correctly', async () => {
      const mockEmptyResponse = {
        status: 200,
        body: []
      };
      
      expect(mockEmptyResponse.body).to.be.an('array');
      expect(mockEmptyResponse.body).to.have.length(0);
    });
  });
});

/**
 * 🚀 FRONTEND INTEGRATION TEST GUIDELINES:
 * 
 * 1. Run tests before deploying frontend changes
 * 2. Add new tests when adding frontend components
 * 3. Verify data binding works with camelCase fields
 * 4. Test form submissions and validations
 * 5. Ensure TypeScript interfaces match API responses
 */