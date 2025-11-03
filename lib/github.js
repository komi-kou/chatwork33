import { Octokit } from '@octokit/rest';
import fs from 'fs/promises';
import path from 'path';

const REPO_OWNER = process.env.GITHUB_OWNER;
const REPO_NAME = process.env.GITHUB_REPO;
const FILE_PATH = 'data/reminders.json';
const LOCAL_FILE_PATH = path.join(process.cwd(), 'data', 'reminders.json');

// 開発環境ではローカルファイル、本番環境ではGitHubを使用
const useGitHub = process.env.NODE_ENV === 'production' && 
                  process.env.GITHUB_TOKEN && 
                  process.env.GITHUB_OWNER && 
                  process.env.GITHUB_REPO &&
                  process.env.GITHUB_TOKEN !== 'your_github_personal_access_token_here';

export async function getReminders() {
  if (!useGitHub) {
    // ローカルファイルから読み込み
    try {
      const data = await fs.readFile(LOCAL_FILE_PATH, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  try {
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN
    });

    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH
    });

    const content = Buffer.from(data.content, 'base64').toString();
    return JSON.parse(content);
  } catch (error) {
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function saveReminders(reminders) {
  if (!useGitHub) {
    // ローカルファイルに保存
    const dir = path.dirname(LOCAL_FILE_PATH);
    try {
      await fs.access(dir);
    } catch {
      await fs.mkdir(dir, { recursive: true });
    }
    await fs.writeFile(LOCAL_FILE_PATH, JSON.stringify(reminders, null, 2));
    return;
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const content = Buffer.from(JSON.stringify(reminders, null, 2)).toString('base64');

  try {
    const { data: currentFile } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH
    });

    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: FILE_PATH,
      message: 'Update reminders',
      content,
      sha: currentFile.sha
    });
  } catch (error) {
    if (error.status === 404) {
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: FILE_PATH,
        message: 'Create reminders file',
        content
      });
    } else {
      throw error;
    }
  }

  await updateGitHubActions(reminders);
}

async function updateGitHubActions(reminders) {
  if (!useGitHub) {
    // ローカル環境では何もしない
    return;
  }

  const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
  });

  const enabledReminders = reminders.filter(r => r.enabled);
  
  for (const reminder of enabledReminders) {
    const workflowContent = generateWorkflow(reminder);
    const fileName = `.github/workflows/reminder-${reminder.id}.yml`;
    
    try {
      const { data: currentFile } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: fileName
      });

      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: fileName,
        message: `Update workflow for ${reminder.name}`,
        content: Buffer.from(workflowContent).toString('base64'),
        sha: currentFile.sha
      });
    } catch (error) {
      if (error.status === 404) {
        await octokit.repos.createOrUpdateFileContents({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          path: fileName,
          message: `Create workflow for ${reminder.name}`,
          content: Buffer.from(workflowContent).toString('base64')
        });
      }
    }
  }

  const disabledReminders = reminders.filter(r => !r.enabled);
  for (const reminder of disabledReminders) {
    const fileName = `.github/workflows/reminder-${reminder.id}.yml`;
    try {
      const { data: file } = await octokit.repos.getContent({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: fileName
      });
      
      await octokit.repos.deleteFile({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: fileName,
        message: `Delete workflow for ${reminder.name}`,
        sha: file.sha
      });
    } catch (error) {
      // ファイルが存在しない場合は無視
    }
  }
}

function generateWorkflow(reminder) {
  const cron = createCronExpression(reminder.schedule);
  
  // APIトークンが個別設定されているかチェック
  const useCustomToken = reminder.apiToken && reminder.apiToken !== '';
  const tokenSecret = useCustomToken ? `CHATWORK_TOKEN_${reminder.id}` : 'CHATWORK_API_TOKEN';
  
  return `name: ${reminder.name}

on:
  schedule:
    - cron: '${cron}'
  workflow_dispatch:

jobs:
  send-reminder:
    runs-on: ubuntu-latest
    steps:
      - name: Send Chatwork Message
        env:
          CHATWORK_API_TOKEN: \${{ secrets.${tokenSecret} }}
        run: |
          curl -X POST https://api.chatwork.com/v2/rooms/${reminder.roomId}/messages \\
            -H "X-ChatWorkToken: \$CHATWORK_API_TOKEN" \\
            -d "body=${encodeURIComponent(reminder.message)}"
`;
}

function createCronExpression(schedule) {
  const { type, time, dayOfWeek, dayOfMonth } = schedule;
  const [hour, minute] = time.split(':');
  
  const jstHour = parseInt(hour) - 9;
  const utcHour = jstHour < 0 ? jstHour + 24 : jstHour;
  
  switch (type) {
    case 'daily':
      return `${minute} ${utcHour} * * *`;
    case 'weekly':
      return `${minute} ${utcHour} * * ${dayOfWeek}`;
    case 'monthly':
      return `${minute} ${utcHour} ${dayOfMonth} * *`;
    default:
      throw new Error('Invalid schedule type');
  }
}