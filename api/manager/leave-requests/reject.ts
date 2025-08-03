import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to read mock data
async function getMockData(filename: string) {
  try {
    const filePath = path.join(process.cwd(), 'mock-data', filename);
    const fileContent = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error reading mock data ${filename}:`, error);
    return [];
  }
}

// Helper to save mock data back to file (CRITICAL: This was missing!)
async function saveMockData(filename: string, data: any) {
  try {
    const filePath = path.join(process.cwd(), 'mock-data', filename);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Successfully saved mock data to ${filename}`);
  } catch (error) {
    console.error(`❌ Error saving mock data ${filename}:`, error);
    throw error;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    try {
      const { id } = req.query;
      const leaveRequestId = parseInt(id as string);
      
      const updateData = {
        status: 'rejected',
        manager_comment: req.body.comment || 'Rejected',
        rejected_by: req.body.managerId || 'E005',
        rejected_at: new Date().toISOString()
      };
      
      let rejectedLeaveRequest;
      
      // Try Supabase first, fallback to mock data
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('leave_requests')
            .update(updateData)
            .eq('id', leaveRequestId)
            .select()
            .single();
          
          if (error) throw error;
          rejectedLeaveRequest = data;
        } catch (error) {
          console.log('Supabase rejection failed, using mock data:', error);
        }
      }
      
      // If Supabase didn't work, try mock data fallback
      if (!rejectedLeaveRequest) {
        const leaveRequests = await getMockData('leave-requests.json');
        const index = leaveRequests.findIndex((lr: any) => lr.id === leaveRequestId);
        
        if (index !== -1) {
          // 🎯 CRITICAL FIX: Update the object in the array AND save back to file
          rejectedLeaveRequest = {
            ...leaveRequests[index],
            ...updateData,
            lastUpdated: new Date().toISOString()
          };
          
          // Update the array with the rejected request
          leaveRequests[index] = rejectedLeaveRequest;
          
          // Save the updated array back to the file (THIS WAS MISSING!)
          await saveMockData('leave-requests.json', leaveRequests);
          
          console.log(`✅ Successfully rejected leave request ${leaveRequestId} in mock data`);
        }
      }
      
      if (rejectedLeaveRequest) {
        // Map snake_case to camelCase for frontend compatibility
        const mappedLeaveRequest = {
          ...rejectedLeaveRequest,
          employeeId: rejectedLeaveRequest.employee_id || rejectedLeaveRequest.employeeId,
          startDate: rejectedLeaveRequest.start_date || rejectedLeaveRequest.startDate,
          endDate: rejectedLeaveRequest.end_date || rejectedLeaveRequest.endDate,
          leaveType: rejectedLeaveRequest.leave_type || rejectedLeaveRequest.leaveType,
          managerComment: rejectedLeaveRequest.manager_comment || rejectedLeaveRequest.managerComment,
          rejectedBy: rejectedLeaveRequest.rejected_by || rejectedLeaveRequest.rejectedBy,
          rejectedAt: rejectedLeaveRequest.rejected_at || rejectedLeaveRequest.rejectedAt,
        };
        
        res.json(mappedLeaveRequest);
      } else {
        res.status(404).json({ message: 'Leave request not found' });
      }
    } catch (error) {
      console.error('Error rejecting leave request:', error);
      res.status(500).json({ error: (error as Error).message });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}