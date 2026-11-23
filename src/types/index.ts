export type AudioPlatform = 'local' | 'mobile' | 'gdrive' | 'link';

export type WeddingSide = 'groom' | 'bride' | 'both';

export type SectionTone =
  | 'rose'
  | 'wine'
  | 'gold'
  | 'champagne'
  | 'olive'
  | 'terracotta'
  | 'ink'
  | 'lavender'
  | 'navy';

export type AppTheme = 'paper' | 'night' | 'champagne' | 'rose';

export type PlaybackMode = 'clip' | 'full';

export interface WeddingMeta {
  title: string;
  couple: string;
  groomName?: string;
  brideName?: string;
  groomMusicStyle?: string;
  brideMusicStyle?: string;
  date: string;
  time: string;
  venue: string;
  note: string;
}

export interface Section {
  id: string;
  name: string;
  description: string;
  tone: SectionTone;
  order: number;
  side?: WeddingSide; // 'groom', 'bride', or 'both'
}

export interface Track {
  id: string;
  sectionId: string;
  side: WeddingSide; // 'groom' (Nhà Trai), 'bride' (Nhà Gái), 'both' (Chung)
  title: string;
  artist: string;
  platform: AudioPlatform;
  url: string;
  audioId?: string;
  fileName?: string;
  thumbnail?: string;
  note: string;
  favorite: boolean;
  isBackup?: boolean;
  trimStart: number;
  trimEnd: number | null;
  duration: number | null;
  volumeOffset?: number; // dB (-10 to +10)
  fadeIn?: number;       // seconds
  fadeOut?: number;      // seconds
  createdAt: number;
  order: number;
}

export interface Preferences {
  theme: AppTheme;
  autoNext: boolean;
  volume: number;
  saveInterval: number;
  defaultFade: number;
  preferredSideView?: 'split' | 'groom' | 'bride';
}

export interface PlaylistData {
  version: 1;
  isDefault?: boolean;
  meta: WeddingMeta;
  sections: Section[];
  tracks: Track[];
  preferences: Preferences;
  updatedAt: number;
  revision: number;
}

export interface LinkInfoResult {
  ok: boolean;
  title?: string;
  artist?: string;
  thumbnail?: string;
  duration?: number | null;
  platform?: AudioPlatform | 'youtube' | 'spotify' | 'soundcloud' | 'zingmp3';
  embedUrl?: string;
  streamUrl?: string;
  sourceUrl?: string;
  description?: string;
  error?: string;
}

export type SyncState = 'saved' | 'saving' | 'offline' | 'synced' | 'error';

export interface PlayerState {
  currentTrackId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  mode: PlaybackMode;
  loop: boolean;
  loading: boolean;
  error: string | null;
}

export interface ServerInfo {
  ok: boolean;
  appName: string;
  hostname: string;
  port: number;
  localIps: string[];
  clientCount: number;
  primaryLanUrl: string;
}
