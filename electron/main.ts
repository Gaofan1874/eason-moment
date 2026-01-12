import { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, dialog } from 'electron'
import path from 'node:path'
import fs from 'node:fs'

process.env.DIST = path.join(__dirname, '../dist')
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
let tray: Tray | null
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']

// --- IPC Handlers ---
ipcMain.on('save-poster', async (event, dataUrl: string) => {
  console.log('Main Process: Received save-poster event');
  const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '')
  const { filePath } = await dialog.showSaveDialog({
    title: '导出海报',
    defaultPath: path.join(app.getPath('downloads'), `eason-moment-${Date.now()}.png`),
    filters: [{ name: 'Images', extensions: ['png'] }]
  })

  if (filePath) {
    fs.writeFile(filePath, base64Data, 'base64', (err) => {
      if (err) {
        console.error('Failed to save image', err)
      } else {
        console.log('Image saved successfully to:', filePath);
      }
    })
  } else {
    console.log('User cancelled save dialog');
  }
})

// Load Lyrics
const lyricsPath = path.join(__dirname, '../src/assets/lyrics.json')
let lyrics: any[] = []
try {
  const data = fs.readFileSync(lyricsPath, 'utf-8')
  lyrics = JSON.parse(data)
} catch (e) {
  console.error('Failed to load lyrics', e)
}

function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 800,
    titleBarStyle: 'hiddenInset',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(process.env.DIST!, 'index.html'))
  }
}

function createTray() {
  const iconPath = path.join(__dirname, '../src/assets/icon.png')
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 })
  tray = new Tray(icon)

  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show App', click: () => win?.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => app.quit() }
  ])

  tray.setToolTip('Eason Moment')
  tray.setContextMenu(contextMenu)

  // Initial Lyric
  updateTrayLyric()

  // Update every 5 minutes
  setInterval(updateTrayLyric, 5 * 60 * 1000)
}

function updateTrayLyric() {
  if (!tray || lyrics.length === 0) return
  const randomLyric = lyrics[Math.floor(Math.random() * lyrics.length)]
  const displayTitle = `🎤 ${randomLyric.content}`
  
  // On macOS, tray.setTitle displays text next to the icon
  if (process.platform === 'darwin') {
    tray.setTitle(displayTitle)
  } else {
    tray.setToolTip(displayTitle)
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(() => {
  createWindow()
  createTray()
})