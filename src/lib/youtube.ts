import prisma from './prisma';

export interface ExtractedVideoInfo {
  videoId: string;
  title: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  channelTitle?: string;
}

/**
 * Extracts 11-character YouTube video ID from various URL patterns:
 * - https://www.youtube.com/watch?v=kJQP7kiw5Fk
 * - https://youtu.be/kJQP7kiw5Fk
 * - https://www.youtube.com/shorts/kJQP7kiw5Fk
 * - https://www.youtube.com/embed/kJQP7kiw5Fk
 * - raw 11-char ID
 */
export function parseYouTubeVideoId(input: string): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If already exactly an 11-char ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i,
    /[?&]v=([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match && match[1] && match[1].length === 11) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parses ISO 8601 duration format (e.g. PT4M13S, PT1H2M10S, PT45S) into total seconds.
 */
export function parseISO8601Duration(durationStr: string): number {
  if (!durationStr) return 0;
  const match = durationStr.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string.
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const secStr = secs < 10 ? `0${secs}` : `${secs}`;
  if (hrs > 0) {
    const minStr = mins < 10 ? `0${mins}` : `${mins}`;
    return `${hrs}:${minStr}:${secStr}`;
  }
  return `${mins}:${secStr}`;
}

/**
 * Retrieves YouTube video metadata with caching and multiple resilient fallbacks.
 */
export async function getYouTubeMetadata(videoId: string): Promise<ExtractedVideoInfo> {
  const cleanId = parseYouTubeVideoId(videoId);
  if (!cleanId) {
    throw new Error('Invalid YouTube video URL or ID.');
  }

  // 1. Check database cache
  const cached = await prisma.videoMetadata.findUnique({
    where: { id: cleanId },
  });

  if (cached) {
    return {
      videoId: cached.id,
      title: cached.title,
      duration: cached.duration,
      thumbnailUrl: cached.thumbnailUrl,
      channelTitle: cached.channelTitle || undefined,
    };
  }

  // 2. Try YouTube Data API v3 if API key configured
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${cleanId}&key=${apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items.length > 0) {
          const item = data.items[0];
          const title = item.snippet?.title || 'Unknown Title';
          const duration = parseISO8601Duration(item.contentDetails?.duration || '');
          const thumbnailUrl =
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            item.snippet?.thumbnails?.default?.url ||
            `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;
          const channelTitle = item.snippet?.channelTitle || 'YouTube';

          // Save to cache
          await prisma.videoMetadata.create({
            data: {
              id: cleanId,
              title,
              duration,
              thumbnailUrl,
              channelTitle,
            },
          });

          return { videoId: cleanId, title, duration, thumbnailUrl, channelTitle };
        }
      }
    } catch (err) {
      console.warn('YouTube Data API error, falling back to oEmbed:', err);
    }
  }

  // 3. Fallback: oEmbed API + duration extraction
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${cleanId}&format=json`;
    const res = await fetch(oembedUrl);
    if (!res.ok) {
      throw new Error(`Video not found on YouTube (status ${res.status}).`);
    }

    const data = await res.json();
    const title = data.title || 'YouTube Video';
    const channelTitle = data.author_name || 'YouTube';
    const thumbnailUrl =
      data.thumbnail_url || `https://i.ytimg.com/vi/${cleanId}/hqdefault.jpg`;

    // Attempt to extract duration from video web page
    let duration = 240; // Default 4 minutes fallback if unavailable
    try {
      const pageRes = await fetch(`https://www.youtube.com/watch?v=${cleanId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
      });
      if (pageRes.ok) {
        const html = await pageRes.text();
        const durationMatch = html.match(/"approxDurationMs":"(\d+)"/);
        if (durationMatch && durationMatch[1]) {
          duration = Math.round(parseInt(durationMatch[1], 10) / 1000);
        }
      }
    } catch {
      // Keep default duration
    }

    // Save to cache
    await prisma.videoMetadata.upsert({
      where: { id: cleanId },
      update: { title, duration, thumbnailUrl, channelTitle },
      create: {
        id: cleanId,
        title,
        duration,
        thumbnailUrl,
        channelTitle,
      },
    });

    return {
      videoId: cleanId,
      title,
      duration,
      thumbnailUrl,
      channelTitle,
    };
  } catch (err: any) {
    throw new Error(err.message || 'Could not fetch video information from YouTube.');
  }
}
