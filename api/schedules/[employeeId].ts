import 'dotenv/config';
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { restStorage } from '../../server/supabase-rest-storage';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const { employeeId } = req.query;
    const { date } = req.query;
    
    const filters: any = { employeeId };
    if (date) {
      filters.date = date;
    }
    
    const schedules = await restStorage.getSchedules(filters);
    
    // Map snake_case to camelCase for frontend compatibility (same as server/routes.ts)
    const mappedSchedules = schedules.map((schedule: any) => ({
      ...schedule,
      employeeId: schedule.employee_id || schedule.employeeId,
      startTime: schedule.start_time || schedule.startTime,
      endTime: schedule.end_time || schedule.endTime,
      breakStart: schedule.break_start || schedule.breakStart,
      breakEnd: schedule.break_end || schedule.breakEnd,
    }));
    
    res.json(mappedSchedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: (error as Error).message });
  }
}
