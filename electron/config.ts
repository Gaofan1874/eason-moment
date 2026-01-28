import { app } from 'electron';
import path from 'node:path';
import fs from 'node:fs';

// Default state
let currentLyricColor = '#ffffff';

function getConfigPath() {
  return path.join(app.getPath('userData'), 'config.json');
}

export function loadConfig() {
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

export function saveConfig() {
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

export function getLyricColor() {
  return currentLyricColor;
}

export function setLyricColor(color: string) {
  currentLyricColor = color;
  saveConfig();
}
