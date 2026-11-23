import type { PlaylistData } from '../types';

const DB_NAME = 'duyen-ca-ajino-db';
const STORE_NAME = 'wedding-project';
const KEY = 'active-playlist';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getLocalPlaylist(): Promise<PlaylistData | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => resolve(null);
    });
  } catch {
    // Fallback to localStorage
    try {
      const raw = localStorage.getItem('duyen-ca-ajino:v1');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }
}

export async function setLocalPlaylist(data: PlaylistData): Promise<void> {
  // Always update localStorage as fast secondary
  try {
    localStorage.setItem('duyen-ca-ajino:v1', JSON.stringify(data));
  } catch {}

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(data, KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {}
}
