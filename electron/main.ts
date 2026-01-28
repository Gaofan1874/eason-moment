import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog, screen, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import {
  MOOD_MAP,
  UPDATE_INTERVALS,
  LYRIC_COLORS
} from './constants';
import {
  loadConfig,
  getLyricColor,
  setLyricColor
} from './config';
import { setupAutoUpdater } from './updater';
import {
  Lyric,
  getRandomLyric
} from './lyrics';

process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public');
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

// --- Global State ---
let win: BrowserWindow | null = null;
let lyricWin: BrowserWindow | null = null;
let tray: Tray | null = null;

let currentMood = 'random';
let currentInterval = 5 * 60 * 1000; // Default 5 mins
let currentLyric: Lyric | null = null;
let timer: NodeJS.Timeout | null = null;
let dragTimer: NodeJS.Timeout | null = null;
let isQuitting = false;

// Fix for Windows transparent window ghosting/painting issues
if (process.platform === 'win32') {
  app.disableHardwareAcceleration();
}

// --- Helper Functions ---

function updateTrayLyric() {
  // Get new lyric
  currentLyric = getRandomLyric(currentMood);

  // Update Tray Title (macOS only)
  if (process.platform === 'darwin' && tray) {
    const cleanContent = currentLyric.content.replace(/\s+/g, ' ');
    const displayTitle = `  ${cleanContent.substring(0, 15)}${cleanContent.length > 15 ? '...' : ''}`;
    tray.setTitle(displayTitle);
  }

  // Update ToolTip
  if (tray) {
    tray.setToolTip(`${currentLyric.content}\n—— ${currentLyric.song} · ${currentLyric.album}`);
  }

  // Sync to Lyric Window if open
  if (lyricWin) {
    lyricWin.webContents.send('update-lyric', currentLyric);
  }

  updateTrayMenu();
}

function resetTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(updateTrayLyric, currentInterval);
}

function updateTrayMenu() {
  if (!tray) return;

  const moodSubmenu = Object.keys(MOOD_MAP).map(key => ({
    label: MOOD_MAP[key],
    type: 'radio' as const,
    checked: currentMood === key,
    click: () => {
      currentMood = key;
      updateTrayLyric();
    }
  }));

  const intervalSubmenu = UPDATE_INTERVALS.map(item => ({
    label: item.label,
    type: 'radio' as const,
    checked: currentInterval === item.value,
    click: () => {
      currentInterval = item.value;
      resetTimer();
      updateTrayMenu();
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
        .resize({ width: 12, height: 12 }),
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
          lyricWin.close();
        } else {
          createLyricWindow();
        }
        updateTrayMenu();
      }
    },
    {
      label: '歌词颜色',
      submenu: [
        ...LYRIC_COLORS.map(c => ({
          label: c.label,
          type: 'radio' as const,
          checked: getLyricColor() === c.value,
          click: () => {
            setLyricColor(c.value);
            if (lyricWin) {
              lyricWin.webContents.send('update-lyric-color', c.value);
            }
            updateTrayMenu();
          }
        })),
        {
          label: '🎨 自定义',
          type: 'radio' as const,
          checked: !LYRIC_COLORS.some(c => c.value === getLyricColor()),
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

// --- Window Creators ---

function createLyricWindow() {
  if (lyricWin) {
    lyricWin.destroy();
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

  // 将歌词锁定在主屏幕的下方的正中间区域
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  lyricWin.setPosition(Math.floor((width - 800) / 2), height - 120);

  lyricWin.webContents.on('did-finish-load', () => {
    if (lyricWin) {
      lyricWin.webContents.send('update-lyric-color', getLyricColor());
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
}

function createWindow() {
  const isMac = process.platform === 'darwin';
  
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    frame: isMac, 
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  win.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      win?.hide();
    }
    return false;
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

function createTray() {
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

// --- IPC Handlers ---

ipcMain.on('switch-to-tab', (_event, tab: string) => {
  win?.webContents.send('switch-tab', tab);
});

ipcMain.on('save-poster', async (_event, dataUrl: string) => {
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
  const { filePath } = await dialog.showSaveDialog({
    title: '导出海报',
    defaultPath: path.join(app.getPath('downloads'), `eason-moment-${Date.now()}.png`),
    filters: [{ name: 'Images', extensions: ['png'] }],
  });

  if (filePath) {
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) console.error('Failed to save image', err);
    });
  }
});

ipcMain.on('get-current-lyric', (event) => {
  if (currentLyric) {
    event.sender.send('update-lyric', currentLyric);
  } else {
    updateTrayLyric();
    if (currentLyric) event.sender.send('update-lyric', currentLyric);
  }
});

ipcMain.on('set-current-lyric', (_event, newLyric: Lyric) => {
  currentLyric = newLyric;
  if (lyricWin) {
    lyricWin.webContents.send('update-lyric', currentLyric);
  }
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
  setLyricColor(style.color);
  if (lyricWin) {
    lyricWin.webContents.send('update-lyric-color', style.color);
  }
  updateTrayMenu();
});

ipcMain.on('window-minimize', () => win?.minimize());
ipcMain.on('window-close', () => win?.close());

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
          checked: getLyricColor() === c.value,
          click: () => {
            setLyricColor(c.value);
            if (lyricWin) {
              lyricWin.webContents.send('update-lyric-color', c.value);
            }
            updateTrayMenu();
          }
        })),
        {
          label: '🎨 自定义',
          type: 'radio' as const,
          checked: !LYRIC_COLORS.some(c => c.value === getLyricColor()),
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

// --- App Lifecycle ---

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
    app.quit();
  }
});

app.whenReady().then(() => {
  loadConfig();
  createWindow();
  createTray();
  createLyricWindow();
  
  // Initialize Auto Updater with a getter for the main window
  setupAutoUpdater(() => win);
});