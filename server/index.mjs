import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { networkInterfaces, hostname } from 'node:os';
import { extname, join, sep } from 'node:path';
import { DIST_DIR } from './paths.mjs';
import {
  handleAudioUpload,
  handleAudioStream,
  handleAudioDelete,
  listAllAudio,
  ensureAudioDir,
} from './audioStorage.mjs';
import {
  ensurePlaylistLoaded,
  savePlaylist,
  handleSseConnection,
  getClientCount,
  broadcastEvent,
} from './playlistSync.mjs';
import {
  loadDriveConfig,
  saveDriveConfig,
  extractDriveFileId,
  downloadFromDrive,
  streamFromDrive,
  fetchDriveMetadata,
} from './gdriveService.mjs';
import { parseLinkMetadata } from './linkParser.mjs';

const PORT = Number(process.env.PORT) || 8788;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

function getLocalIps() {
  const nets = networkInterfaces();
  const results = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push(net.address);
      }
    }
  }
  return results;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
      if (data.length > 5 * 1024 * 1024) {
        reject(new Error('Dữ liệu JSON quá lớn'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, url) {
  const pathname = url.pathname;

  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end();
    return true;
  }

  // 1. Server info & LAN IPs
  if (pathname === '/api/server-info' && req.method === 'GET') {
    const ips = getLocalIps();
    sendJson(res, 200, {
      ok: true,
      appName: 'Duyên Ca · Wedding Playlist Studio (AjiNO)',
      hostname: hostname(),
      port: PORT,
      localIps: ips,
      clientCount: getClientCount(),
      primaryLanUrl: ips.length > 0 ? `http://${ips[0]}:${PORT}` : `http://localhost:${PORT}`,
    });
    return true;
  }

  // 2. Real-time SSE sync events
  if (pathname === '/api/sync/events') {
    handleSseConnection(req, res);
    return true;
  }

  // 3. Playlist API
  if (pathname === '/api/playlist') {
    if (req.method === 'GET') {
      const pl = await ensurePlaylistLoaded();
      sendJson(res, 200, { ok: true, playlist: pl });
      return true;
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      try {
        const body = await readJsonBody(req);
        if (!body || !body.meta || !Array.isArray(body.sections)) {
          sendJson(res, 400, { ok: false, error: 'Dữ liệu danh sách nhạc không hợp lệ.' });
          return true;
        }
        const saved = await savePlaylist(body);
        sendJson(res, 200, { ok: true, playlist: saved });
      } catch (err) {
        sendJson(res, 500, { ok: false, error: err?.message || 'Lỗi lưu danh sách nhạc.' });
      }
      return true;
    }
  }

  // 4. Audio storage API
  if (pathname === '/api/audio' && req.method === 'GET') {
    const list = await listAllAudio();
    sendJson(res, 200, { ok: true, audioFiles: list });
    return true;
  }

  if (pathname === '/api/audio' && req.method === 'POST') {
    await handleAudioUpload(req, res, url);
    return true;
  }

  if (pathname.startsWith('/api/audio/')) {
    const audioId = pathname.replace('/api/audio/', '').trim();
    if (req.method === 'GET' || req.method === 'HEAD') {
      await handleAudioStream(req, res, audioId);
      return true;
    }
    if (req.method === 'DELETE') {
      await handleAudioDelete(req, res, audioId);
      return true;
    }
  }

  // 5. Google Drive API
  if (pathname === '/api/gdrive/status' && req.method === 'GET') {
    const cfg = await loadDriveConfig();
    sendJson(res, 200, { ok: true, config: cfg });
    return true;
  }

  if (pathname === '/api/gdrive/config' && req.method === 'POST') {
    const body = await readJsonBody(req);
    const updated = await saveDriveConfig(body);
    sendJson(res, 200, { ok: true, config: updated });
    return true;
  }

  if (pathname === '/api/gdrive/import' && req.method === 'POST') {
    try {
      const body = await readJsonBody(req);
      const fileId = extractDriveFileId(body.url || body.fileId);
      if (!fileId) {
        sendJson(res, 400, { ok: false, error: 'Đường dẫn hoặc File ID Google Drive không hợp lệ.' });
        return true;
      }
      const originalName = body.name || `Drive_${fileId.slice(0, 8)}.mp3`;
      const audioMeta = await downloadFromDrive(fileId, originalName);

      sendJson(res, 200, {
        ok: true,
        audio: {
          id: audioMeta.id,
          url: `/api/audio/${audioMeta.id}`,
          name: audioMeta.name,
          size: audioMeta.size,
          ext: audioMeta.ext,
        },
      });
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err?.message || 'Không thể nhập tệp từ Google Drive.' });
    }
    return true;
  }

  if (pathname === '/api/gdrive/stream' && (req.method === 'GET' || req.method === 'HEAD')) {
    const fileId = url.searchParams.get('id') || url.searchParams.get('fileId');
    if (!fileId) {
      sendJson(res, 400, { ok: false, error: 'Thiếu tham số id của tệp Google Drive.' });
      return true;
    }
    await streamFromDrive(req, res, fileId);
    return true;
  }

  if (pathname === '/api/gdrive/metadata' && req.method === 'GET') {
    const fileId = url.searchParams.get('id') || url.searchParams.get('fileId');
    if (!fileId) {
      sendJson(res, 400, { ok: false, error: 'Thiếu tham số id của tệp Google Drive.' });
      return true;
    }
    try {
      const meta = await fetchDriveMetadata(fileId);
      sendJson(res, 200, meta);
    } catch (err) {
      sendJson(res, 500, { ok: false, error: err?.message || 'Lỗi quét thông tin Google Drive.' });
    }
    return true;
  }

  // 6. Link metadata auto-detection endpoint
  if (pathname === '/api/link-info' && req.method === 'GET') {
    const targetUrl = url.searchParams.get('url');
    if (!targetUrl) {
      sendJson(res, 400, { ok: false, error: 'Thiếu tham số url' });
      return true;
    }
    try {
      const info = await parseLinkMetadata(targetUrl);
      sendJson(res, 200, info);
    } catch (err) {
      sendJson(res, 400, { ok: false, error: err?.message || 'Không thể nhận diện liên kết' });
    }
    return true;
  }

  return false;
}

async function serveStatic(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname);
  } catch {
    res.statusCode = 400;
    res.end('Bad Request');
    return;
  }

  let filePath = join(DIST_DIR, pathname === '/' ? 'index.html' : pathname);

  try {
    const info = await stat(filePath);
    if (info.isDirectory()) filePath = join(filePath, 'index.html');
    const body = await readFile(filePath);
    const ext = extname(filePath).toLowerCase();
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    const isEntry =
      filePath.endsWith(`${sep}index.html`) ||
      filePath.endsWith(`${sep}sw.js`) ||
      filePath.endsWith('.webmanifest');
    res.setHeader(
      'Cache-Control',
      isEntry ? 'no-cache' : 'public, max-age=31536000, immutable',
    );
    res.statusCode = 200;
    if (req.method === 'HEAD') {
      res.setHeader('Content-Length', body.length);
      res.end();
    } else {
      res.end(body);
    }
  } catch {
    // SPA fallback
    try {
      const body = await readFile(join(DIST_DIR, 'index.html'));
      res.setHeader('Content-Type', MIME['.html']);
      res.setHeader('Cache-Control', 'no-cache');
      res.statusCode = 200;
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.end(`
        <div style="font-family:sans-serif;padding:3rem;text-align:center;color:#443322;">
          <h2>🎵 Duyên Ca · Wedding Playlist Studio (AjiNO)</h2>
          <p>Máy chủ backend đồng bộ đang hoạt động tại cổng <b>${PORT}</b>.</p>
          <p>Để mở giao diện người dùng, hãy chạy: <br/><code>npm run dev</code> hoặc <code>npm run build</code> rồi tải lại trang.</p>
        </div>
      `);
    }
  }
}

async function start() {
  await ensureAudioDir();
  await ensurePlaylistLoaded();
  await loadDriveConfig();

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? '/', `http://${req.headers.host || 'localhost'}`);
      const handled = await handleApi(req, res, url);
      if (!handled) {
        await serveStatic(req, res);
      }
    } catch (err) {
      console.error('[duyen-ca-server] Lỗi xử lý yêu cầu:', err);
      if (!res.headersSent) {
        sendJson(res, 500, { ok: false, error: 'Lỗi nội bộ máy chủ.' });
      }
    }
  });

  server.listen(PORT, HOST, () => {
    const ips = getLocalIps();
    console.log('\n============================================================');
    console.log('  💐 DUYÊN CA · WEDDING PLAYLIST STUDIO (AjiNO)');
    console.log('  Đồng bộ thời gian thực & Lưu trữ âm thanh');
    console.log('============================================================');
    console.log(`  > Máy tính cục bộ:   http://localhost:${PORT}`);
    if (ips.length > 0) {
      console.log(`  > Điện thoại / Mạng:  http://${ips[0]}:${PORT}`);
      for (let i = 1; i < ips.length; i++) {
        console.log(`                       http://${ips[i]}:${PORT}`);
      }
    }
    console.log('============================================================\n');
  });
}

export { handleApi, start };

if (!process.env.VERCEL) {
  start().catch((err) => {
    console.error('Không thể khởi động máy chủ:', err);
    process.exit(1);
  });
}
