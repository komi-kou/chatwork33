import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [reminders, setReminders] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    apiToken: '',
    roomId: '',
    message: '',
    scheduleType: 'daily',
    dayOfWeek: '1',
    dayOfMonth: '1',
    time: '09:00'
  });
  const [rooms, setRooms] = useState([]);
  const [showRooms, setShowRooms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      const response = await axios.get('/api/reminders');
      setReminders(response.data);
    } catch (error) {
      console.error('リマインダー読み込みエラー:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reminders', {
        ...formData,
        schedule: {
          type: formData.scheduleType,
          time: formData.time,
          dayOfWeek: formData.dayOfWeek,
          dayOfMonth: formData.dayOfMonth
        }
      });
      showAlert('リマインダーを作成しました', 'success');
      setFormData({
        name: '',
        apiToken: '',
        roomId: '',
        message: '',
        scheduleType: 'daily',
        dayOfWeek: '1',
        dayOfMonth: '1',
        time: '09:00'
      });
      loadReminders();
    } catch (error) {
      showAlert('作成に失敗しました', 'error');
    }
    setLoading(false);
  };

  const toggleReminder = async (id, enabled) => {
    try {
      await axios.put(`/api/reminders/${id}`, { enabled });
      showAlert(`リマインダーを${enabled ? '有効化' : '無効化'}しました`, 'success');
      loadReminders();
    } catch (error) {
      showAlert('操作に失敗しました', 'error');
    }
  };

  const deleteReminder = async (id) => {
    if (!confirm('このリマインダーを削除しますか？')) return;
    
    try {
      await axios.delete(`/api/reminders/${id}`);
      showAlert('リマインダーを削除しました', 'success');
      loadReminders();
    } catch (error) {
      showAlert('削除に失敗しました', 'error');
    }
  };

  const loadRooms = async () => {
    if (!formData.apiToken) {
      showAlert('APIトークンを入力してください', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.get('/api/rooms', {
        headers: {
          'X-ChatWork-Token': formData.apiToken
        }
      });
      setRooms(response.data);
      setShowRooms(true);
    } catch (error) {
      showAlert('ルーム取得に失敗しました。APIトークンを確認してください。', 'error');
    }
    setLoading(false);
  };

  const testSend = async () => {
    if (!formData.roomId || !formData.message) {
      showAlert('ルームIDとメッセージを入力してください', 'error');
      return;
    }
    
    if (!formData.apiToken) {
      showAlert('APIトークンを入力してください', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post('/api/test', {
        roomId: formData.roomId,
        message: formData.message,
        apiToken: formData.apiToken
      });
      showAlert('テストメッセージを送信しました', 'success');
    } catch (error) {
      showAlert('送信に失敗しました', 'error');
    }
    setLoading(false);
  };

  const showAlert = (message, type) => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 3000);
  };

  const getScheduleText = (schedule) => {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    switch (schedule.type) {
      case 'daily':
        return `毎日 ${schedule.time}`;
      case 'weekly':
        return `毎週${days[schedule.dayOfWeek]}曜日 ${schedule.time}`;
      case 'monthly':
        return `毎月${schedule.dayOfMonth}日 ${schedule.time}`;
      default:
        return '不明';
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Chatworkリマインダー設定</h1>
      
      {alert && (
        <div className={`${styles.alert} ${styles[`alert_${alert.type}`]}`}>
          {alert.message}
        </div>
      )}

      <div className={styles.card}>
        <h2>新規リマインダー作成</h2>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">リマインダー名:</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="apiToken">Chatwork APIトークン:</label>
            <input
              type="text"
              id="apiToken"
              value={formData.apiToken}
              onChange={(e) => setFormData({...formData, apiToken: e.target.value})}
              placeholder="APIトークンを入力"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="roomId">ルームID:</label>
            <div className={styles.inputGroup}>
              <input
                type="text"
                id="roomId"
                value={formData.roomId}
                onChange={(e) => setFormData({...formData, roomId: e.target.value})}
                placeholder="ルームIDを入力または選択"
                required
              />
              <button type="button" onClick={loadRooms} className={styles.btnSecondary} disabled={loading}>
                ルーム一覧取得
              </button>
            </div>
          </div>

          {showRooms && (
            <div className={styles.roomsList}>
              {rooms.map(room => (
                <div
                  key={room.room_id}
                  className={styles.roomItem}
                  onClick={() => {
                    setFormData({...formData, roomId: room.room_id});
                    setShowRooms(false);
                    showAlert(`ルーム「${room.name}」を選択しました`, 'success');
                  }}
                >
                  <strong>{room.name}</strong> (ID: {room.room_id})
                </div>
              ))}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="message">メッセージ:</label>
            <textarea
              id="message"
              rows="4"
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="scheduleType">スケジュール:</label>
            <select
              id="scheduleType"
              value={formData.scheduleType}
              onChange={(e) => setFormData({...formData, scheduleType: e.target.value})}
            >
              <option value="daily">毎日</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
            </select>
          </div>

          {formData.scheduleType === 'weekly' && (
            <div className={styles.formGroup}>
              <label htmlFor="dayOfWeek">曜日:</label>
              <select
                id="dayOfWeek"
                value={formData.dayOfWeek}
                onChange={(e) => setFormData({...formData, dayOfWeek: e.target.value})}
              >
                <option value="0">日曜日</option>
                <option value="1">月曜日</option>
                <option value="2">火曜日</option>
                <option value="3">水曜日</option>
                <option value="4">木曜日</option>
                <option value="5">金曜日</option>
                <option value="6">土曜日</option>
              </select>
            </div>
          )}

          {formData.scheduleType === 'monthly' && (
            <div className={styles.formGroup}>
              <label htmlFor="dayOfMonth">日付:</label>
              <input
                type="number"
                id="dayOfMonth"
                min="1"
                max="31"
                value={formData.dayOfMonth}
                onChange={(e) => setFormData({...formData, dayOfMonth: e.target.value})}
              />
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="time">時刻:</label>
            <input
              type="time"
              id="time"
              value={formData.time}
              onChange={(e) => setFormData({...formData, time: e.target.value})}
              required
            />
          </div>

          <div className={styles.buttonGroup}>
            <button type="submit" className={styles.btnPrimary} disabled={loading}>
              リマインダーを作成
            </button>
            <button type="button" onClick={testSend} className={styles.btnSecondary} disabled={loading}>
              テスト送信
            </button>
          </div>
        </form>
      </div>

      <div className={styles.card}>
        <h2>登録済みリマインダー</h2>
        <div className={styles.remindersList}>
          {reminders.length === 0 ? (
            <p className={styles.noData}>リマインダーがありません</p>
          ) : (
            reminders.map(reminder => (
              <div key={reminder.id} className={styles.reminderItem}>
                <div className={styles.reminderHeader}>
                  <span className={styles.reminderName}>{reminder.name}</span>
                  <span className={`${styles.status} ${reminder.enabled ? styles.statusEnabled : styles.statusDisabled}`}>
                    {reminder.enabled ? '有効' : '無効'}
                  </span>
                </div>
                <div className={styles.reminderDetails}>
                  <p><strong>ルームID:</strong> {reminder.roomId}</p>
                  <p><strong>スケジュール:</strong> {getScheduleText(reminder.schedule)}</p>
                  <p><strong>メッセージ:</strong> {reminder.message}</p>
                </div>
                <div className={styles.reminderActions}>
                  <button
                    onClick={() => toggleReminder(reminder.id, !reminder.enabled)}
                    className={styles.btnSecondary}
                  >
                    {reminder.enabled ? '無効化' : '有効化'}
                  </button>
                  <button
                    onClick={() => deleteReminder(reminder.id)}
                    className={styles.btnDanger}
                  >
                    削除
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}