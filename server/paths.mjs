import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const ROOT = resolve(__dirname, '..');

// When running on Vercel Serverless Lambda, file system is read-only except /tmp
export const IS_VERCEL = !!process.env.VERCEL;
export const DATA_DIR = IS_VERCEL
  ? resolve('/tmp', 'duyen-ca-ajino-data')
  : resolve(ROOT, '.data');

export const AUDIO_DIR = resolve(DATA_DIR, 'audio');
export const PLAYLIST_FILE = resolve(DATA_DIR, 'playlist.json');
export const GDRIVE_CONFIG_FILE = resolve(DATA_DIR, 'gdrive.json');
export const DIST_DIR = resolve(ROOT, 'dist');
