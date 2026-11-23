import { readFile, writeFile } from 'node:fs/promises';
import { GDRIVE_CONFIG_FILE } from './paths.mjs';
import { saveAudioBuffer } from './audioStorage.mjs';

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

export function extractDriveFileId(input) {
  if (!input) return null;
  const str = String(input).trim();
  // Match /d/{fileId}
  const matchD = str.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (matchD) return matchD[1];
  // Match id={fileId}
  const matchId = str.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (matchId) return matchId[1];
  // Match bare 25-45 char ID
  if (/^[a-zA-Z0-9_-]{25,50}$/.test(str)) {
    return str;
  }
  return null;
}

export async function downloadFromDrive(fileId, originalName = 'GoogleDriveAudio.mp3') {
  const directUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
  const res = await fetch(directUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuyenCaStudio/1.0',
    },
  });

  if (!res.ok) {
    throw new Error(`Google Drive phản hồi mã lỗi HTTP ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || 'audio/mpeg';
  if (contentType.includes('text/html')) {
    // Large file virus warning confirmation page may be returned by Google Drive
    const htmlText = await res.text();
    const confirmMatch = htmlText.match(/confirm=([0-9A-Za-z_]+)/);
    if (confirmMatch) {
      const confirmToken = confirmMatch[1];
      const secondRes = await fetch(`${directUrl}&confirm=${confirmToken}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) DuyenCaStudio/1.0',
        },
      });
      if (secondRes.ok) {
        const arrayBuf = await secondRes.arrayBuffer();
        return await saveAudioBuffer(Buffer.from(arrayBuf), originalName, contentType);
      }
    }
    throw new Error('Tệp Google Drive cần quyền công khai hoặc vượt giới hạn tải trực tiếp không cần đăng nhập.');
  }

  const arrayBuf = await res.arrayBuffer();
  return await saveAudioBuffer(Buffer.from(arrayBuf), originalName, contentType);
}
