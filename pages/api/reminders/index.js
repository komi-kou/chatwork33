import { getReminders, saveReminders } from '../../../lib/github';

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const reminders = await getReminders();
      return res.status(200).json(reminders);
    }

    if (req.method === 'POST') {
      const reminders = await getReminders();
      const newReminder = {
        id: Date.now().toString(),
        ...req.body,
        enabled: true,
        createdAt: new Date().toISOString()
      };
      
      reminders.push(newReminder);
      await saveReminders(reminders);
      
      return res.status(201).json(newReminder);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}