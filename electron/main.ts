import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'
// @ts-ignore
import lyricsData from '../src/assets/lyrics.json'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null;
let tray: Tray | null;
let lyricWin: BrowserWindow | null = null;
let isQuitting = false;
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

// Load Lyrics logic removed as we import it now

// --- IPC Handlers ---
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

ipcMain.on('update-desktop-lyric-style', (_event, style: { color: string }) => {
  currentLyricColor = style.color;
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
            if (win) win.show();
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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();
});
