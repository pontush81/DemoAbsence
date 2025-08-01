import 'dotenv/config';
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Mock data för nu - låt oss bara testa att det fungerar
    const employees = [
      { id: "E001", firstName: "Anna", lastName: "Andersson" },
      { id: "E005", firstName: "Mikael", lastName: "Svensson" }
    ];
    
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
}
