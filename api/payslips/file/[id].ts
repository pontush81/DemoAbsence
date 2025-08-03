import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Payslip ID is required' });
  }

  // In a real implementation, we would fetch and return the actual PDF file
  // For mock purposes, we return a placeholder response
  res.json({ 
    message: 'Payslip file content would be returned here',
    payslipId: id,
    note: 'This is a mock implementation - actual PDF file would be served here'
  });
}