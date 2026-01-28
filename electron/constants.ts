// Auto Update
export const UPDATE_FEED_URL = 'https://easonlab.faygift.com/api';

// Mood Constants
export const MOOD_MAP: Record<string, string> = {
  random: '🎲 随机漫步',
  sad: '🌧️ 深夜抑郁',
  healing: '☕ 治愈哲理',
  romance: '💕 爱与浪漫',
  crazy: '🔥 浮夸热血',
  classic: '📀 岁月金曲',
};

export const MOOD_GROUPS: Record<string, string[]> = {
  sad: ['sad', 'lonely', 'dark', 'pain', 'regret'],
  healing: ['healing', 'philosophy', 'life', 'brightness', 'soul', 'humanity', 'self'],
  romance: ['love', 'promise'],
  crazy: ['crazy', 'power', 'freedom', 'social'],
  classic: ['classic', 'memory']
};

// Settings Constants
export const UPDATE_INTERVALS = [
  { label: '1 分钟', value: 1 * 60 * 1000 },
  { label: '5 分钟', value: 5 * 60 * 1000 },
  { label: '15 分钟', value: 15 * 60 * 1000 },
  { label: '30 分钟', value: 30 * 60 * 1000 },
  { label: '1 小时', value: 60 * 60 * 1000 }
];

export const LYRIC_COLORS = [
  { label: '🤍 纯净白', value: '#ffffff' },
  { label: '💛 辉煌金', value: '#FFD700' },
  { label: '💚 治愈青', value: '#00e676' },
  { label: '💙 E粉蓝', value: '#00BFFF' },
  { label: '💗 浪漫粉', value: '#FF69B4' }
];
