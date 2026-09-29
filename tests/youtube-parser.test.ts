import { describe, it, expect } from 'vitest';
import { parseYouTubeVideoId, parseISO8601Duration, formatDuration } from '../src/lib/youtube';

describe('YouTube URL Parser & Helpers', () => {
  it('extracts ID from standard watch URL', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=kJQP7kiw5Fk')).toBe('kJQP7kiw5Fk');
  });

  it('extracts ID from watch URL with extra query parameters', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/watch?v=kJQP7kiw5Fk&t=45s&feature=share')).toBe('kJQP7kiw5Fk');
  });

  it('extracts ID from youtu.be short URL', () => {
    expect(parseYouTubeVideoId('https://youtu.be/kJQP7kiw5Fk?t=10')).toBe('kJQP7kiw5Fk');
  });

  it('extracts ID from youtube shorts URL', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/shorts/kJQP7kiw5Fk')).toBe('kJQP7kiw5Fk');
  });

  it('extracts ID from youtube embed URL', () => {
    expect(parseYouTubeVideoId('https://www.youtube.com/embed/kJQP7kiw5Fk')).toBe('kJQP7kiw5Fk');
  });

  it('accepts raw 11-char video ID', () => {
    expect(parseYouTubeVideoId('kJQP7kiw5Fk')).toBe('kJQP7kiw5Fk');
  });

  it('returns null for invalid inputs', () => {
    expect(parseYouTubeVideoId('')).toBeNull();
    expect(parseYouTubeVideoId('https://vimeo.com/123456')).toBeNull();
    expect(parseYouTubeVideoId('random string')).toBeNull();
  });

  it('correctly parses ISO 8601 durations', () => {
    expect(parseISO8601Duration('PT4M13S')).toBe(253);
    expect(parseISO8601Duration('PT1H2M10S')).toBe(3730);
    expect(parseISO8601Duration('PT45S')).toBe(45);
    expect(parseISO8601Duration('')).toBe(0);
  });

  it('formats duration to readable strings', () => {
    expect(formatDuration(45)).toBe('0:45');
    expect(formatDuration(253)).toBe('4:13');
    expect(formatDuration(3730)).toBe('1:02:10');
  });
});
