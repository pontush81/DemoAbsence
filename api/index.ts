import 'dotenv/config';
import express from "express";
import restStorage from "../server/supabase-rest-storage";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API Routes - simplified for Vercel
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await restStorage.getEmployees();
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.get('/api/schedules/:employeeId', async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { date } = req.query;
    const schedules = await restStorage.getSchedules({ employeeId, date: date as string });
    res.json(schedules);
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

app.get('/api/time-balances/:employeeId', async (req, res) => {  
  try {
    const { employeeId } = req.params;
    const timeBalance = await restStorage.getTimeBalance(employeeId);
    res.json(timeBalance);
  } catch (error) {
    console.error('Error fetching time balance:', error);
    res.status(500).json({ error: 'Failed to fetch time balance' });
  }
});

// Export the Express app for Vercel serverless function
export default app;
