import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import type { PlaylistData, WeddingMeta, Section, Track, SectionTone, WeddingSide, AppTheme, SyncState, Preferences } from '../types';
import { getLocalPlaylist, setLocalPlaylist, getStoredPlaylistSync } from '../services/idbStorage';
import { fetchServerPlaylist, saveServerPlaylist, API_BASE } from '../services/api';
import { useToast } from './toastContext';

const DEFAULT_DATA: PlaylistData = {
  version: 1,
  isDefault: true,
  meta: {
    title: 'Lễ Thành Hôn & Dạ Tiệc Cưới',
    couple: 'Minh Quân & Thùy Dung',
    groomName: 'Minh Quân (Họ Nhà Trai)',
    brideName: 'Thùy Dung (Họ Nhà Gái)',
    groomMusicStyle: 'Pop Rock, Acoustic, Ballad ấm áp, Gu nhạc chú rể & hội bạn',
    brideMusicStyle: 'Ballad ngọt ngào, K-Pop, Nhạc Hoa lãng mạn, Gu nhạc cô dâu',
    date: '2026-12-28',
    time: '18:00',
    venue: 'Grand Palace Ballroom · Sảnh Ánh Dương',
    note: 'Kịch bản phân chia 2 bên Nhà Trai & Nhà Gái — Tự do cá nhân hoá theo sở thích riêng biệt.',
  },
  sections: [
    {
      id: 'sec_groom_procession',
      name: 'Lễ xuất phát rước dâu (Nhà Trai)',
      description: 'Nhạc hào hứng, rộn ràng khi nhà trai chuẩn bị sính lễ và lên xe hoa sang đón dâu.',
      tone: 'gold',
      side: 'groom',
      order: 1,
    },
    {
      id: 'sec_bride_vuquy',
      name: 'Lễ Vu Quy & Đón khách (Nhà Gái)',
      description: 'Nhạc acoustic dịu dàng, trang trọng đón họ nhà trai sang làm lễ thưa chuyện.',
      tone: 'rose',
      side: 'bride',
      order: 2,
    },
    {
      id: 'sec_welcome',
      name: 'Đón khách & Chụp hình sảnh tiệc',
      description: 'Âm nhạc lãng mạn, văn minh chào đón quan khách hai họ chụp ảnh lưu niệm.',
      tone: 'champagne',
      side: 'both',
      order: 3,
    },
    {
      id: 'sec_groom_entrance',
      name: 'Khai mạc & Chú rể tiến vào',
      description: 'Nhạc hào hùng, xúc động đón chú rể bước lên sân khấu đón chờ tình yêu đời mình.',
      tone: 'gold',
      side: 'groom',
      order: 4,
    },
    {
      id: 'sec_bride_entrance',
      name: 'Khoảnh khắc Cô dâu bước vào lễ đường',
      description: 'Khoảnh khắc thiêng liêng nhất — bật đúng điệp khúc cao trào khi cánh cửa mở ra!',
      tone: 'wine',
      side: 'bride',
      order: 5,
    },
    {
      id: 'sec_vows_rings',
      name: 'Trao nhẫn & Thề nguyện trọn đời',
      description: 'Nhạc nền dịu êm làm nổi bật lời thề và chiếc nhẫn cưới của đôi bạn trẻ.',
      tone: 'rose',
      side: 'both',
      order: 6,
    },
    {
      id: 'sec_cake_toast',
      name: 'Cắt bánh, Rót rượu & Hai họ nâng ly',
      description: 'Tiết tấu tươi vui, hứng khởi khi pháo hoa sáng rực và toàn thể khách mời nâng ly.',
      tone: 'gold',
      side: 'both',
      order: 7,
    },
    {
      id: 'sec_dinner',
      name: 'Dạ tiệc cưới & Dùng bữa',
      description: 'Jazz lãng mạn, Bossa Nova và Pop Ballad du dương trong suốt bữa tiệc.',
      tone: 'olive',
      side: 'both',
      order: 8,
    },
    {
      id: 'sec_groom_party',
      name: 'Giao lưu & Quẩy tiệc hội bạn Chú Rể (Nhà Trai)',
      description: 'Remix, EDM và Rock sôi động theo gu âm nhạc chú rể và hội anh em.',
      tone: 'ink',
      side: 'groom',
      order: 9,
    },
    {
      id: 'sec_bride_party',
      name: 'Tung hoa cưới & Quẩy tiệc hội bạn Cô Dâu (Nhà Gái)',
      description: 'Nhạc vui nhộn, hào hứng cho phần tung hoa cưới và mini game cùng hội bạn thân nàng dâu.',
      tone: 'rose',
      side: 'bride',
      order: 10,
    },
    {
      id: 'sec_farewell',
      name: 'Tiễn khách & Lời tri ân hai họ',
      description: 'Nhạc ấm áp, lắng đọng gửi lời cảm ơn chân thành đến mọi người khi ra về.',
      tone: 'champagne',
      side: 'both',
      order: 11,
    },
  ],
  tracks: [
    {
      id: 'trk_groom_sample',
      sectionId: 'sec_groom_procession',
      side: 'groom',
      title: 'Ánh Nắng Của Anh (Piano Acoustic)',
      artist: 'Đức Phúc',
      platform: 'link',
      url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3',
      thumbnail: '',
      note: '🤵 NHÀ TRAI: Bật khi đoàn xe hoa nhà trai bắt đầu xuất phát',
      favorite: true,
      trimStart: 0,
      trimEnd: null,
      duration: 180,
      createdAt: Date.now() - 3600000,
      order: 1,
    },
    {
      id: 'trk_bride_sample',
      sectionId: 'sec_bride_entrance',
      side: 'bride',
      title: 'A Thousand Years (Violin Wedding Version)',
      artist: 'Christina Perri',
      platform: 'link',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      thumbnail: '',
      note: '👰 NHÀ GÁI: QUAN TRỌNG - MC đếm 1 2 3 mở cửa là bấm phát ngay đoạn cao trào!',
      favorite: true,
      trimStart: 45,
      trimEnd: 150,
      duration: 220,
      createdAt: Date.now() - 1800000,
      order: 1,
    },
    {
      id: 'trk_both_sample',
      sectionId: 'sec_welcome',
      side: 'both',
      title: 'Until I Found You (Cello & Piano)',
      artist: 'Stephen Sanchez',
      platform: 'link',
      url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_c8c8a73467.mp3',
      thumbnail: '',
      note: '💍 CHUNG: Nhạc đón khách hai họ, giữ âm lượng vừa phải',
      favorite: false,
      trimStart: 0,
      trimEnd: null,
      duration: 200,
      createdAt: Date.now() - 900000,
      order: 1,
    },
  ],
  preferences: {
    theme: 'paper',
    autoNext: true,
    volume: 0.85,
    saveInterval: 300,
    defaultFade: 2,
    preferredSideView: 'split',
  },
  updatedAt: 0,
  revision: 0,
};

interface PlaylistContextType {
  playlist: PlaylistData;
  syncState: SyncState;
  clientCount: number;
  activeSideView: 'split' | 'groom' | 'bride';
  setActiveSideView: (view: 'split' | 'groom' | 'bride') => void;
  updateMeta: (patch: Partial<WeddingMeta>) => void;
  addSection: (name: string, description: string, tone?: SectionTone, side?: WeddingSide) => void;
  updateSection: (id: string, patch: Partial<Section>) => void;
  deleteSection: (id: string) => void;
  reorderSections: (newSections: Section[]) => void;
  addTrack: (track: Omit<Track, 'id' | 'createdAt' | 'order'>) => void;
  addMultipleTracks: (newTracks: Array<Omit<Track, 'id' | 'createdAt' | 'order'>>) => void;
  updateTrack: (id: string, patch: Partial<Track>) => void;
  deleteTrack: (id: string) => void;
  reorderTracks: (sectionId: string, newTracks: Track[]) => void;
  moveTrack: (trackId: string, targetSectionId: string) => void;
  moveTrackOrder: (trackId: string, direction: 'up' | 'down') => void;
  moveTrackToIndex: (trackId: string, targetSectionId: string, targetIndex: number) => void;
  setTheme: (theme: AppTheme) => void;
  setPreferences: (patch: Partial<Preferences>) => void;
  exportProject: () => void;
  importProject: (imported: PlaylistData) => void;
  refreshFromServer: () => Promise<void>;
}

function sortTracksNaturally(tracks: Track[], sections: Section[]): Track[] {
  const sectionOrderMap = new Map<string, number>();
  sections.forEach((s, idx) => sectionOrderMap.set(s.id, s.order ?? idx + 1));

  return [...tracks].sort((a, b) => {
    const secOrderA = sectionOrderMap.get(a.sectionId) ?? 999;
    const secOrderB = sectionOrderMap.get(b.sectionId) ?? 999;
    if (secOrderA !== secOrderB) return secOrderA - secOrderB;
    return (a.order || 0) - (b.order || 0);
  });
}

const PlaylistContext = createContext<PlaylistContextType | null>(null);

export function PlaylistProvider({ children }: { children: React.ReactNode }) {
  // Synchronously initialize with stored user edits immediately to avoid reset flashes
  const [playlist, setPlaylist] = useState<PlaylistData>(() => {
    const syncLocal = getStoredPlaylistSync();
    if (syncLocal) return syncLocal;
    return DEFAULT_DATA;
  });

  const [syncState, setSyncState] = useState<SyncState>('saved');
  const [clientCount, setClientCount] = useState<number>(1);
  const [activeSideView, setActiveSideView] = useState<'split' | 'groom' | 'bride'>(() => {
    const syncLocal = getStoredPlaylistSync();
    return syncLocal?.preferences?.preferredSideView || 'split';
  });
  const { pushToast } = useToast();

  const isInitialMount = useRef(true);
  const isSyncingFromRemote = useRef(false);
  const saveTimeoutRef = useRef<any>(null);

  const applyTheme = useCallback((theme: AppTheme) => {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const colors = {
        paper: '#f6f0e5',
        night: '#17100f',
        champagne: '#fbf7ee',
        rose: '#fdf3f4',
      };
      meta.setAttribute('content', colors[theme] || '#f6f0e5');
    }
  }, []);

  // Initial load: 1. local IDB -> 2. fetch server with non-destructive merge
  useEffect(() => {
    let active = true;
    async function init() {
      const local = await getLocalPlaylist();
      if (local && active) {
        setPlaylist(local);
        if (local.preferences?.theme) {
          applyTheme(local.preferences.theme);
        }
        if (local.preferences?.preferredSideView) {
          setActiveSideView(local.preferences.preferredSideView);
        }
      }

      try {
        const res = await fetchServerPlaylist();
        if (active && res.ok && res.playlist) {
          const serverPl = res.playlist;
          const currentLocal = local || getStoredPlaylistSync();

          // Check if server playlist is just the default placeholder
          const serverIsDefault =
            serverPl.isDefault === true ||
            (serverPl.revision <= 1 && (serverPl.updatedAt === 0 || serverPl.meta.couple === 'Minh Quân & Thùy Dung'));

          // Check if client has real customized edits
          const localIsCustomized =
            !!currentLocal &&
            !currentLocal.isDefault &&
            ((currentLocal.revision || 0) > 0 || currentLocal.meta.couple !== 'Minh Quân & Thùy Dung');

          if (serverIsDefault && localIsCustomized) {
            // NEVER wipe user's local edits with a default template from server!
            // Instead, re-seed server with the user's customized data:
            await saveServerPlaylist(currentLocal);
            setSyncState('synced');
          } else if (!currentLocal || (serverPl.updatedAt || 0) >= (currentLocal.updatedAt || 0)) {
            // Server has newer authentic changes
            setPlaylist(serverPl);
            await setLocalPlaylist(serverPl);
            if (serverPl.preferences?.theme) {
              applyTheme(serverPl.preferences.theme);
            }
            if (serverPl.preferences?.preferredSideView) {
              setActiveSideView(serverPl.preferences.preferredSideView);
            }
            setSyncState('synced');
          } else {
            // Local is newer than server, push local to server
            await saveServerPlaylist(currentLocal);
            setSyncState('synced');
          }
        }
      } catch {
        if (active) setSyncState('offline');
      } finally {
        isInitialMount.current = false;
      }
    }

    init();
    return () => {
      active = false;
    };
  }, [applyTheme]);

  // Connect SSE for Real-Time synchronization
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: any = null;

    function connectSSE() {
      try {
        eventSource = new EventSource(`${API_BASE}/sync/events`);

        eventSource.addEventListener('connected', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.clientCount) setClientCount(data.clientCount);
            setSyncState('synced');
          } catch {}
        });

        eventSource.addEventListener('client_count', (e: MessageEvent) => {
          try {
            const data = JSON.parse(e.data);
            if (data.clientCount) setClientCount(data.clientCount);
          } catch {}
        });

        eventSource.addEventListener('playlist_updated', async (e: MessageEvent) => {
          try {
            const info = JSON.parse(e.data);
            if (info.clientCount) setClientCount(info.clientCount);

            const res = await fetchServerPlaylist();
            if (res.ok && res.playlist) {
              isSyncingFromRemote.current = true;
              setPlaylist(res.playlist);
              await setLocalPlaylist(res.playlist);
              if (res.playlist.preferences?.theme) {
                applyTheme(res.playlist.preferences.theme);
              }
              setSyncState('synced');
              pushToast('Đã đồng bộ tức thì kịch bản mới nhất từ thiết bị khác ⚡', 'info');
              setTimeout(() => {
                isSyncingFromRemote.current = false;
              }, 500);
            }
          } catch {}
        });

        eventSource.onerror = () => {
          eventSource?.close();
          setSyncState('offline');
          reconnectTimer = setTimeout(connectSSE, 4000);
        };
      } catch {
        setSyncState('offline');
        reconnectTimer = setTimeout(connectSSE, 5000);
      }
    }

    connectSSE();

    return () => {
      if (eventSource) eventSource.close();
      clearTimeout(reconnectTimer);
    };
  }, [applyTheme, pushToast]);

  // Auto-save pipeline
  const triggerAutoSave = useCallback((newData: PlaylistData) => {
    setLocalPlaylist(newData);
    setSyncState('saving');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await saveServerPlaylist(newData);
        if (res.ok && res.playlist) {
          setSyncState('synced');
        } else {
          setSyncState('offline');
        }
      } catch {
        setSyncState('offline');
      }
    }, 350);
  }, []);

  const updatePlaylistState = useCallback(
    (updater: (prev: PlaylistData) => PlaylistData) => {
      setPlaylist((prev) => {
        const updated = updater(prev);
        const sortedTracks = sortTracksNaturally(updated.tracks, updated.sections);
        const next: PlaylistData = {
          ...updated,
          tracks: sortedTracks,
          isDefault: false,
          updatedAt: Date.now(),
        };
        triggerAutoSave(next);
        return next;
      });
    },
    [triggerAutoSave]
  );

  const updateMeta = useCallback(
    (patch: Partial<WeddingMeta>) => {
      updatePlaylistState((prev) => ({
        ...prev,
        meta: { ...prev.meta, ...patch },
      }));
    },
    [updatePlaylistState]
  );

  const addSection = useCallback(
    (name: string, description: string, tone: SectionTone = 'rose', side: WeddingSide = 'both') => {
      const id = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      updatePlaylistState((prev) => ({
        ...prev,
        sections: [
          ...prev.sections,
          {
            id,
            name,
            description,
            tone,
            side,
            order: prev.sections.length + 1,
          },
        ],
      }));
      pushToast(`Đã thêm giai đoạn "${name}"`, 'success');
    },
    [updatePlaylistState, pushToast]
  );

  const updateSection = useCallback(
    (id: string, patch: Partial<Section>) => {
      updatePlaylistState((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    [updatePlaylistState]
  );

  const deleteSection = useCallback(
    (id: string) => {
      updatePlaylistState((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== id),
        tracks: prev.tracks.filter((t) => t.sectionId !== id),
      }));
      pushToast('Đã xóa giai đoạn tiệc', 'info');
    },
    [updatePlaylistState, pushToast]
  );

  const reorderSections = useCallback(
    (newSections: Section[]) => {
      const reindexed = newSections.map((s, index) => ({ ...s, order: index + 1 }));
      updatePlaylistState((prev) => ({
        ...prev,
        sections: reindexed,
      }));
    },
    [updatePlaylistState]
  );

  const addTrack = useCallback(
    (track: Omit<Track, 'id' | 'createdAt' | 'order'>) => {
      const id = `trk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      updatePlaylistState((prev) => {
        const sectionTracks = prev.tracks.filter((t) => t.sectionId === track.sectionId);
        const newTrack: Track = {
          ...track,
          side: track.side || 'both',
          id,
          createdAt: Date.now(),
          order: sectionTracks.length + 1,
        };
        return {
          ...prev,
          tracks: [...prev.tracks, newTrack],
        };
      });
      const sideName = track.side === 'groom' ? 'Nhà Trai' : track.side === 'bride' ? 'Nhà Gái' : 'Cả Hai Bên';
      pushToast(`Đã thêm bài hát "${track.title}" vào bên [${sideName}]`, 'success');
    },
    [updatePlaylistState, pushToast]
  );

  const addMultipleTracks = useCallback(
    (newTracksList: Array<Omit<Track, 'id' | 'createdAt' | 'order'>>) => {
      updatePlaylistState((prev) => {
        const created: Track[] = newTracksList.map((t, idx) => ({
          ...t,
          side: t.side || 'both',
          id: `trk_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 6)}`,
          createdAt: Date.now() + idx,
          order: prev.tracks.length + idx + 1,
        }));
        return {
          ...prev,
          tracks: [...prev.tracks, ...created],
        };
      });
      pushToast(`Đã nạp thành công ${newTracksList.length} bài hát`, 'success');
    },
    [updatePlaylistState, pushToast]
  );

  const updateTrack = useCallback(
    (id: string, patch: Partial<Track>) => {
      updatePlaylistState((prev) => ({
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      }));
    },
    [updatePlaylistState]
  );

  const deleteTrack = useCallback(
    (id: string) => {
      updatePlaylistState((prev) => ({
        ...prev,
        tracks: prev.tracks.filter((t) => t.id !== id),
      }));
      pushToast('Đã xóa bài hát khỏi danh sách', 'info');
    },
    [updatePlaylistState, pushToast]
  );

  const reorderTracks = useCallback(
    (sectionId: string, newSectionTracks: Track[]) => {
      updatePlaylistState((prev) => {
        const otherTracks = prev.tracks.filter((t) => t.sectionId !== sectionId);
        const reindexed = newSectionTracks.map((t, index) => ({ ...t, order: index + 1 }));
        return {
          ...prev,
          tracks: [...otherTracks, ...reindexed],
        };
      });
    },
    [updatePlaylistState]
  );

  const moveTrack = useCallback(
    (trackId: string, targetSectionId: string) => {
      updatePlaylistState((prev) => {
        const targetTrack = prev.tracks.find((t) => t.id === trackId);
        if (!targetTrack) return prev;

        const targetSec = prev.sections.find((s) => s.id === targetSectionId);
        const targetSectionTracks = prev.tracks.filter((t) => t.sectionId === targetSectionId);

        const updatedTracks = prev.tracks.map((t) =>
          t.id === trackId
            ? { ...t, sectionId: targetSectionId, order: targetSectionTracks.length + 1 }
            : t
        );

        pushToast(`Đã chuyển bài "${targetTrack.title}" sang giai đoạn "${targetSec?.name || 'mới'}"`, 'success');
        return {
          ...prev,
          tracks: updatedTracks,
        };
      });
    },
    [updatePlaylistState, pushToast]
  );

  const moveTrackOrder = useCallback(
    (trackId: string, direction: 'up' | 'down') => {
      updatePlaylistState((prev) => {
        const targetTrack = prev.tracks.find((t) => t.id === trackId);
        if (!targetTrack) return prev;

        const currentSectionId = targetTrack.sectionId;
        const currentSecTracks = prev.tracks
          .filter((t) => t.sectionId === currentSectionId)
          .sort((a, b) => (a.order || 0) - (b.order || 0));

        const currentIndex = currentSecTracks.findIndex((t) => t.id === trackId);
        if (currentIndex === -1) return prev;

        if (direction === 'up') {
          if (currentIndex === 0) {
            // Check if there is a preceding section to move into
            const sortedSections = [...prev.sections].sort((a, b) => (a.order || 0) - (b.order || 0));
            const secIndex = sortedSections.findIndex((s) => s.id === currentSectionId);
            if (secIndex > 0) {
              const prevSection = sortedSections[secIndex - 1];
              const prevSecTracks = prev.tracks.filter((t) => t.sectionId === prevSection.id);
              const updatedTrack: Track = {
                ...targetTrack,
                sectionId: prevSection.id,
                order: prevSecTracks.length + 1,
              };
              const remainingCurrentTracks = currentSecTracks
                .filter((t) => t.id !== trackId)
                .map((t, idx) => ({ ...t, order: idx + 1 }));

              const otherTracks = prev.tracks.filter(
                (t) => t.sectionId !== currentSectionId && t.id !== trackId
              );

              pushToast(`Đã chuyển bài "${targetTrack.title}" lên mục "${prevSection.name}"`, 'success');
              return {
                ...prev,
                tracks: [...otherTracks, ...remainingCurrentTracks, updatedTrack],
              };
            }
            pushToast(`"${targetTrack.title}" đã ở đầu giai đoạn này`, 'info');
            return prev;
          }

          // Normal swap within same section
          const newSecTracks = [...currentSecTracks];
          const temp = newSecTracks[currentIndex - 1];
          newSecTracks[currentIndex - 1] = newSecTracks[currentIndex];
          newSecTracks[currentIndex] = temp;

          const reindexed = newSecTracks.map((t, idx) => ({ ...t, order: idx + 1 }));
          const otherTracks = prev.tracks.filter((t) => t.sectionId !== currentSectionId);

          return {
            ...prev,
            tracks: [...otherTracks, ...reindexed],
          };
        } else {
          // direction === 'down'
          if (currentIndex === currentSecTracks.length - 1) {
            // Check if there is a next section to move into
            const sortedSections = [...prev.sections].sort((a, b) => (a.order || 0) - (b.order || 0));
            const secIndex = sortedSections.findIndex((s) => s.id === currentSectionId);
            if (secIndex < sortedSections.length - 1) {
              const nextSection = sortedSections[secIndex + 1];
              const nextSecTracks = prev.tracks
                .filter((t) => t.sectionId === nextSection.id)
                .sort((a, b) => (a.order || 0) - (b.order || 0))
                .map((t, idx) => ({ ...t, order: idx + 2 }));

              const updatedTrack: Track = {
                ...targetTrack,
                sectionId: nextSection.id,
                order: 1,
              };
              const remainingCurrentTracks = currentSecTracks
                .filter((t) => t.id !== trackId)
                .map((t, idx) => ({ ...t, order: idx + 1 }));

              const otherTracks = prev.tracks.filter(
                (t) => t.sectionId !== currentSectionId && t.sectionId !== nextSection.id
              );

              pushToast(`Đã chuyển bài "${targetTrack.title}" xuống mục "${nextSection.name}"`, 'success');
              return {
                ...prev,
                tracks: [...otherTracks, ...remainingCurrentTracks, updatedTrack, ...nextSecTracks],
              };
            }
            pushToast(`"${targetTrack.title}" đã ở cuối giai đoạn này`, 'info');
            return prev;
          }

          // Normal swap with next track
          const newSecTracks = [...currentSecTracks];
          const temp = newSecTracks[currentIndex + 1];
          newSecTracks[currentIndex + 1] = newSecTracks[currentIndex];
          newSecTracks[currentIndex] = temp;

          const reindexed = newSecTracks.map((t, idx) => ({ ...t, order: idx + 1 }));
          const otherTracks = prev.tracks.filter((t) => t.sectionId !== currentSectionId);

          return {
            ...prev,
            tracks: [...otherTracks, ...reindexed],
          };
        }
      });
    },
    [updatePlaylistState, pushToast]
  );

  const moveTrackToIndex = useCallback(
    (trackId: string, targetSectionId: string, targetIndex: number) => {
      updatePlaylistState((prev) => {
        const targetTrack = prev.tracks.find((t) => t.id === trackId);
        if (!targetTrack) return prev;

        if (targetTrack.sectionId === targetSectionId) {
          const secTracks = prev.tracks
            .filter((t) => t.sectionId === targetSectionId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const filtered = secTracks.filter((t) => t.id !== trackId);
          const safeIndex = Math.max(0, Math.min(targetIndex, filtered.length));
          filtered.splice(safeIndex, 0, targetTrack);
          const reindexed = filtered.map((t, idx) => ({ ...t, order: idx + 1 }));
          const otherTracks = prev.tracks.filter((t) => t.sectionId !== targetSectionId);

          return {
            ...prev,
            tracks: [...otherTracks, ...reindexed],
          };
        } else {
          const oldSecTracks = prev.tracks
            .filter((t) => t.sectionId === targetTrack.sectionId && t.id !== trackId)
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((t, idx) => ({ ...t, order: idx + 1 }));

          const newSecTracks = prev.tracks
            .filter((t) => t.sectionId === targetSectionId)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          const updatedTrack: Track = { ...targetTrack, sectionId: targetSectionId };
          const safeIndex = Math.max(0, Math.min(targetIndex, newSecTracks.length));
          newSecTracks.splice(safeIndex, 0, updatedTrack);
          const reindexedNew = newSecTracks.map((t, idx) => ({ ...t, order: idx + 1 }));

          const otherTracks = prev.tracks.filter(
            (t) => t.sectionId !== targetTrack.sectionId && t.sectionId !== targetSectionId
          );

          const targetSec = prev.sections.find((s) => s.id === targetSectionId);
          pushToast(`Đã chuyển bài "${targetTrack.title}" sang mục "${targetSec?.name || 'mới'}"`, 'success');

          return {
            ...prev,
            tracks: [...otherTracks, ...oldSecTracks, ...reindexedNew],
          };
        }
      });
    },
    [updatePlaylistState, pushToast]
  );

  const setTheme = useCallback(
    (theme: AppTheme) => {
      applyTheme(theme);
      updatePlaylistState((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, theme },
      }));
    },
    [applyTheme, updatePlaylistState]
  );

  const setPreferences = useCallback(
    (patch: Partial<Preferences>) => {
      updatePlaylistState((prev) => ({
        ...prev,
        preferences: { ...prev.preferences, ...patch },
      }));
    },
    [updatePlaylistState]
  );

  const exportProject = useCallback(() => {
    const jsonStr = JSON.stringify(playlist, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeDate = playlist.meta.date.replace(/[^0-9-]/g, '') || 'wedding';
    a.href = url;
    a.download = `DuyenCa_${playlist.meta.couple.replace(/\s+/g, '_')}_${safeDate}.duyenca`;
    a.click();
    URL.revokeObjectURL(url);
    pushToast('Đã xuất tệp kịch bản đám cưới thành công (.duyenca)', 'success');
  }, [playlist, pushToast]);

  const importProject = useCallback(
    (imported: PlaylistData) => {
      if (!imported || !imported.meta || !Array.isArray(imported.sections)) {
        pushToast('Tệp không đúng định dạng kịch bản Duyên Ca', 'error');
        return;
      }
      updatePlaylistState(() => imported);
      if (imported.preferences?.theme) {
        applyTheme(imported.preferences.theme);
      }
      pushToast('Đã nạp thành công toàn bộ kịch bản đám cưới!', 'success');
    },
    [updatePlaylistState, applyTheme, pushToast]
  );

  const refreshFromServer = useCallback(async () => {
    setSyncState('saving');
    const res = await fetchServerPlaylist();
    if (res.ok && res.playlist) {
      setPlaylist(res.playlist);
      await setLocalPlaylist(res.playlist);
      setSyncState('synced');
      pushToast('Đã làm mới dữ liệu từ máy chủ', 'success');
    } else {
      setSyncState('offline');
      pushToast('Không thể kết nối máy chủ để làm mới', 'error');
    }
  }, [pushToast]);

  return (
    <PlaylistContext.Provider
      value={{
        playlist,
        syncState,
        clientCount,
        activeSideView,
        setActiveSideView,
        updateMeta,
        addSection,
        updateSection,
        deleteSection,
        reorderSections,
        addTrack,
        addMultipleTracks,
        updateTrack,
        deleteTrack,
        reorderTracks,
        moveTrack,
        moveTrackOrder,
        moveTrackToIndex,
        setTheme,
        setPreferences,
        exportProject,
        importProject,
        refreshFromServer,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be used within PlaylistProvider');
  return ctx;
}
