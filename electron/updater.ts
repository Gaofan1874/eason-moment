import { app, ipcMain, shell, BrowserWindow } from 'electron';
import { UPDATE_FEED_URL } from './constants';

export function setupAutoUpdater(getMainWindow: () => BrowserWindow | null) {
  // Only run in packaged app
  if (!app.isPackaged) {
    // Register IPCs even in dev to avoid errors, but they will just log or return dev errors
    registerDevIPCs(getMainWindow);
    return;
  }

  const { autoUpdater } = require('electron-updater');
  autoUpdater.logger = console;
  
  // Configure
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: UPDATE_FEED_URL
  });
  autoUpdater.autoDownload = false;

  // --- Event Listeners ---
  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info: any) => {
    getMainWindow()?.webContents.send('update-message', { 
      type: 'available', 
      text: '发现新版本', 
      info,
      notes: info.releaseNotes 
    });
  });

  autoUpdater.on('update-not-available', (info: any) => {
    console.log('Update not available:', info?.version);
  });

  autoUpdater.on('error', (err: any) => {
    console.error('AutoUpdater Error:', err);
  });

  autoUpdater.on('download-progress', (progressObj: any) => {
    getMainWindow()?.webContents.send('update-message', { type: 'progress', progress: progressObj });
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    getMainWindow()?.webContents.send('update-message', { type: 'downloaded', text: '下载完成，请重启安装', info });
  });

  // Initial check on startup
  autoUpdater.checkForUpdatesAndNotify().catch((err: any) => {
    console.error('Failed to check for updates on startup:', err);
  });

  // --- Register IPC Handlers ---
  
  // 1. Check for update (Manual)
  ipcMain.on('check-for-update', async () => {
    console.log('[Main] IPC: check-for-update received');
    const win = getMainWindow();

    console.log('[Main] Sending "checking" to renderer');
    win?.webContents.send('update-message', { type: 'checking', text: '正在检查更新...' });

    // Clean up previous listeners if any (though we are using the global autoUpdater instance)
    // In this refactor, we rely on the global listeners set above for the 'background' events,
    // but for manual check feedback, we might want to capture specific one-time events if we want strict request-response.
    // However, the existing global listeners will broadcast to the window anyway.
    
    // But to handle "Error" or "Not Available" specifically for this *manual* request (in case global ones are silent for those),
    // we can add temporary one-off listeners or just rely on the UI handling the broadcast.
    // The original code had complex timeout logic. Let's simplify but keep reliability.
    
    // We will use a wrapper to catch the result of checkForUpdates
    try {
      const result = await autoUpdater.checkForUpdates();
      if (!result) {
         // If null, it might mean logic prevented update check
         win?.webContents.send('update-message', { 
           type: 'error', 
           text: '检查更新服务未响应 (Result is null)' 
         });
      }
    } catch (e: any) {
      console.error('[Main] Exception in checkForUpdates:', e);
      win?.webContents.send('update-message', { 
        type: 'error', 
        text: '检查更新失败: ' + (e.message || '网络错误') 
      });
    }
  });

  // 2. Start Download
  ipcMain.on('start-download', async () => {
    console.log('[Main] IPC: start-download received');
    try {
      await autoUpdater.downloadUpdate();
    } catch (err: any) {
      console.error('[Main] downloadUpdate failed:', err);
      getMainWindow()?.webContents.send('update-message', { 
        type: 'error', 
        text: '自动下载失败，请尝试手动下载' 
      });
    }
  });

  // 3. Install
  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });
}

function registerDevIPCs(getMainWindow: () => BrowserWindow | null) {
  ipcMain.on('check-for-update', () => {
    console.log('[Main] App is not packaged (Dev Mode)');
    getMainWindow()?.webContents.send('update-message', { 
      type: 'error', 
      text: '开发环境无法检查更新 (Dev Mode)' 
    });
  });

  ipcMain.on('start-download', () => {
     console.log('[Main] Dev Mode: start-download ignored');
  });

  ipcMain.on('install-update', () => {
     console.log('[Main] Dev Mode: install-update ignored');
  });
}

// Common IPCs that work in both (or handled conditionally inside)
ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion();
});

ipcMain.on('restart_app', () => {
  // If we are here, it's likely for update purposes, but in dev it just quits
  if (app.isPackaged) {
    const { autoUpdater } = require('electron-updater');
    autoUpdater.quitAndInstall();
  } else {
    app.quit();
  }
});

ipcMain.on('open-download-link', (_event, url) => {
  const targetUrl = url || 'https://easonlab.faygift.com/api/download/mac';
  shell.openExternal(targetUrl);
});
