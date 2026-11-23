/**
 * Server-Side Link Metadata Auto-Detection Engine
 * Works across:
 * - YouTube (NoEmbed + oEmbed + Video ID extraction + HD thumbnails)
 * - Spotify (oEmbed + Track/Album parser)
 * - SoundCloud (oEmbed + slug parser)
 * - Google Drive (Direct stream + File ID + Thumbnail)
 * - ZingMP3 / Nhaccuatui (Slug & Artist-Title parser)
 * - Direct Audio Files (.mp3, .wav, .m4a, .aac, .ogg, .flac)
 * - Generic Web Pages (OpenGraph & Meta Tags)
 */

export function cleanTitleAndArtist(rawTitle, defaultArtist = '') {
  if (!rawTitle) return { title: '', artist: defaultArtist };

  let cleaned = rawTitle
    .replace(/\[(official\s+)?(mv|music\s+video|video|audio|lyric\s+video|lyrics|hd|4k|karaoke|beat|instrumental)\]/gi, '')
    .replace(/\((official\s+)?(mv|music\s+video|video|audio|lyric\s+video|lyrics|hd|4k|karaoke|beat|instrumental)\)/gi, '')
    .replace(/\|\s*(official\s+)?(mv|music\s+video|video|audio|lyric|lyrics|nhạc\s+cưới|nhạc\s+trẻ|nhạc\s+tình).*/gi, '')
    .replace(/【.*?】/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  let title = cleaned;
  let artist = defaultArtist;

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

  title = title.replace(/^["'“”]+|["'“”]+$/g, '').trim();
  artist = artist.replace(/^["'“”]+|["'“”]+$/g, '').trim();

  return { title: title || rawTitle, artist };
}

function slugToWords(slug) {
  return slug
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

export async function parseLinkMetadata(inputUrl) {
  if (!inputUrl || typeof inputUrl !== 'string') {
    throw new Error('Đường dẫn không hợp lệ');
  }

  let urlStr = inputUrl.trim();
  if (!/^https?:\/\//i.test(urlStr)) {
    urlStr = 'https://' + urlStr;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    throw new Error('Địa chỉ URL không đúng định dạng');
  }

  const host = parsedUrl.hostname.toLowerCase();
  const path = parsedUrl.pathname;

  // 1. YouTube
  const ytMatch = urlStr.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );

  if (ytMatch || host.includes('youtube.com') || host.includes('youtu.be')) {
    const videoId = ytMatch ? ytMatch[1] : parsedUrl.searchParams.get('v') || '';
    const thumbnail = videoId
      ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      : 'https://www.youtube.com/s/desktop/f17216ec/img/favicon_144x144.png';
    const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}` : undefined;

    // Try NoEmbed first
    if (videoId) {
      try {
        const noembedRes = await fetch(
          `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`,
          { signal: AbortSignal.timeout(3500) }
        );
        if (noembedRes.ok) {
          const data = await noembedRes.json();
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

      // Try official oEmbed
      try {
        const oembedRes = await fetch(
          `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
          { headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(3500) }
        );
        if (oembedRes.ok) {
          const data = await oembedRes.json();
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

    return {
      ok: true,
      platform: 'youtube',
      title: `Nhạc YouTube (${videoId || 'Audio'})`,
      artist: 'YouTube Video',
      thumbnail,
      embedUrl,
      streamUrl: videoId ? `https://www.youtube.com/watch?v=${videoId}` : urlStr,
      sourceUrl: urlStr,
    };
  }

  // 2. Spotify
  if (host.includes('spotify.com')) {
    const spotMatch = urlStr.match(/open\.spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/i);
    const spotType = spotMatch ? spotMatch[1] : 'track';
    const spotId = spotMatch ? spotMatch[2] : '';
    const embedUrl = spotId ? `https://open.spotify.com/embed/${spotType}/${spotId}` : undefined;

    try {
      const oembedRes = await fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(urlStr)}`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
        if (data && data.title) {
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

  // 3. SoundCloud
  if (host.includes('soundcloud.com')) {
    try {
      const oembedRes = await fetch(
        `https://soundcloud.com/oembed?url=${encodeURIComponent(urlStr)}&format=json`,
        { signal: AbortSignal.timeout(3500) }
      );
      if (oembedRes.ok) {
        const data = await oembedRes.json();
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

  // 4. ZingMP3
  if (host.includes('zingmp3.vn')) {
    const segs = path.split('/').filter(Boolean);
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

  // 5. Nhaccuatui
  if (host.includes('nhaccuatui.com')) {
    const lastSeg = path.split('/').filter(Boolean).pop() || '';
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

  // 6. Google Drive
  if (host.includes('drive.google.com') || host.includes('docs.google.com')) {
    let fileId = '';
    try {
      const { extractDriveFileId, fetchDriveMetadata } = await import('./gdriveService.mjs');
      fileId = extractDriveFileId(urlStr) || '';
      if (fileId) {
        const driveInfo = await fetchDriveMetadata(fileId);
        if (driveInfo && driveInfo.title && !driveInfo.title.startsWith('Nhạc Google Drive (')) {
          return {
            ok: true,
            platform: 'gdrive',
            title: driveInfo.title,
            artist: driveInfo.artist || '',
            thumbnail: driveInfo.thumbnail,
            streamUrl: `/api/gdrive/stream?id=${fileId}`,
            sourceUrl: urlStr,
          };
        }
      }
    } catch {}

    return {
      ok: true,
      platform: 'gdrive',
      title: `Nhạc Google Drive (${fileId ? fileId.slice(0, 8) : 'File'})`,
      artist: '',
      thumbnail: fileId
        ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`
        : 'https://ssl.gstatic.com/docs/doclist/images/mediatype/icon_1_audio_x128.png',
      streamUrl: fileId ? `/api/gdrive/stream?id=${fileId}` : urlStr,
      sourceUrl: urlStr,
    };
  }

  // 7. Direct Audio File
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

  // 8. Generic NoEmbed / OpenGraph
  try {
    const noembedRes = await fetch(
      `https://noembed.com/embed?url=${encodeURIComponent(urlStr)}`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (noembedRes.ok) {
      const data = await noembedRes.json();
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

  // Last-resort fallback
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
