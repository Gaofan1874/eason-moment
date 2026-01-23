export const SCALE = 2;

export interface ThemeConfig {
  fontSize: number;
  lineHeight: number;
  fontFace: string;
  color: string;
}

export const THEME_DEFAULTS: Record<string, ThemeConfig> = {
  classic: { 
    fontSize: 36 * SCALE, 
    lineHeight: 60 * SCALE, 
    fontFace: 'Microsoft YaHei', 
    color: '#ffffff' 
  },
  polaroid: { 
    fontSize: 26 * SCALE, 
    lineHeight: 42 * SCALE, 
    fontFace: 'Times New Roman', 
    color: '#333333' 
  },
  cinema: { 
    fontSize: 24 * SCALE, 
    lineHeight: 35 * SCALE, 
    fontFace: 'sans-serif', 
    color: '#FFC90E' 
  },
  vertical: {
    fontSize: 40 * SCALE,
    lineHeight: 70 * SCALE, // Distance between vertical columns
    fontFace: '"Armor Mincho", serif',
    color: '#FFFFFF'
  },
};

export type AspectRatioType = 'portrait' | 'landscape_4_3' | 'square' | 'landscape' | 'mobile_wallpaper';

export const ASPECT_RATIOS: Record<AspectRatioType, { label: string; width: number; height: number }> = {
  portrait: { label: '3:4 竖版', width: 600 * SCALE, height: 800 * SCALE },
  landscape_4_3: { label: '4:3 横版', width: 800 * SCALE, height: 600 * SCALE },
  square: { label: '1:1 方图', width: 1200, height: 1200 },   
  landscape: { label: '16:9 横版', width: 1600, height: 900 },
  mobile_wallpaper: { label: '9:16 壁纸', width: 900, height: 1600 }
};

export const FONT_OPTIONS = [
  { label: '默认黑体', value: 'Microsoft YaHei' },
  { label: '思源宋体', value: '"Noto Serif SC", serif' },
  { label: '马善政毛笔', value: '"Ma Shan Zheng", cursive' },
  { label: '站酷小薇', value: '"ZCOOL XiaoWei", serif' },
  { label: '装甲明朝', value: '"Armor Mincho", serif' },
];

export const FILTER_OPTIONS = [
  { label: '原图', value: 'none' },
  { label: '黑白', value: 'grayscale(100%) contrast(1.1)' },
  { label: '复古', value: 'sepia(0.5) contrast(1.2) brightness(0.9)' },
  { label: '淡雅', value: 'opacity(0.8) saturate(0.5)' },
  { label: '冷调', value: 'hue-rotate(180deg) saturate(0.5) opacity(0.9)' },
  { label: '鲜艳', value: 'saturate(1.5) contrast(1.1)' },
];

export interface LyricData {
  content: string;
  song: string;
  album: string;
  lyricist?: string;
  composer?: string;
  contentTraditional?: string;
  songTraditional?: string;
  albumTraditional?: string;
}
