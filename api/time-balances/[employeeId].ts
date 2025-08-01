import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { employeeId } = req.query;
  const timeBalance = {
    employeeId: employeeId,
    timeBalance: 270,
    vacationDays: 20
  };
  res.json(timeBalance);
}
