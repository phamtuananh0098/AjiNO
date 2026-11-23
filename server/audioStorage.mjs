import { createReadStream } from 'node:fs';
import { mkdir, open, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { AUDIO_DIR } from './paths.mjs';

const MAX_AUDIO_BYTES = 150 * 1024 * 1024; // 150MB
const ALLOWED_EXT = new Set(['mp3', 'm4a', 'aac', 'wav', 'ogg', 'oga', 'opus', 'flac', 'webm']);

const MIME_BY_EXT = {
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  oga: 'audio/ogg',
  opus: 'audio/ogg',
  flac: 'audio/flac',
  webm: 'audio/webm',
};

const TYPE_EXT = {
  'audio/mpeg': 'mp3',
  'audio/mp3': 'mp3',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/m4a': 'm4a',
  'audio/aac': 'aac',
  'audio/wav': 'wav',
  'audio/x-wav': 'wav',
  'audio/wave': 'wav',
  'audio/ogg': 'ogg',
  'application/ogg': 'oga',
  'audio/opus': 'opus',
  'audio/flac': 'flac',
  'audio/x-flac': 'flac',
  'audio/webm': 'webm',
};

export async function ensureAudioDir() {
  await mkdir(AUDIO_DIR, { recursive: true });
}

function metaPath(id) {
  return join(AUDIO_DIR, `${id}.json`);
}

function audioPath(id, ext) {
  return join(AUDIO_DIR, `${id}.${ext}`);
}

function cleanBaseType(value) {
  return String(value ?? '').split(';')[0].trim().toLowerCase();
}

function extFor(name, contentType) {
  const fileExt = extname(name).slice(1).toLowerCase();
  if (ALLOWED_EXT.has(fileExt)) return fileExt;
  const byType = TYPE_EXT[cleanBaseType(contentType)];
  return byType && ALLOWED_EXT.has(byType) ? byType : null;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(payload));
}

export async function readAudioMeta(id) {
  try {
    const raw = await readFile(metaPath(id), 'utf8');
    const meta = JSON.parse(raw);
    if (!meta || !ALLOWED_EXT.has(meta.ext)) return null;
    return meta;
  } catch {
    return null;
  }
}

export async function listAllAudio() {
  await ensureAudioDir();
  const files = await readdir(AUDIO_DIR);
  const metas = [];
  for (const f of files) {
    if (f.endsWith('.json')) {
      const id = f.replace(/\.json$/, '');
      const meta = await readAudioMeta(id);
      if (meta) metas.push(meta);
    }
  }
  return metas;
}

export async function saveAudioBuffer(buffer, originalName, mimeType) {
  await ensureAudioDir();
  const ext = extFor(originalName, mimeType) || 'mp3';
  const id = randomBytes(16).toString('hex');
  const finalAudioPath = audioPath(id, ext);
  const finalMetaPath = metaPath(id);

  await writeFile(finalAudioPath, buffer);
  const meta = {
    id,
    name: originalName || `audio_${Date.now()}.${ext}`,
    ext,
    size: buffer.length,
    mime: MIME_BY_EXT[ext] || 'audio/mpeg',
    createdAt: Date.now(),
  };
  await writeFile(finalMetaPath, JSON.stringify(meta, null, 2), 'utf8');
  return meta;
}

export async function handleAudioUpload(req, res, url) {
  await ensureAudioDir();
  const rawName = decodeURIComponent(url.searchParams.get('name') ?? '');
  const contentType = req.headers['content-type'];
  const ext = extFor(rawName, contentType);

  if (!ext) {
    req.resume();
    return sendJson(res, 415, {
      ok: false,
      error: 'Định dạng tệp không hỗ trợ. Vui lòng chọn MP3, M4A, AAC, WAV, OGG, OPUS, FLAC hoặc WEBM.',
    });
  }

  const id = randomBytes(16).toString('hex');
  const tempPath = join(AUDIO_DIR, `.${id}.${Date.now()}.tmp`);
  let handle;
  try {
    handle = await open(tempPath, 'wx');
  } catch (err) {
    req.resume();
    return sendJson(res, 500, { ok: false, error: 'Không thể tạo tệp tạm.' });
  }

  let written = 0;
  let tooLarge = false;

  try {
    for await (const chunk of req) {
      written += chunk.length;
      if (written > MAX_AUDIO_BYTES) {
        tooLarge = true;
        break;
      }
      await handle.write(chunk);
    }
  } catch (err) {
    await handle.close().catch(() => {});
    await unlink(tempPath).catch(() => {});
    return sendJson(res, 500, { ok: false, error: 'Lỗi ghi tệp âm thanh.' });
  }

  await handle.close();

  if (tooLarge) {
    await unlink(tempPath).catch(() => {});
    return sendJson(res, 413, {
      ok: false,
      error: `Tệp âm thanh quá lớn (tối đa ${Math.round(MAX_AUDIO_BYTES / 1024 / 1024)}MB).`,
    });
  }

  const finalAudio = audioPath(id, ext);
  const finalMeta = metaPath(id);

  try {
    await rename(tempPath, finalAudio);
    const meta = {
      id,
      name: rawName || `audio_${id.slice(0, 8)}.${ext}`,
      ext,
      size: written,
      mime: MIME_BY_EXT[ext] || 'audio/mpeg',
      createdAt: Date.now(),
    };
    await writeFile(finalMeta, JSON.stringify(meta, null, 2), 'utf8');

    return sendJson(res, 201, {
      ok: true,
      audio: {
        id,
        url: `/api/audio/${id}`,
        name: meta.name,
        size: meta.size,
        ext: meta.ext,
        mime: meta.mime,
        createdAt: meta.createdAt,
      },
    });
  } catch (err) {
    await unlink(tempPath).catch(() => {});
    return sendJson(res, 500, { ok: false, error: 'Không thể hoàn tất lưu tệp âm thanh.' });
  }
}

export async function handleAudioStream(req, res, id) {
  const meta = await readAudioMeta(id);
  if (!meta) {
    return sendJson(res, 404, { ok: false, error: 'Không tìm thấy tệp âm thanh.' });
  }

  const filePath = audioPath(id, meta.ext);
  let fileStat;
  try {
    fileStat = await stat(filePath);
  } catch {
    return sendJson(res, 404, { ok: false, error: 'Tệp âm thanh trên đĩa bị thiếu.' });
  }

  const totalSize = fileStat.size;
  const mimeType = meta.mime || MIME_BY_EXT[meta.ext] || 'audio/mpeg';

  res.setHeader('Accept-Ranges', 'bytes');
  res.setHeader('Content-Type', mimeType);
  res.setHeader('Cache-Control', 'public, max-age=86400');

  const range = req.headers.range;
  if (!range) {
    res.statusCode = 200;
    res.setHeader('Content-Length', totalSize);
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    createReadStream(filePath).pipe(res);
    return;
  }

  const parts = range.replace(/bytes=/, '').split('-');
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

  if (isNaN(start) || isNaN(end) || start > end || start >= totalSize) {
    res.statusCode = 416;
    res.setHeader('Content-Range', `bytes */${totalSize}`);
    res.end();
    return;
  }

  const chunksize = end - start + 1;
  res.statusCode = 206;
  res.setHeader('Content-Range', `bytes ${start}-${end}/${totalSize}`);
  res.setHeader('Content-Length', chunksize);

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  createReadStream(filePath, { start, end }).pipe(res);
}

export async function handleAudioDelete(req, res, id) {
  const meta = await readAudioMeta(id);
  if (!meta) {
    return sendJson(res, 404, { ok: false, error: 'Tệp không tồn tại.' });
  }

  try {
    await unlink(audioPath(id, meta.ext)).catch(() => {});
    await unlink(metaPath(id)).catch(() => {});
    return sendJson(res, 200, { ok: true, message: 'Đã xóa tệp thành công.' });
  } catch (err) {
    return sendJson(res, 500, { ok: false, error: 'Không thể xóa tệp.' });
  }
}
