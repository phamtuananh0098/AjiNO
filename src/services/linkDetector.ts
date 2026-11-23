import type { LinkInfoResult } from '../types';

/**
 * Intelligent Client-Side Link Detector
 * Runs directly inside the user's browser with zero backend dependency.
 * Supports:
 * - YouTube (Videos, Shorts, Music, mobile youtu.be, embed)
 * - Spotify (Tracks, Albums, Playlists)
 * - SoundCloud (Tracks, Sets)
 * - Zing MP3 (Song & Album URLs, Mobile share links)
 * - Nhaccuatui (NCT Song & Playlist URLs)
 * - Google Drive (Direct audio stream, thumbnail, File ID)
 * - Direct Audio Files (.mp3, .wav, .m4a, .aac, .ogg, .flac)
 * - Generic Web Audio Links (OpenGraph / NoEmbed / Title parser)
 */

export function cleanTitleAndArtist(
  rawTitle: string,
  defaultArtist = ''
): { title: string; artist: string } {
  if (!rawTitle) return { title: '', artist: defaultArtist };

  // Strip YouTube/video noise tags
  let cleaned = rawTitle
    .replace(/\[(official\s+)?(mv|music\s+video|video|audio|lyric\s+video|lyrics|hd|4k|karaoke|beat|instrumental)\]/gi, '')
    .replace(/\((official\s+)?(mv|music\s+video|video|audio|lyric\s+video|lyrics|hd|4k|karaoke|beat|instrumental)\)/gi, '')
    .replace(/\|\s*(official\s+)?(mv|music\s+video|video|audio|lyric|lyrics|nhạc\s+cưới|nhạc\s+trẻ|nhạc\s+tình).*/gi, '')
    .replace(/【.*?】/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let title = cleaned;
  let artist = defaultArtist;

  // Split on " - ", " – ", " — "
  if (cleaned.includes(' - ') || cleaned.includes(' – ') || cleaned.includes(' — ')) {
    const parts = cleaned.split(/\s*[-–—]\s*/);
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  } else if (cleaned.toLowerCase().includes(' by ')) {
    const parts = cleaned.split(/\s+by\s+/i);
    title = parts[0].trim();
    artist = parts[1].trim();
  } else if (cleaned.includes(' | ')) {
    const parts = cleaned.split(' | ');
    title = parts[0].trim();
    artist = artist || parts[1].trim();
  }

  // Strip surrounding quotes
  title = title.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  artist = artist.replace(/^["'“”]+|["'“”]+$/g, '').trim();

  return { title: title || rawTitle, artist };
}

function slugToWords(slug: string): string {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export function extractYoutubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return m ? m[1] : null;
}

export function extractDriveFileId(input?: string): string | null {
  if (!input) return null;
  const str = String(input).trim();
  const matchD = str.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{20,60})/i);
  if (matchD) return matchD[1];
  const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]{20,60})/i);
  if (matchId) return matchId[1];
  const matchUc = str.match(/\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]{20,60})/i);
  if (matchUc) return matchUc[1];
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }
  return null;
}

export function extractSpotifyTrackId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/open\.spotify\.com\/(?:track|intl-[a-z]{2}\/track)\/([a-zA-Z0-9]{15,30})/i);
  return m ? m[1] : null;
}

export function extractSoundcloudUrl(url?: string): string | null {
  if (!url) return null;
  if (/soundcloud\.com\/[\w-]+\/[\w-]+/i.test(url)) {
    return url.split('?')[0];
  }
  return null;
}

export function isDirectAudioUrl(url?: string): boolean {
  if (!url) return false;
  return /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|webm)($|\?)/i.test(url);
}

export function getSearchAutoplayUrl(title: string, artist = ''): string {
  const query = `${title} ${artist}`.trim();
  return `https://www.youtube-nocookie.com/embed?listType=search&list=${encodeURIComponent(query)}&autoplay=1&enablejsapi=1`;
}

export function getDrivePlayableUrl(fileIdOrUrl: string): string {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (fileId) {
    return `/api/gdrive/stream?id=${fileId}`;
  }
  return fileIdOrUrl;
}

export function getDriveDirectDownloadUrl(fileIdOrUrl: string): string {
  const fileId = extractDriveFileId(fileIdOrUrl);
  if (fileId) {
    return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  }
  return fileIdOrUrl;
}

export async function detectLinkMetadata(inputUrl: string): Promise<LinkInfoResult> {
  if (!inputUrl || typeof inputUrl !== 'string') {
    return { ok: false, error: 'Vui lòng nhập đường dẫn' };
  }

  let urlStr = inputUrl.trim();
  if (!urlStr) {
    return { ok: false, error: 'Đường dẫn trống' };
  }

  // Auto-prepend https:// if missing (e.g. youtube.com/... or youtu.be/...)
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'https://' + urlStr;
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    return { ok: false, error: 'Địa chỉ URL không đúng định dạng' };
  }

  const host = parsedUrl.hostname.toLowerCase();
  const path = parsedUrl.pathname;

  // =========================================================================
  // 1. YOUTUBE (youtube.com, youtu.be, m.youtube.com, music.youtube.com)
  // =========================================================================
  const ytMatch = urlStr.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );

  if (ytMatch || host.includes('youtube.com') || host.includes('youtu.be')) {
    const videoId = ytMatch ? ytMatch[1] : parsedUrl.searchParams.get('v') || '';
    const thumbnail = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : 'https://www.youtube.com/s/desktop/f17216ec/img/favicon_144x144.png';
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;

    // Try fetching live metadata from NoEmbed (CORS-friendly public endpoint)
    if (videoId) {
      try {
        const noembedUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
        const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            const { title, artist } = cleanTitleAndArtist(data.title, data.author_name || '');
            return {
              ok: true,
              platform: 'youtube',
              title,
              artist,
              thumbnail: data.thumbnail_url || `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
              embedUrl,
              streamUrl: `https://www.youtube.com/watch?v=${videoId}`,
              sourceUrl: urlStr,
            };
          }
        }
      } catch {}

      // Try official YouTube oEmbed
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(3500) });
        if (res.ok) {
          const data = await res.json();
          if (data && data.title) {
            const { title, artist } = cleanTitleAndArtist(data.title, data.author_name || '');
            return {
              ok: true,
              platform: 'youtube',
              title,
              artist,
              thumbnail: data.thumbnail_url || thumbnail,
              embedUrl,
              streamUrl: `https://www.youtube.com/watch?v=${videoId}`,
              sourceUrl: urlStr,
            };
          }
        }
      } catch {}
    }

    // Reliable fallback for YouTube
    return {
      ok: true,
      platform: 'youtube',
      title: `Nhạc YouTube (${videoId || 'Audio Track'})`,
      artist: 'YouTube Video',
      thumbnail,
      embedUrl,
      streamUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : urlStr,
      sourceUrl: urlStr,
    };
  }

  // =========================================================================
  // 2. SPOTIFY (open.spotify.com)
  // =========================================================================
  if (host.includes('spotify.com')) {
    const spotMatch = urlStr.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/i);
    const spotType = spotMatch ? spotMatch[1] : 'track';
    const spotId = spotMatch ? spotMatch[2] : '';
    const embedUrl = spotId ? `https://open.spotify.com/embed/${spotType}/${spotId}` : undefined;

    // Try Spotify oEmbed
    try {
      const oembedUrl = `https://open.spotify.com/oembed?url=${encodeURIComponent(urlStr)}`;
      const res = await fetch(oembedUrl, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          // Spotify title format: "Song Name - song by Artist | Spotify"
          let raw = data.title.replace(/\|\s*Spotify$/i, '').trim();
          let { title, artist } = cleanTitleAndArtist(raw);
          if (raw.includes(' - song by ')) {
            const sp = raw.split(' - song by ');
            title = sp[0].trim();
            artist = sp[1].trim();
          }
          return {
            ok: true,
            platform: 'spotify',
            title,
            artist,
            thumbnail: data.thumbnail_url || '',
            embedUrl,
            sourceUrl: urlStr,
          };
        }
      }
    } catch {}

    // Fallback for Spotify
    return {
      ok: true,
      platform: 'spotify',
      title: spotId ? `Spotify Track (${spotId.slice(0, 8)})` : 'Spotify Audio',
      artist: 'Spotify',
      thumbnail: 'https://open.spotifycdn.com/cdn/images/favicon.0f31d2ea.ico',
      embedUrl,
      sourceUrl: urlStr,
    };
  }

  // =========================================================================
  // 3. SOUNDCLOUD (soundcloud.com)
  // =========================================================================
  if (host.includes('soundcloud.com')) {
    // Try SoundCloud oEmbed
    try {
      const scUrl = `https://soundcloud.com/oembed?url=${encodeURIComponent(urlStr)}&format=json`;
      const res = await fetch(scUrl, { signal: AbortSignal.timeout(3500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.title) {
          const { title, artist } = cleanTitleAndArtist(data.title, data.author_name || '');
          return {
            ok: true,
            platform: 'soundcloud',
            title,
            artist,
            thumbnail: data.thumbnail_url || '',
            sourceUrl: urlStr,
          };
        }
      }
    } catch {}

    // Parse SoundCloud slug
    const segs = path.split('/').filter(Boolean);
    if (segs.length >= 2) {
      const artist = slugToWords(segs[0]);
      const title = slugToWords(segs[1]);
      return {
        ok: true,
        platform: 'soundcloud',
        title,
        artist,
        thumbnail: '',
        sourceUrl: urlStr,
      };
    }
  }

  // =========================================================================
  // 4. ZING MP3 (zingmp3.vn)
  // =========================================================================
  if (host.includes('zingmp3.vn')) {
    const segs = path.split('/').filter(Boolean);
    // Typical format: /bai-hat/Ngay-Dau-Tien-Duc-Phuc/ZZ7I8W9U.html
    let songSlug = '';
    for (let i = 0; i < segs.length; i++) {
      if (segs[i].endsWith('.html') && i > 0) {
        songSlug = segs[i - 1];
        break;
      }
    }
    if (!songSlug && segs.length > 0) {
      songSlug = segs[segs.length - 1].replace(/\.html$/i, '');
    }

    if (songSlug && songSlug !== 'bai-hat') {
      const parts = songSlug.split('-');
      let title = '';
      let artist = '';
      if (parts.length >= 4) {
        // Assume last 2 segments are singer name (e.g. Duc-Phuc), preceding are title
        artist = slugToWords(parts.slice(-2).join('-'));
        title = slugToWords(parts.slice(0, -2).join('-'));
      } else if (parts.length >= 2) {
        artist = slugToWords(parts[parts.length - 1]);
        title = slugToWords(parts.slice(0, -1).join('-'));
      } else {
        title = slugToWords(songSlug);
      }

      return {
        ok: true,
        platform: 'zingmp3',
        title,
        artist,
        thumbnail: 'https://static-zmp3.zndcdn.me/skins/zmp3-v6.1/images/favicon.ico',
        sourceUrl: urlStr,
      };
    }
  }

  // =========================================================================
  // 5. NHACCUATUI (nhaccuatui.com)
  // =========================================================================
  if (host.includes('nhaccuatui.com')) {
    const lastSeg = path.split('/').filter(Boolean).pop() || '';
    // e.g. cuoi-nhau-di-yes-i-do-bui-anh-tuan-ft-hien-ho.6pI5J6Z2Vq8G.html
    const cleanSeg = lastSeg.replace(/\.html$/i, '').replace(/\.[a-zA-Z0-9_-]+$/, '');
    if (cleanSeg) {
      let title = '';
      let artist = '';
      if (cleanSeg.includes('-ft-') || cleanSeg.includes('-feat-')) {
        const splitParts = cleanSeg.split(/-ft-|-feat-/i);
        title = slugToWords(splitParts[0]);
        artist = 'ft. ' + slugToWords(splitParts[1]);
      } else {
        const parts = cleanSeg.split('-');
        if (parts.length >= 4) {
          artist = slugToWords(parts.slice(-2).join('-'));
          title = slugToWords(parts.slice(0, -2).join('-'));
        } else {
          title = slugToWords(cleanSeg);
        }
      }

      return {
        ok: true,
        platform: 'link',
        title,
        artist,
        thumbnail: '',
        sourceUrl: urlStr,
      };
    }
  }

  // =========================================================================
  // 6. GOOGLE DRIVE (drive.google.com, docs.google.com)
  // =========================================================================
  if (host.includes('drive.google.com') || host.includes('docs.google.com') || urlStr.includes('/d/')) {
    const fileId = extractDriveFileId(urlStr);

    if (fileId) {
      try {
        const metaRes = await fetch(`/api/gdrive/metadata?id=${fileId}`, { signal: AbortSignal.timeout(4000) });
        if (metaRes.ok) {
          const driveData = await metaRes.json();
          if (driveData && driveData.title && !driveData.title.startsWith('Nhạc Google Drive (')) {
            return {
              ok: true,
              platform: 'gdrive',
              title: driveData.title,
              artist: driveData.artist || '',
              thumbnail: driveData.thumbnail || `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
              streamUrl: `/api/gdrive/stream?id=${fileId}`,
              sourceUrl: `https://drive.google.com/file/d/${fileId}/view`,
            };
          }
        }
      } catch {}

      return {
        ok: true,
        platform: 'gdrive',
        title: `Nhạc Google Drive (${fileId.slice(0, 8)})`,
        artist: '',
        thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
        streamUrl: `/api/gdrive/stream?id=${fileId}`,
        sourceUrl: `https://drive.google.com/file/d/${fileId}/view`,
      };
    }
  }

  // =========================================================================
  // 7. DIRECT AUDIO FILE (.mp3, .wav, .m4a, .aac, .ogg, .flac)
  // =========================================================================
  const isDirectAudio = /\.(mp3|wav|m4a|aac|ogg|oga|opus|flac|webm)($|\?)/i.test(path);
  if (isDirectAudio) {
    let rawFilename = path.split('/').pop()?.split('?')[0] || 'audio.mp3';
    try {
      rawFilename = decodeURIComponent(rawFilename);
    } catch {}
    const { title, artist } = cleanTitleAndArtist(rawFilename.replace(/\.[^/.]+$/, ''));
    return {
      ok: true,
      platform: 'link',
      title: title || rawFilename,
      artist,
      thumbnail: '',
      streamUrl: urlStr,
      sourceUrl: urlStr,
    };
  }

  // =========================================================================
  // 8. GENERIC WEB LINK (Fallback: try NoEmbed or Backend API)
  // =========================================================================
  try {
    const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(urlStr)}`;
    const res = await fetch(noembedUrl, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const data = await res.json();
      if (data && data.title) {
        const { title, artist } = cleanTitleAndArtist(data.title, data.author_name || '');
        return {
          ok: true,
          platform: 'link',
          title,
          artist,
          thumbnail: data.thumbnail_url || '',
          sourceUrl: urlStr,
        };
      }
    }
  } catch {}

  // Last-resort fallback: parse pathname slug
  const lastSegment = path.split('/').filter(Boolean).pop() || host;
  const cleanSeg = lastSegment.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
  const title = cleanSeg.charAt(0).toUpperCase() + cleanSeg.slice(1);

  return {
    ok: true,
    platform: 'link',
    title: title || 'Nhạc Web Liên Kết',
    artist: host.replace(/^www\./, ''),
    thumbnail: '',
    streamUrl: urlStr,
    sourceUrl: urlStr,
  };
}
