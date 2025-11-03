import { getReminders, saveReminders } from '../../../lib/github';

export default async function handler(req, res) {
  const { id } = req.query;

  try {
    if (req.method === 'PUT') {
      const reminders = await getReminders();
      const index = reminders.findIndex(r => r.id === id);
      
      if (index === -1) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      
      reminders[index] = { ...reminders[index], ...req.body };
      await saveReminders(reminders);
      
      return res.status(200).json(reminders[index]);
    }

    if (req.method === 'DELETE') {
      const reminders = await getReminders();
      const filteredReminders = reminders.filter(r => r.id !== id);
      
      if (reminders.length === filteredReminders.length) {
        return res.status(404).json({ error: 'Reminder not found' });
      }
      
      await saveReminders(filteredReminders);
      
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}