import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { employeeId } = req.query;
  const schedules = [{
    id: 1,
    employeeId: employeeId,
    date: "2025-08-01", 
    startTime: "08:00:00",
    endTime: "17:00:00"
  }];
  res.json(schedules);
}
