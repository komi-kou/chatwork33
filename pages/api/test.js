import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { roomId, message, apiToken } = req.body;

  if (!roomId || !message || !apiToken) {
    return res.status(400).json({ error: 'Room ID, message, and API token are required' });
  }

  try {
    const response = await axios.post(
      `https://api.chatwork.com/v2/rooms/${roomId}/messages`,
      `body=${encodeURIComponent(message)}`,
      {
        headers: {
          'X-ChatWorkToken': apiToken,
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to send message' });
  }
}