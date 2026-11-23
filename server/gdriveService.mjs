import { readFile, writeFile } from 'node:fs/promises';
import { Readable } from 'node:stream';
import { GDRIVE_CONFIG_FILE } from './paths.mjs';
import { saveAudioBuffer } from './audioStorage.mjs';
import { cleanTitleAndArtist } from './linkParser.mjs';

let driveConfig = {
  connected: false,
  clientId: '',
  folderId: '',
  folderName: '',
  userEmail: '',
  userName: '',
  lastSyncTime: null,
};

export async function loadDriveConfig() {
  try {
    const raw = await readFile(GDRIVE_CONFIG_FILE, 'utf8');
    driveConfig = { ...driveConfig, ...JSON.parse(raw) };
  } catch {}
  return driveConfig;
}

export async function saveDriveConfig(newConfig) {
  driveConfig = { ...driveConfig, ...newConfig };
  await writeFile(GDRIVE_CONFIG_FILE, JSON.stringify(driveConfig, null, 2), 'utf8');
  return driveConfig;
}

/**
 * Extracts Google Drive file ID from any URL or input format
 */
export function extractDriveFileId(input) {
  if (!input) return null;
  const str = String(input).trim();

  // Match /file/d/{fileId} or /d/{fileId}
  const matchD = str.match(/\/(?:file\/)?d\/([a-zA-Z0-9_-]{20,60})/i);
  if (matchD) return matchD[1];

  // Match id={fileId}
  const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]{20,60})/i);
  if (matchId) return matchId[1];

  // Match uc?export=download&id={fileId}
  const matchUc = str.match(/\/uc\?(?:[^&]*&)*id=([a-zA-Z0-9_-]{20,60})/i);
  if (matchUc) return matchUc[1];

  // Match bare 25-50 char alphanumeric ID
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }
  return null;
}

function decodeHtmlEntities(str) {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x2F;/gi, '/')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .trim();
}

function parseFilenameFromHeader(header) {
  if (!header) return null;
  const match = header.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)["']?/i);
  if (match) {
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return match[1];
    }
  }
  return null;
}

/**
 * Fetch real filename & metadata from public Google Drive file
 * Uses OpenGraph tags, bot-mode HTML rendering, and download headers
 */
export async function fetchDriveMetadata(fileId) {
  if (!fileId) return null;

  let resolvedName = '';

  // 1. Try fetching view page with social bot UA (Google renders static OpenGraph tags for bots)
  try {
    const viewUrl = `https://drive.google.com/file/d/${fileId}/view`;
    const pageRes = await fetch(viewUrl, {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(4500),
    });

    if (pageRes.ok) {
      const html = await pageRes.text();

      // Check og:title
      const ogMatch =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i) ||
        html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

      if (ogMatch && ogMatch[1]) {
        resolvedName = decodeHtmlEntities(ogMatch[1]);
      }

      // Check <title> tag
      if (!resolvedName) {
        const titleTag = html.match(/<title>([^<]+)<\/title>/i);
        if (titleTag && titleTag[1]) {
          const raw = decodeHtmlEntities(titleTag[1]);
          resolvedName = raw.replace(/\s*[-–—]\s*Google\s*Drive$/i, '').trim();
        }
      }

      // Check itemprop="name" or twitter:title
      if (!resolvedName) {
        const itemProp = html.match(/itemprop=["']name["']\s+content=["']([^"']+)["']/i);
        if (itemProp && itemProp[1]) {
          resolvedName = decodeHtmlEntities(itemProp[1]);
        }
      }

      // Check JSON-LD or JS data strings
      if (!resolvedName) {
        const jsTitleMatch =
          html.match(/["']title["']\s*:\s*["']([^"']+\.(?:mp3|wav|m4a|aac|flac|ogg|webm))["']/i) ||
          html.match(/\["title",\s*["']([^"']+)["']\]/i) ||
          html.match(/\["([^"']+\.(?:mp3|wav|m4a|aac|flac|ogg|webm))"/i);
        if (jsTitleMatch && jsTitleMatch[1]) {
          resolvedName = decodeHtmlEntities(jsTitleMatch[1]);
        }
      }
    }
  } catch {}

  // 2. Try HEAD / GET request to direct download endpoint to inspect Content-Disposition
  if (!resolvedName || resolvedName.startsWith('Google Drive -')) {
    try {
      const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
      const headRes = await fetch(directUrl, {
        method: 'GET',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Range: 'bytes=0-100',
        },
        signal: AbortSignal.timeout(4500),
      });

      const disposition = headRes.headers.get('content-disposition');
      const nameFromDisp = parseFilenameFromHeader(disposition);
      if (nameFromDisp) {
        resolvedName = decodeHtmlEntities(nameFromDisp);
      }
    } catch {}
  }

  // Fallback filename if nothing detected
  if (!resolvedName || resolvedName === 'Google Drive' || resolvedName === 'Untitled') {
    resolvedName = `Nhạc Google Drive (${fileId.slice(0, 8)})`;
  }

  // Clean filename extension & parse Artist - Title
  const rawWithoutExt = resolvedName.replace(/\.[a-zA-Z0-9]{2,5}$/, '');
  const { title, artist } = cleanTitleAndArtist(rawWithoutExt, 'Google Drive');

  return {
    ok: true,
    fileId,
    filename: resolvedName,
    title: title || resolvedName,
    artist: artist === 'Google Drive' ? '' : artist,
    thumbnail: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
    streamUrl: `/api/gdrive/stream?id=${fileId}`,
    sourceUrl: `https://drive.google.com/file/d/${fileId}/view`,
  };
}

/**
 * Resilient fetcher for Google Drive audio stream / download
 * Handles redirects, session cookies, virus scan confirmation pages, and Range headers
 */
async function fetchGoogleDriveAudio(fileId, clientHeaders = {}) {
  const directUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
  const ucUrl = `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`;

  const reqHeaders = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: '*/*',
    ...clientHeaders,
  };

  // Attempt 1: direct drive.usercontent.google.com endpoint
  let cookies = [];
  let upstream = await fetch(directUrl, {
    headers: reqHeaders,
    redirect: 'follow',
  });

  // Collect any Set-Cookie headers
  const getCookies = (res) => {
    if (res.headers.getSetCookie) {
      return res.headers.getSetCookie();
    }
    const raw = res.headers.get('set-cookie');
    return raw ? [raw] : [];
  };
  cookies.push(...getCookies(upstream));

  let contentType = upstream.headers.get('content-type') || '';

  // If redirected to or received HTML (virus warning page)
  if (contentType.includes('text/html')) {
    const htmlText = await upstream.text();

    // 1. Look for form action & hidden inputs
    const formMatch = htmlText.match(/<form[^>]+id=["']download-form["'][^>]*action=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i) ||
      htmlText.match(/<form[^>]*action=["']([^"']+)["'][^>]*>([\s\S]*?)<\/form>/i);

    let submitUrl = '';
    const params = new URLSearchParams();

    if (formMatch) {
      submitUrl = formMatch[1];
      const formBody = formMatch[2];
      const inputRegex = /<input[^>]+name=["']([^"']+)["'][^>]+value=["']([^"']*)["']/gi;
      let inputMatch;
      while ((inputMatch = inputRegex.exec(formBody)) !== null) {
        params.set(inputMatch[1], inputMatch[2]);
      }
    }

    // 2. Look for download anchor
    if (!submitUrl) {
      const anchorMatch =
        htmlText.match(/<a[^>]+id=["']uc-download-link["'][^>]+href=["']([^"']+)["']/i) ||
        htmlText.match(/<a[^>]+href=["']([^"']*confirm=[^"']+)["']/i);
      if (anchorMatch) {
        submitUrl = anchorMatch[1].replace(/&amp;/g, '&');
      }
    }

    // 3. Fallback: extract confirm token
    if (!submitUrl) {
      const confirmMatch = htmlText.match(/[?&]confirm=([0-9A-Za-z_-]+)/) ||
        htmlText.match(/name=["']confirm["']\s+value=["']([^"']+)["']/);
      const confirmToken = confirmMatch ? confirmMatch[1] : 't';
      submitUrl = `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=${confirmToken}`;
    }

    // If submitUrl is relative, prepend host
    if (submitUrl.startsWith('/')) {
      submitUrl = `https://drive.usercontent.google.com${submitUrl}`;
    } else if (params.toString() && !submitUrl.includes('?')) {
      submitUrl = `${submitUrl}?${params.toString()}`;
    }

    const cookieHeader = cookies.map((c) => c.split(';')[0]).join('; ');
    const secondHeaders = {
      ...reqHeaders,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    };

    upstream = await fetch(submitUrl, {
      headers: secondHeaders,
      redirect: 'follow',
    });
    contentType = upstream.headers.get('content-type') || '';
  }

  // If still HTML or failed, try ucUrl as secondary fallback
  if (!upstream.ok || contentType.includes('text/html')) {
    try {
      const fallbackRes = await fetch(ucUrl, {
        headers: reqHeaders,
        redirect: 'follow',
      });
      if (fallbackRes.ok && !fallbackRes.headers.get('content-type')?.includes('text/html')) {
        upstream = fallbackRes;
      }
    } catch {}
  }

  return upstream;
}

/**
 * Downloads audio file from Google Drive and saves into studio storage
 */
export async function downloadFromDrive(fileId, customName) {
  const upstream = await fetchGoogleDriveAudio(fileId);

  if (!upstream.ok) {
    throw new Error(
      `Google Drive phản hồi mã lỗi HTTP ${upstream.status}. Vui lòng kiểm tra quyền chia sẻ công khai của tệp.`
    );
  }

  const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
  if (contentType.includes('text/html')) {
    throw new Error(
      'Không thể tải trực tiếp tệp từ Google Drive. Vui lòng đảm bảo tệp đã bật quyền "Bất kỳ ai có đường liên kết đều có thể xem".'
    );
  }

  let finalName = customName;
  const disposition = upstream.headers.get('content-disposition');
  const nameFromHeader = parseFilenameFromHeader(disposition);
  if (nameFromHeader) {
    finalName = nameFromHeader;
  }
  if (!finalName) {
    finalName = `Drive_${fileId.slice(0, 8)}.mp3`;
  }

  const arrayBuf = await upstream.arrayBuffer();
  if (arrayBuf.byteLength < 500) {
    throw new Error('Dữ liệu tải về từ Google Drive quá nhỏ hoặc không hợp lệ.');
  }

  return await saveAudioBuffer(Buffer.from(arrayBuf), finalName, contentType);
}

/**
 * Direct audio streaming proxy for Google Drive
 * Allows browser <audio> tag to play, seek, and trim Google Drive audio seamlessly
 */
export async function streamFromDrive(req, res, fileId) {
  try {
    const upstreamHeaders = {};
    if (req.headers.range) {
      upstreamHeaders.range = req.headers.range;
    }

    const upstream = await fetchGoogleDriveAudio(fileId, upstreamHeaders);

    if (!upstream.ok && upstream.status !== 206) {
      res.statusCode = upstream.status || 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: false,
          error: `Không thể mở luồng phát từ Google Drive (Mã lỗi ${upstream.status}). Vui lòng kiểm tra quyền chia sẻ tệp.`,
        })
      );
      return;
    }

    const contentType = upstream.headers.get('content-type') || 'audio/mpeg';
    if (contentType.includes('text/html')) {
      res.statusCode = 403;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(
        JSON.stringify({
          ok: false,
          error: 'Tệp Google Drive cần được chia sẻ ở chế độ "Bất kỳ ai có đường liên kết đều có thể xem".',
        })
      );
      return;
    }

    // Set streaming audio headers
    res.statusCode = upstream.status; // 200 or 206 Partial Content
    res.setHeader('Content-Type', contentType.includes('audio') ? contentType : 'audio/mpeg');
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400');

    const contentRange = upstream.headers.get('content-range');
    if (contentRange) {
      res.setHeader('Content-Range', contentRange);
    }

    const contentLength = upstream.headers.get('content-length');
    if (contentLength) {
      res.setHeader('Content-Length', contentLength);
    }

    // If HEAD request, close headers immediately
    if (req.method === 'HEAD') {
      res.end();
      return;
    }

    // Stream audio body using Node.js Readable stream
    if (upstream.body) {
      const nodeStream = Readable.fromWeb(upstream.body);
      nodeStream.on('error', () => {
        if (!res.writableEnded) res.end();
      });
      req.on('close', () => {
        nodeStream.destroy();
      });
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ ok: false, error: err?.message || 'Lỗi phát nhạc từ Google Drive' }));
    }
  }
}
