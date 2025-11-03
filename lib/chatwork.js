import axios from 'axios';

export async function sendMessage(roomId, message) {
  const apiToken = process.env.CHATWORK_API_TOKEN;
  
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
    return response.data;
  } catch (error) {
    console.error('Chatwork API Error:', error.response?.data || error.message);
    throw error;
  }
}

export async function getRooms() {
  const apiToken = process.env.CHATWORK_API_TOKEN;
  
  try {
    const response = await axios.get('https://api.chatwork.com/v2/rooms', {
      headers: {
        'X-ChatWorkToken': apiToken
      }
    });
    return response.data;
  } catch (error) {
    console.error('Chatwork API Error:', error.response?.data || error.message);
    throw error;
  }
}