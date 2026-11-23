import type { PlaylistData, ServerInfo, LinkInfoResult } from '../types';
import { detectLinkMetadata, extractDriveFileId } from './linkDetector';

export const API_BASE = '/api';

export async function fetchServerPlaylist(): Promise<{ ok: boolean; playlist?: PlaylistData; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/playlist`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err.message || 'Không thể kết nối máy chủ' };
  }
}

export async function saveServerPlaylist(data: PlaylistData): Promise<{ ok: boolean; playlist?: PlaylistData; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/playlist`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err.message || 'Lỗi gửi dữ liệu lên máy chủ' };
  }
}

export async function uploadAudioFile(
  file: File,
  customName?: string
): Promise<{ ok: boolean; audio?: { id: string; url: string; name: string; size: number }; error?: string }> {
  try {
    const name = encodeURIComponent(customName || file.name);
    const res = await fetch(`${API_BASE}/audio?name=${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Lỗi tải lên (HTTP ${res.status})`);
    }
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err.message || 'Lỗi tải tệp âm thanh lên máy chủ' };
  }
}

export async function importGoogleDriveAudio(
  urlOrId: string,
  fileName?: string
): Promise<{ ok: boolean; audio?: { id: string; url: string; name: string }; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/gdrive/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: urlOrId, name: fileName }),
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err.message || 'Lỗi nhập tệp từ Google Drive' };
  }
}

export async function fetchServerInfo(): Promise<ServerInfo | null> {
  try {
    const res = await fetch(`${API_BASE}/server-info`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function fetchLinkInfo(url: string): Promise<LinkInfoResult> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return { ok: false, error: 'Đường dẫn trống' };
  }

  // 1. Client-Side Instant & Resilient Detection (Zero network dependency, never fails on known patterns)
  let clientResult: LinkInfoResult | null = null;
  try {
    clientResult = await detectLinkMetadata(cleanUrl);
  } catch (err: any) {
    console.warn('[link-detect-client-err]', err);
  }

  // If client parsed title and artist cleanly, return immediately
  if (
    clientResult &&
    clientResult.ok &&
    clientResult.title &&
    !clientResult.title.startsWith('Nhạc YouTube (') &&
    !clientResult.title.startsWith('Nhạc Google Drive (')
  ) {
    return clientResult;
  }

  // If Google Drive link and title is still generic fallback, try dedicated gdrive metadata endpoint
  const driveId = extractDriveFileId(cleanUrl);
  if (driveId && (!clientResult?.title || clientResult.title.startsWith('Nhạc Google Drive ('))) {
    try {
      const gRes = await fetch(`${API_BASE}/gdrive/metadata?id=${driveId}`, {
        signal: AbortSignal.timeout(4000),
      });
      if (gRes.ok) {
        const gData = await gRes.json();
        if (gData && gData.title && !gData.title.startsWith('Nhạc Google Drive (')) {
          return {
            ok: true,
            platform: 'gdrive',
            title: gData.title,
            artist: gData.artist || '',
            thumbnail: gData.thumbnail,
            streamUrl: `/api/gdrive/stream?id=${driveId}`,
            sourceUrl: cleanUrl,
          };
        }
      }
    } catch {}
  }

  // 2. Try Server API enrichment if available
  try {
    const res = await fetch(`${API_BASE}/link-info?url=${encodeURIComponent(cleanUrl)}`, {
      signal: AbortSignal.timeout(3500),
    });
    if (res.ok) {
      const serverData = await res.json();
      if (serverData && serverData.ok && serverData.title) {
        return serverData;
      }
    }
  } catch {}

  // 3. Fallback to client result or safe default
  if (clientResult && clientResult.ok) {
    return clientResult;
  }

  return {
    ok: true,
    platform: 'link',
    title: 'Liên kết âm nhạc',
    artist: '',
    sourceUrl: cleanUrl,
  };
}
