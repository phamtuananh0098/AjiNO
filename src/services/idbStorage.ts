import type { PlaylistData } from '../types';

const DB_NAME = 'duyen-ca-ajino-db';
const STORE_NAME = 'wedding-project';
const KEY = 'active-playlist';
const LS_KEY = 'duyen-ca-ajino:v1';
const LS_BACKUP_KEY = 'duyen-ca-ajino:backup';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    } catch (err) {
      reject(err);
    }
  });
}

function isValidPlaylist(obj: any): obj is PlaylistData {
  return (
    obj &&
    typeof obj === 'object' &&
    obj.meta &&
    typeof obj.meta === 'object' &&
    Array.isArray(obj.sections) &&
    Array.isArray(obj.tracks)
  );
}

/**
 * Synchronous local retrieval from localStorage.
 * Used for zero-latency initial state in React useState.
 */
export function getStoredPlaylistSync(): PlaylistData | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (isValidPlaylist(parsed)) return parsed;
    }
  } catch {}

  try {
    const backupRaw = localStorage.getItem(LS_BACKUP_KEY);
    if (backupRaw) {
      const parsed = JSON.parse(backupRaw);
      if (isValidPlaylist(parsed)) return parsed;
    }
  } catch {}

  return null;
}

/**
 * Asynchronous retrieval checking both IndexedDB and localStorage,
 * prioritizing the one with the newest updatedAt / revision.
 */
export async function getLocalPlaylist(): Promise<PlaylistData | null> {
  const syncLocal = getStoredPlaylistSync();

  try {
    const db = await openDB();
    const idbData = await new Promise<PlaylistData | null>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => {
        if (isValidPlaylist(req.result)) {
          resolve(req.result);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });

    if (idbData && syncLocal) {
      return (idbData.updatedAt || 0) >= (syncLocal.updatedAt || 0) ? idbData : syncLocal;
    }
    return idbData || syncLocal;
  } catch {
    return syncLocal;
  }
}

/**
 * Save playlist data to both localStorage and IndexedDB.
 */
export async function setLocalPlaylist(data: PlaylistData): Promise<void> {
  if (!isValidPlaylist(data)) return;

  // 1. Synchronously save to primary and backup localStorage keys
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(LS_KEY, serialized);
    // Keep a secondary backup
    if (data.revision && data.revision > 1) {
      localStorage.setItem(LS_BACKUP_KEY, serialized);
    }
  } catch (err) {
    console.warn('[Storage] localStorage quota or error:', err);
  }

  // 2. Persist to IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}
