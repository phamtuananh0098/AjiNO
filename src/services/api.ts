import type { PlaylistData, ServerInfo } from '../types';

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
