import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiToken = req.headers['x-chatwork-token'];
  
  if (!apiToken) {
    return res.status(400).json({ error: 'API token is required' });
  }

  try {
    const response = await axios.get('https://api.chatwork.com/v2/rooms', {
      headers: {
        'X-ChatWorkToken': apiToken
      }
    });
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('API Error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'Failed to fetch rooms' });
  }
}