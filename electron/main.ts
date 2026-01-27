import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog, screen, shell } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
// @ts-ignore
import lyricsData from '../src/assets/lyrics.json'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')



// --- Auto Update Logic ---
const UPDATE_FEED_URL = 'https://easonlab.faygift.com/api';

function configureAutoUpdater() {
  const { autoUpdater } = require('electron-updater');
  autoUpdater.logger = console;
  
  // Set the feed URL explicitly
  autoUpdater.setFeedURL({
    provider: 'generic',
    url: UPDATE_FEED_URL
  });

  // Ensure auto-download is disabled so we can prompt the user
  autoUpdater.autoDownload = false;
  
  return autoUpdater;
}

function setupAutoUpdater() {
  if (!app.isPackaged) return;

  const autoUpdater = configureAutoUpdater();

  // Global listeners for background update process
  autoUpdater.on('checking-for-update', () => {
    // Only send this if we want to show status in UI, mostly for manual checks
    // But good for debugging
    console.log('Checking for updates...');
  });

  autoUpdater.on('update-available', (info: any) => {
    win?.webContents.send('update-message', { 
      type: 'available', 
      text: '发现新版本', 
      info,
      notes: info.releaseNotes 
    });
  });

  autoUpdater.on('update-not-available', (info: any) => {
    // For background check, we usually don't bother the user, 
    // unless they manually checked (handled in IPC)
    console.log('Update not available:', info?.version);
  });

  autoUpdater.on('error', (err: any) => {
    console.error('AutoUpdater Error:', err);
    // Silent fail for background check, manual check will catch its own error
  });

  autoUpdater.on('download-progress', (progressObj: any) => {
    win?.webContents.send('update-message', { type: 'progress', progress: progressObj });
  });

  autoUpdater.on('update-downloaded', (info: any) => {
    win?.webContents.send('update-message', { type: 'downloaded', text: '下载完成，请重启安装', info });
  });

  // Start background check
  autoUpdater.checkForUpdatesAndNotify().catch((err: any) => {
    console.error('Failed to check for updates on startup:', err);
  });
}

// IPC listener for manual update check
ipcMain.on('check-for-update', async () => {
  console.log('[Main] IPC: check-for-update received');

  // 1. Dev Environment Guard
  if (!app.isPackaged) {
    console.log('[Main] App is not packaged, sending error');
    win?.webContents.send('update-message', { 
      type: 'error', 
      text: '开发环境无法检查更新 (Dev Mode)' 
    });
    return;
  }

  const autoUpdater = configureAutoUpdater();

  // 2. Notify Frontend: Checking Started
  console.log('[Main] Sending "checking" to renderer');
  win?.webContents.send('update-message', { type: 'checking', text: '正在检查更新...' });

  // 3. Remove any previous one-time listeners
  autoUpdater.removeAllListeners('update-available');
  autoUpdater.removeAllListeners('update-not-available');
  autoUpdater.removeAllListeners('error');

  // Timeout Logic
  let isHandled = false;
  const timeoutId = setTimeout(() => {
    if (!isHandled) {
      console.error('[Main] Update check TIMED OUT (15s)');
      isHandled = true;
      cleanup();
      win?.webContents.send('update-message', { 
        type: 'error', 
        text: '检查更新超时，请稍后重试' 
      });
    }
  }, 15000);

  // 4. Set up explicit listeners
  const onAvailable = (info: any) => {
    console.log('[Main] Event: update-available', info?.version);
    if (isHandled) return;
    isHandled = true;
    clearTimeout(timeoutId);
    
    win?.webContents.send('update-message', { type: 'available', text: '发现新版本', info });
    cleanup();
  };

  const onNotAvailable = (info: any) => {
    console.log('[Main] Event: update-not-available', info?.version);
    if (isHandled) return;
    isHandled = true;
    clearTimeout(timeoutId);
    win?.webContents.send('update-message', { 
      type: 'not-available', 
      text: '当前已是最新版本', 
      info 
    });
    cleanup();
  };

  const onError = (err: any) => {
    console.error('[Main] Event: error', err);
    if (isHandled) return;
    isHandled = true;
    clearTimeout(timeoutId);
    win?.webContents.send('update-message', { 
      type: 'error', 
      text: '检查更新失败: ' + (err.message || '网络错误') 
    });
    cleanup();
  };

  const cleanup = () => {
    console.log('[Main] Cleaning up listeners');
    autoUpdater.removeListener('update-available', onAvailable);
    autoUpdater.removeListener('update-not-available', onNotAvailable);
    autoUpdater.removeListener('error', onError);
  };

  autoUpdater.on('update-available', onAvailable);
  autoUpdater.on('update-not-available', onNotAvailable);
  autoUpdater.on('error', onError);

  // 5. Execute Check
  try {
    console.log('[Main] Calling autoUpdater.checkForUpdates()...');
    const result = await autoUpdater.checkForUpdates();
    console.log('[Main] checkForUpdates returned:', result ? 'Result Object' : 'null');
    
    if (!result && !isHandled) {
       console.warn('[Main] Result is null, but no event fired yet. Waiting for timeout or late event...');
       // Wait a short bit to see if events fire, if not, trigger error
       // But usually null means "cannot check"
       setTimeout(() => {
          if (!isHandled) {
             console.error('[Main] Null result handled after delay');
             isHandled = true;
             clearTimeout(timeoutId);
             cleanup();
             win?.webContents.send('update-message', { 
               type: 'error', 
               text: '检查更新服务未响应 (Result is null)' 
             });
          }
       }, 2000);
    }
  } catch (e: any) {
    console.error('[Main] Exception in checkForUpdates:', e);
    onError(e);
  }
});

ipcMain.on('get-app-version', (event) => {
  event.returnValue = app.getVersion();
});

// IPC listener for restarting the app
ipcMain.on('restart_app', () => {
  const { autoUpdater } = require('electron-updater');
  autoUpdater.quitAndInstall();
});

// --- New Update IPC Handlers ---
ipcMain.on('start-download', async () => {
  console.log('[Main] IPC: start-download received');
  const autoUpdater = configureAutoUpdater();
  try {
    await autoUpdater.downloadUpdate();
    console.log('[Main] downloadUpdate call initiated');
  } catch (err: any) {
    console.error('[Main] downloadUpdate failed:', err);
    win?.webContents.send('update-message', { 
      type: 'error', 
      text: '自动下载失败，请尝试手动下载' 
    });
  }
});

ipcMain.on('install-update', () => {
  const autoUpdater = configureAutoUpdater();
  autoUpdater.quitAndInstall();
});

ipcMain.on('open-download-link', (_event, url) => {
  const targetUrl = url || 'https://easonlab.faygift.com/api/download/mac';
  shell.openExternal(targetUrl);
});


let win: BrowserWindow | null;
let tray: Tray | null;
let lyricWin: BrowserWindow | null = null;
let isQuitting = false;
let dragTimer: NodeJS.Timeout | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// Fix for Windows transparent window ghosting/painting issues
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

// --- Data & State ---
interface Lyric {
  content: string;
  song: string;
  album: string;
  tags?: string[];
}

const MOOD_MAP: Record<string, string> = {
  random: '🎲 随机漫步',
  sad: '🌧️ 深夜抑郁',
  healing: '☕ 治愈哲理',
  romance: '💕 爱与浪漫',
  crazy: '🔥 浮夸热血',
  classic: '📀 岁月金曲',
};

// Define tag groups for better filtering
const MOOD_GROUPS: Record<string, string[]> = {
  sad: ['sad', 'lonely', 'dark', 'pain', 'regret'],
  healing: ['healing', 'philosophy', 'life', 'brightness', 'soul', 'humanity', 'self'],
  romance: ['love', 'promise'],
  crazy: ['crazy', 'power', 'freedom', 'social'],
  classic: ['classic', 'memory']
};

let lyrics: Lyric[] = lyricsData as Lyric[]; // Use bundled data
let currentMood = 'random'

const UPDATE_INTERVALS = [
  { label: '1 分钟', value: 1 * 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '15 分钟', value: 15 * 60 * 1000 },
  { label: '30 分钟', value: 30 * 60 * 1000 },
  { label: '1 小时', value: 60 * 60 * 1000 }
];

const LYRIC_COLORS = [
  { label: '🤍 纯净白', value: '#ffffff' },
  { label: '💛 辉煌金', value: '#FFD700' },
  { label: '💚 治愈青', value: '#00e676' },
  { label: '💙 E粉蓝', value: '#00BFFF' },
  { label: '💗 浪漫粉', value: '#FF69B4' }
];

let currentInterval = 5 * 60 * 1000 // Default 5 mins
let currentLyricColor = '#ffffff' // Default white
let timer: NodeJS.Timeout | null = null
let currentLyric: Lyric | null = null

// --- Config Persistence ---
function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

function loadConfig() {
  try {
    const configPath = getConfigPath();
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf-8');
      const config = JSON.parse(data);
      if (config.currentLyricColor) {
        currentLyricColor = config.currentLyricColor;
      }
    }
  } catch (err) {
    console.error('Failed to load config:', err);
  }
}

function saveConfig() {
  try {
    const configPath = getConfigPath();
    const config = {
      currentLyricColor,
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (err) {
    console.error('Failed to save config:', err);
  }
}

// Load Lyrics logic removed as we import it now

// --- IPC Handlers ---
ipcMain.on('switch-to-tab', (_event, tab: string) => {
  if (win) {
    win.webContents.send('switch-tab', tab);
  }
});

ipcMain.on('save-poster', async (_event, dataUrl: string) => {
  console.log('Main Process: Received save-poster event');
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const { filePath } = await dialog.showSaveDialog({
    title: '导出海报',
    defaultPath: path.join(app.getPath('downloads'), `eason-moment-${Date.now()}.png`),
    filters: [{ name: 'Images', extensions: ['png'] }],
  });

  if (filePath) {
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) console.error('Failed to save image', err);
      else console.log('Image saved successfully to:', filePath);
    });
  } else {
    console.log('User cancelled save dialog');
  }
})

ipcMain.on('get-current-lyric', (event) => {
  if (currentLyric) {
    event.sender.send('update-lyric', currentLyric);
  } else {
    // If no lyric is selected yet, force an update or send default
    updateTrayLyric();
    if (currentLyric) event.sender.send('update-lyric', currentLyric);
  }
})

ipcMain.on('set-current-lyric', (_event, newLyric: Lyric) => {
  currentLyric = newLyric;
  // Sync to Lyric Window if open
  if (lyricWin) {
    lyricWin.webContents.send('update-lyric', currentLyric);
  }
  // Update Tray ToolTip
  if (tray) {
    const cleanContent = currentLyric.content.replace(/\s+/g, ' ');
    const displayTitle = `  ${cleanContent.substring(0, 15)}${cleanContent.length > 15 ? '...' : ''}`;
    if (process.platform === 'darwin') {
      tray.setTitle(displayTitle);
    }
    tray.setToolTip(`${currentLyric.content}\n—— ${currentLyric.song} · ${currentLyric.album}`);
  }
  updateTrayMenu();
});

ipcMain.on('update-desktop-lyric-style', (_event, style: { color: string }) => {
  currentLyricColor = style.color;
  saveConfig();
  if (lyricWin) {
    lyricWin.webContents.send('update-lyric-color', currentLyricColor);
  }
  updateTrayMenu(); // To reflect change in Tray (if we highlight 'Custom')
});

ipcMain.on('window-minimize', () => {
  win?.minimize();
});

ipcMain.on('window-close', () => {
  win?.close(); // Or win.hide() if we want tray-only behavior
});

ipcMain.on('window-drag-start', () => {
  if (!lyricWin) return;
  const startMousePos = screen.getCursorScreenPoint();
  const startWinPos = lyricWin.getPosition();

  if (dragTimer) clearInterval(dragTimer);

  dragTimer = setInterval(() => {
    if (!lyricWin) {
      if (dragTimer) clearInterval(dragTimer);
      return;
    }
    const currentMousePos = screen.getCursorScreenPoint();
    const deltaX = currentMousePos.x - startMousePos.x;
    const deltaY = currentMousePos.y - startMousePos.y;

    lyricWin.setPosition(startWinPos[0] + deltaX, startWinPos[1] + deltaY);
  }, 10);
});

ipcMain.on('window-drag-end', () => {
  if (dragTimer) {
    clearInterval(dragTimer);
    dragTimer = null;
  }
});

ipcMain.on('show-desktop-lyric-menu', (event) => {
  const template: Array<Electron.MenuItemConstructorOptions | Electron.MenuItem> = [
    {
      label: '切歌',
      click: updateTrayLyric,
    },
    {
      label: '制作海报',
      click: () => {
        if (win) {
          win.show();
          if (currentLyric) {
            win.webContents.send('update-lyric', currentLyric);
          }
        }
      },
    },
    {
      label: '歌词颜色',
      submenu: [
        ...LYRIC_COLORS.map(c => ({
          label: c.label,
          type: 'radio' as const,
          checked: currentLyricColor === c.value,
          click: () => {
            currentLyricColor = c.value;
            saveConfig();
            if (lyricWin) {
              lyricWin.webContents.send('update-lyric-color', currentLyricColor);
            }
            updateTrayMenu();
          }
        })),
        {
          label: '🎨 自定义',
          type: 'radio' as const,
          checked: !LYRIC_COLORS.some(c => c.value === currentLyricColor),
          click: () => {
            if (win) {
              win.show();
              win.webContents.send('switch-tab', 'settings');
            }
          }
        }
      ]
    },
    { type: 'separator' },
    {
      label: '关闭桌面歌词',
      click: () => {
        if (lyricWin) lyricWin.close();
      }
    },
    { label: '显示主界面', click: () => win?.show() },
    { 
      label: '退出程序', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    },
  ];
  const menu = Menu.buildFromTemplate(template);
  menu.popup({ window: BrowserWindow.fromWebContents(event.sender) || undefined });
});

// --- Helper Functions ---
function resetTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(updateTrayLyric, currentInterval);
}

// Fix for Windows transparent window ghosting/painting issues
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

function getFilteredLyrics(mood: string) {
  if (mood === 'random' || !mood) return lyrics;

  const targetTags = MOOD_GROUPS[mood] || [mood];

  return lyrics.filter((l) => l.tags && l.tags.some((tag) => targetTags.includes(tag)));
}

function updateTrayLyric() {
  if (!tray || lyrics.length === 0) return;

  const pool = getFilteredLyrics(currentMood);
  // Fallback to all lyrics if pool is empty
  const finalPool = pool.length > 0 ? pool : lyrics;

  currentLyric = finalPool[Math.floor(Math.random() * finalPool.length)];

  // Update Tray Title (macOS menu bar text)
  // Clean look: only lyric, truncated properly
  const cleanContent = currentLyric.content.replace(/\s+/g, ' '); // Replace newlines with spaces for single line display
  const displayTitle = `  ${cleanContent.substring(0, 15)}${cleanContent.length > 15 ? '...' : ''}`;

  if (process.platform === 'darwin') {
    tray.setTitle(displayTitle);
  }

  // Set ToolTip for all platforms so hover detail is always available
  tray.setToolTip(`${currentLyric.content}\n—— ${currentLyric.song} · ${currentLyric.album}`);

  // Sync to Lyric Window if open
  if (lyricWin) {
    lyricWin.webContents.send('update-lyric', currentLyric);
  }

  updateTrayMenu();
}

function updateTrayMenu() {
  if (!tray) return;

  const moodSubmenu = Object.keys(MOOD_MAP).map(key => ({
    label: MOOD_MAP[key],
    type: 'radio' as const,
    checked: currentMood === key,
    click: () => {
      currentMood = key;
      updateTrayLyric(); // Switch immediately
    }
  }));

  const intervalSubmenu = UPDATE_INTERVALS.map(item => ({
    label: item.label,
    type: 'radio' as const,
    checked: currentInterval === item.value,
    click: () => {
      currentInterval = item.value;
      resetTimer();
      updateTrayMenu(); // Update checkmark
    }
  }));

  const contextMenu = Menu.buildFromTemplate([
    {
      label: currentLyric ? `${currentLyric.content}` : 'No Lyric',
      enabled: false
    },
    { type: 'separator' },
    {
      label: '切歌',
      icon: nativeImage
        .createFromPath(
          app.isPackaged 
            ? path.join(app.getAppPath(), 'dist/tray-icon.png') 
            : path.join(__dirname, '../public/tray-icon.png')
        )
        .resize({ width: 12, height: 12 }), // Optional icon usage
      click: updateTrayLyric,
    },
    {
      label: '制作海报',
      click: () => {
        if (win) {
          win.show();
          if (currentLyric) {
            win.webContents.send('update-lyric', currentLyric);
          }
        }
      },
    },
    {
      label: '切换心情',
      submenu: moodSubmenu,
    },
    {
      label: '轮播间隔',
      submenu: intervalSubmenu,
    },
    { type: 'separator' },
    {
      label: '显示桌面歌词',
      type: 'checkbox',
      checked: !!lyricWin,
      click: () => {
        if (lyricWin) {
          lyricWin.close(); // Logic handles nulling in 'closed' event
        } else {
          createLyricWindow();
        }
        updateTrayMenu(); // Refresh checkbox state
      }
    },
    {
      label: '歌词颜色',
      submenu: [
        ...LYRIC_COLORS.map(c => ({
          label: c.label,
          type: 'radio' as const,
          checked: currentLyricColor === c.value,
          click: () => {
            currentLyricColor = c.value;
            saveConfig();
            if (lyricWin) {
              lyricWin.webContents.send('update-lyric-color', currentLyricColor);
            }
            updateTrayMenu();
          }
        })),
        {
          label: '🎨 自定义',
          type: 'radio' as const,
          checked: !LYRIC_COLORS.some(c => c.value === currentLyricColor),
          click: () => {
            if (win) {
              win.show();
              win.webContents.send('switch-tab', 'settings');
            }
          }
        }
      ]
    },
    { type: 'separator' },
    { label: '显示主界面', click: () => win?.show() },
    { 
      label: '退出', 
      click: () => {
        isQuitting = true;
        app.quit();
      } 
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function createLyricWindow() {
  if (lyricWin) {
    lyricWin.destroy(); // Force destroy if it exists but logic thinks it shouldn't
    lyricWin = null;
  }

  lyricWin = new BrowserWindow({
    width: 800,
    height: 80,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false, 
    visualEffectState: 'followWindow',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Position it near bottom center
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  lyricWin.setPosition(Math.floor((width - 800) / 2), height - 120);

  // Wait for load to finish before sending data
  lyricWin.webContents.on('did-finish-load', () => {
    if (lyricWin) {
      lyricWin.webContents.send('update-lyric-color', currentLyricColor);
      if (currentLyric) {
        lyricWin.webContents.send('update-lyric', currentLyric);
      }
    }
  });

  if (VITE_DEV_SERVER_URL) {
    lyricWin.loadURL(`${VITE_DEV_SERVER_URL}lyric.html`);
  } else {
    lyricWin.loadFile(path.join(__dirname, '../dist/lyric.html'));
  }

  lyricWin.on('closed', () => {
    lyricWin = null;
    updateTrayMenu();
  });
  
  // DEBUG: Inspect lyric window
  // lyricWin.webContents.openDevTools({ mode: 'detach' });
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    // macOS: hiddenInset (native traffic lights)
    // Windows/Linux: frame: false (custom titlebar needed)
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    frame: isMac ? true : false, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // Prevent window from being destroyed on close; hide it instead
  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
    return false;
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'))
  }
  
  // DEBUG: Open DevTools to diagnose white screen issue
  // win.webContents.openDevTools() 
}

function createTray() {
  // Use public/tray-icon.png which is stable in both dev and prod
  let iconPath;
  if (app.isPackaged) {
    iconPath = path.join(app.getAppPath(), 'dist/tray-icon.png');
  } else {
    iconPath = path.join(__dirname, '../public/tray-icon.png');
  }
  
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
  tray = new Tray(icon);
  tray.setToolTip('Eason Moment');

  updateTrayLyric(); 
  resetTimer();
}

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  } else {
    win?.show();
  }
});

app.on('before-quit', () => {
  isQuitting = true;
  if (lyricWin) lyricWin.destroy();
  if (win) win.destroy();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.whenReady().then(() => {
  loadConfig();
  createWindow();
  createTray();
  createLyricWindow();
  
  // Initialize Auto Updater
  if (app.isPackaged) {
    setupAutoUpdater();
  }
});
