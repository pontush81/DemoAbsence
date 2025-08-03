/**
 * 🚀 LIVE API TESTS - Riktiga tester mot lokal server
 * 
 * Dessa tester kör mot den faktiska servern på localhost:3000
 * och verifierar att field mapping fungerar i praktiken
 */

const request = require('supertest');
const { expect } = require('chai');

const BASE_URL = 'http://localhost:3000';

describe('🚀 Live API Integration Tests', function() {
  // Increase timeout for API calls
  this.timeout(10000);
  
  describe('🔥 Smoke Test - All Endpoints camelCase', () => {
    
    it('should return employees with 0 snake_case fields', async () => {
      const response = await request(BASE_URL)
        .get('/api/employees')
        .expect(200);
        
      expect(response.body).to.be.an('array');
      expect(response.body.length).to.be.greaterThan(0);
      
      const employee = response.body[0];
      const snakeCaseFields = Object.keys(employee).filter(key => key.includes('_'));
      
      expect(snakeCaseFields).to.have.length(0, `Found snake_case fields: ${snakeCaseFields.join(', ')}`);
      
      // Verify critical camelCase fields exist
      expect(employee).to.have.property('employeeId');
      expect(employee).to.have.property('firstName');
      expect(employee).to.have.property('lastName');
    });
    
    it('should return deviations with 0 snake_case fields', async () => {
      const response = await request(BASE_URL)
        .get('/api/deviations?employeeId=E001')
        .expect(200);
        
      expect(response.body).to.be.an('array');
      
      if (response.body.length > 0) {
        const deviation = response.body[0];
        const snakeCaseFields = Object.keys(deviation).filter(key => key.includes('_'));
        
        expect(snakeCaseFields).to.have.length(0, `Found snake_case fields: ${snakeCaseFields.join(', ')}`);
        
        // Verify critical camelCase fields
        expect(deviation).to.have.property('employeeId');
        expect(deviation).to.have.property('timeCode');
      }
    });
    
    it('should return leave requests with 0 snake_case fields', async () => {
      const response = await request(BASE_URL)
        .get('/api/leave-requests?employeeId=E001')
        .expect(200);
        
      expect(response.body).to.be.an('array');
      
      if (response.body.length > 0) {
        const leave = response.body[0];
        const snakeCaseFields = Object.keys(leave).filter(key => key.includes('_'));
        
        expect(snakeCaseFields).to.have.length(0, `Found snake_case fields: ${snakeCaseFields.join(', ')}`);
        
        // Verify critical camelCase fields
        expect(leave).to.have.property('employeeId');
        expect(leave).to.have.property('startDate');
        expect(leave).to.have.property('endDate');
      }
    });
    
    it('should return time balances with 0 snake_case fields', async () => {
      const response = await request(BASE_URL)
        .get('/api/time-balances/E001')
        .expect(200);
        
      const balance = response.body;
      const snakeCaseFields = Object.keys(balance).filter(key => key.includes('_'));
      
      expect(snakeCaseFields).to.have.length(0, `Found snake_case fields: ${snakeCaseFields.join(', ')}`);
      
      // Verify critical camelCase fields
      expect(balance).to.have.property('employeeId');
      expect(balance).to.have.property('vacationDays');
      expect(balance).to.have.property('compensationTime');
    });
    
    it('should return schedules with 0 snake_case fields', async () => {
      const response = await request(BASE_URL)
        .get('/api/schedules?employeeId=E001')
        .expect(200);
        
      expect(response.body).to.be.an('array');
      
      if (response.body.length > 0) {
        const schedule = response.body[0];
        const snakeCaseFields = Object.keys(schedule).filter(key => key.includes('_'));
        
        expect(snakeCaseFields).to.have.length(0, `Found snake_case fields: ${snakeCaseFields.join(', ')}`);
        
        // Verify critical camelCase fields that we fixed
        expect(schedule).to.have.property('employeeId');
        expect(schedule).to.have.property('startTime');
        expect(schedule).to.have.property('endTime');
        expect(schedule).to.have.property('breakStart');
        expect(schedule).to.have.property('breakEnd');
        expect(schedule).to.have.property('createdAt');
      }
    });
  });
  
  describe('💰 Payroll-Critical Functionality', () => {
    
    it('should preserve manager comments correctly', async () => {
      const response = await request(BASE_URL)
        .get('/api/deviations/35')
        .expect(200);
        
      const deviation = response.body;
      
      // Verify manager comment exists and is not null
      expect(deviation).to.have.property('managerComment');
      expect(deviation.managerComment).to.be.a('string');
      expect(deviation.managerComment).to.not.be.empty;
      
      // Verify approval fields are camelCase
      expect(deviation).to.have.property('approvedBy');
      expect(deviation).to.have.property('approvedAt');
    });
    
    it('should return correct vacation balance structure', async () => {
      const response = await request(BASE_URL)
        .get('/api/time-balances/E001')
        .expect(200);
        
      const balance = response.body;
      
      // Verify vacation days is a number
      expect(balance.vacationDays).to.be.a('number');
      expect(balance.vacationDays).to.be.greaterThanOrEqual(0);
      
      // Verify nested savedVacationDays object exists
      expect(balance.savedVacationDays).to.be.an('object');
      
      // Verify compensation time
      expect(balance.compensationTime).to.be.a('number');
    });
  });
  
  describe('⚠️ Edge Cases', () => {
    
    it('should handle non-existent employee gracefully', async () => {
      const response = await request(BASE_URL)
        .get('/api/time-balances/NONEXISTENT')
        .expect(404);
        
      expect(response.body).to.have.property('message');
      expect(response.body.message).to.equal('Time balance not found');
    });
    
    it('should return empty array for no results', async () => {
      const response = await request(BASE_URL)
        .get('/api/deviations?employeeId=NONEXISTENT')
        .expect(200);
        
      expect(response.body).to.be.an('array');
      expect(response.body).to.have.length(0);
    });
  });
});