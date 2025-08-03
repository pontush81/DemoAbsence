import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // PAXML import-schedules requires complex server-side processing
  // This functionality is available in the full server environment (localhost)
  // but not supported in the Vercel serverless environment
  
  res.status(503).json({
    error: 'PAXML import-schedules not available',
    message: 'PAXML import-schedules functionality requires the full server environment and is not available in the serverless deployment.',
    suggestion: 'Please use the localhost development environment for PAXML import-schedules functionality.',
    localUrl: 'http://localhost:3000/api/paxml/import-schedules',
    note: 'This feature requires file system access and complex XML processing that is not supported in Vercel serverless functions.'
  });
}