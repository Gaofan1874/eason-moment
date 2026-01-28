// @ts-ignore
import lyricsData from '../src/assets/lyrics.json';
import { MOOD_GROUPS } from './constants';

export interface Lyric {
  content: string;
  song: string;
  album: string;
  tags?: string[];
}

const lyrics: Lyric[] = lyricsData as Lyric[];

export function getAllLyrics(): Lyric[] {
  return lyrics;
}

export function getFilteredLyrics(mood: string): Lyric[] {
  if (mood === 'random' || !mood) return lyrics;

  const targetTags = MOOD_GROUPS[mood] || [mood];

  return lyrics.filter((l) => l.tags && l.tags.some((tag) => targetTags.includes(tag)));
}

export function getRandomLyric(mood: string): Lyric {
  const pool = getFilteredLyrics(mood);
  const finalPool = pool.length > 0 ? pool : lyrics;
  return finalPool[Math.floor(Math.random() * finalPool.length)];
}
