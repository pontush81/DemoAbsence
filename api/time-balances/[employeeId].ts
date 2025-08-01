import 'dotenv/config';
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { restStorage } from '../../server/supabase-rest-storage';
import { getMockData } from '../../server/storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { employeeId } = req.query;
    let timeBalance;
    
    // Try restStorage first (same logic as server/routes.ts)
    try {
      timeBalance = await restStorage.getTimeBalance(employeeId as string);
    } catch (error) {
      console.log('restStorage failed, trying direct mock fallback:', error);
    }
    
    // If restStorage didn't work, try direct mock data fallback
    if (!timeBalance) {
      const mockTimeBalances = await getMockData('timebalances.json');
      timeBalance = mockTimeBalances.find((tb: any) => tb.employeeId === employeeId);
    }
    
    if (timeBalance) {
      // Map snake_case to camelCase for frontend compatibility (same as server/routes.ts)
      const mappedTimeBalance = {
        ...timeBalance,
        employeeId: timeBalance.employee_id || timeBalance.employeeId,
        timeBalance: timeBalance.time_balance || timeBalance.timeBalance,
        vacationDays: timeBalance.vacation_days || timeBalance.vacationDays,
        savedVacationDays: timeBalance.saved_vacation_days || timeBalance.savedVacationDays,
        vacationUnit: timeBalance.vacation_unit || timeBalance.vacationUnit,
        compensationTime: timeBalance.compensation_time || timeBalance.compensationTime,
        lastUpdated: timeBalance.last_updated || timeBalance.lastUpdated,
      };
      
      res.json(mappedTimeBalance);
    } else {
      res.status(404).json({ message: 'Time balance not found' });
    }
  } catch (error) {
    console.error('Error fetching time balance:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
