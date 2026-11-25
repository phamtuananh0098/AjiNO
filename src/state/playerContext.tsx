import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Track, PlaybackMode, ActiveEngine } from '../types';
import { usePlaylist } from './playlistContext';
import { useToast } from './toastContext';
import {
  extractYoutubeId,
  extractDriveFileId,
  extractSoundcloudUrl,
  extractSpotifyTrackId,
  isDirectAudioUrl,
} from '../services/linkDetector';

export function getGoogleDriveDirectStreamUrl(fileId: string): string {
  return `https://drive.usercontent.google.com/download?id=${fileId}&export=download&confirm=t`;
}

export function resolvePlayableAudioUrl(track: Track): string {
  if (track.audioId) {
    return `/api/audio/${track.audioId}`;
  }
  const driveId = extractDriveFileId(track.url);
  if (driveId) {
    return getGoogleDriveDirectStreamUrl(driveId);
  }
  return track.url;
}

export interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  mode: PlaybackMode;
  loop: boolean;
  loading: boolean;
  activeEngine: ActiveEngine;
  youtubeId: string | null;
  gdriveId: string | null;
  soundcloudUrl: string | null;
  spotifyId: string | null;
  playTrack: (track: Track, forceMode?: PlaybackMode) => void;
  togglePlay: () => void;
  pause: () => void;
  stop: () => void;
  seek: (seconds: number) => void;
  setVolume: (val: number) => void;
  toggleMute: () => void;
  setMode: (mode: PlaybackMode) => void;
  toggleLoop: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  fadeStop: (durationSeconds?: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

function sendYtCommand(func: string, args: any = '') {
  const iframe = document.getElementById('duyen-ca-console-yt-player') as HTMLIFrameElement | null;
  if (!iframe || !iframe.contentWindow) return;
  const payload = JSON.stringify({
    event: 'command',
    func,
    args: args !== '' ? (Array.isArray(args) ? args : [args]) : '',
  });
  iframe.contentWindow.postMessage(payload, '*');
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { playlist } = usePlaylist();
  const { pushToast } = useToast();

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [volume, setVolumeState] = useState<number>(playlist.preferences.volume ?? 0.85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [mode, setMode] = useState<PlaybackMode>('clip');
  const [loop, setLoop] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // Playback Engines
  const [activeEngine, setActiveEngine] = useState<ActiveEngine>('audio');
  const [youtubeId, setYoutubeId] = useState<string | null>(null);
  const [gdriveId, setGdriveId] = useState<string | null>(null);
  const [soundcloudUrl, setSoundcloudUrl] = useState<string | null>(null);
  const [spotifyId, setSpotifyId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any>(null);
  const tickerTimerRef = useRef<any>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const modeRef = useRef<PlaybackMode>('clip');
  const loopRef = useRef<boolean>(false);
  const autoNextRef = useRef<boolean>(playlist.preferences.autoNext ?? true);
  const nextTrackRef = useRef<() => void>(() => {});
  const handleTrackEndedRef = useRef<() => void>(() => {});

  currentTrackRef.current = currentTrack;
  modeRef.current = mode;
  loopRef.current = loop;
  autoNextRef.current = playlist.preferences.autoNext ?? true;

  // Clear ticker timer
  const stopTicker = useCallback(() => {
    if (tickerTimerRef.current) {
      clearInterval(tickerTimerRef.current);
      tickerTimerRef.current = null;
    }
  }, []);

  // Universal ticker for non-HTML5 engines (YouTube, Drive, SoundCloud, Spotify)
  const startTicker = useCallback(
    (startSec: number, targetTrack: Track, onTick?: (cur: number) => void) => {
      stopTicker();
      let cur = startSec;
      setCurrentTime(cur);

      tickerTimerRef.current = setInterval(() => {
        cur += 0.5;
        setCurrentTime(cur);
        if (onTick) onTick(cur);

        const currentMode = modeRef.current;
        if (currentMode === 'clip' && targetTrack.trimEnd && targetTrack.trimEnd > targetTrack.trimStart) {
          if (cur >= targetTrack.trimEnd) {
            if (loopRef.current) {
              cur = targetTrack.trimStart || 0;
              setCurrentTime(cur);
              sendYtCommand('seekTo', [cur, true]);
              sendYtCommand('playVideo');
            } else {
              sendYtCommand('pauseVideo');
              setIsPlaying(false);
              stopTicker();
              if (autoNextRef.current) {
                handleTrackEndedRef.current();
              }
            }
          }
        }
      }, 500);
    },
    [stopTicker]
  );

  // Initialize HTML5 Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => {
      setLoading(false);
      const track = currentTrackRef.current;
      const currentMode = modeRef.current;
      if (track && currentMode === 'clip' && track.trimStart > 0) {
        if (Math.abs(audio.currentTime - track.trimStart) > 0.5) {
          audio.currentTime = track.trimStart;
        }
      }
    };

    const onTimeUpdate = () => {
      if (!audio) return;
      const cur = audio.currentTime;
      setCurrentTime(cur);

      const track = currentTrackRef.current;
      const currentMode = modeRef.current;
      if (track && currentMode === 'clip' && track.trimEnd && track.trimEnd > track.trimStart) {
        if (cur >= track.trimEnd) {
          if (audio.loop || loopRef.current) {
            audio.currentTime = track.trimStart || 0;
            audio.play().catch(() => {});
          } else {
            handleTrackEndedRef.current();
          }
        }
      }
    };

    const onLoadedMetadata = () => {
      if (!audio) return;
      const dur = audio.duration;
      if (Number.isFinite(dur) && dur > 0) {
        setDuration(dur);
      }
      const track = currentTrackRef.current;
      const currentMode = modeRef.current;
      if (track && currentMode === 'clip' && track.trimStart > 0) {
        audio.currentTime = track.trimStart;
      }
      setLoading(false);
    };

    const onEnded = () => {
      handleTrackEndedRef.current();
    };

    // Resilient fallback when direct HTML5 audio fails
    const onError = () => {
      setLoading(false);
      setIsPlaying(false);
      const track = currentTrackRef.current;
      if (!track) return;

      // 1. If Google Drive: switch to official Google Drive preview player
      const driveId = extractDriveFileId(track.url);
      if (driveId) {
        console.info('[AudioEngine] Switching to Google Drive Native Preview Player:', driveId);
        setActiveEngine('gdrive');
        setGdriveId(driveId);
        setIsPlaying(true);
        startTicker(modeRef.current === 'clip' ? track.trimStart || 0 : 0, track);
        pushToast(`✨ Đang phát qua Trình phát Google Drive: "${track.title}"`, 'success');
        return;
      }

      // 2. If YouTube: switch to YouTube player
      const ytId = extractYoutubeId(track.url);
      if (ytId) {
        console.info('[AudioEngine] Switching to YouTube Player:', ytId);
        setActiveEngine('youtube');
        setYoutubeId(ytId);
        setIsPlaying(true);
        startTicker(modeRef.current === 'clip' ? track.trimStart || 0 : 0, track);
        return;
      }

      // 3. If Web link (ZingMP3, NCT, etc.): search and play on YouTube embed
      const query = `${track.title} ${track.artist || ''}`.trim();
      if (query) {
        console.info('[AudioEngine] Auto-fallback to YouTube Search stream:', query);
        setActiveEngine('youtube');
        setYoutubeId(`search:${encodeURIComponent(query)}`);
        setIsPlaying(true);
        setDuration(track.duration || 240);
        startTicker(modeRef.current === 'clip' ? track.trimStart || 0 : 0, track);
        pushToast(`✨ Đang mở bài hát qua luồng YouTube: "${track.title}"`, 'success');
        return;
      }

      pushToast('Không thể phát tệp âm thanh này. Vui lòng kiểm tra lại liên kết nguồn.', 'error');
    };

    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
    };
  }, [pushToast, startTicker]);

  // Adjust volume
  const applyAudioVolume = useCallback((vol: number, muted: boolean, trackOffset = 0) => {
    if (muted) {
      if (audioRef.current) audioRef.current.volume = 0;
      sendYtCommand('setVolume', 0);
      return;
    }
    const offsetFactor = Math.pow(10, trackOffset / 20);
    const targetVol = Math.max(0, Math.min(1, vol * offsetFactor));
    if (audioRef.current) audioRef.current.volume = targetVol;
    sendYtCommand('setVolume', Math.round(targetVol * 100));
  }, []);

  const setVolume = useCallback(
    (val: number) => {
      const clamped = Math.max(0, Math.min(1, val));
      setVolumeState(clamped);
      setIsMuted(false);
      applyAudioVolume(clamped, false, currentTrack?.volumeOffset || 0);
    },
    [applyAudioVolume, currentTrack]
  );

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      applyAudioVolume(volume, next, currentTrack?.volumeOffset || 0);
      return next;
    });
  }, [applyAudioVolume, volume, currentTrack]);

  // Universal Playback Function
  const playTrack: (track: Track, forceMode?: PlaybackMode) => void = useCallback(
    (track: Track, forceMode?: PlaybackMode) => {
      const audio = audioRef.current;
      if (fadeIntervalRef.current) {
        clearInterval(fadeIntervalRef.current);
        fadeIntervalRef.current = null;
      }
      stopTicker();

      const useMode = forceMode ?? mode;
      setCurrentTrack(track);
      setLoading(true);

      const startPos = useMode === 'clip' ? track.trimStart || 0 : 0;
      const trackDur = track.duration || 210;
      setCurrentTime(startPos);
      setDuration(trackDur);

      // Setup MediaSession API (for lock screen & headphone controls on iPhone/Android)
      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator) {
        try {
          navigator.mediaSession.metadata = new MediaMetadata({
            title: track.title,
            artist: track.artist || 'Duyên Ca Wedding Studio',
            album: 'Hôn Lễ ' + (playlist.meta.couple || 'Cô Dâu & Chú Rể'),
            artwork: [
              {
                src: track.thumbnail || '/icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
              },
            ],
          });
          navigator.mediaSession.setActionHandler('play', () => togglePlay());
          navigator.mediaSession.setActionHandler('pause', () => togglePlay());
          navigator.mediaSession.setActionHandler('nexttrack', () => nextTrackRef.current());
          navigator.mediaSession.setActionHandler('previoustrack', () => {});
        } catch {}
      }

      // 1. YouTube Engine
      const ytId = extractYoutubeId(track.url);
      if (ytId) {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        setActiveEngine('youtube');
        setGdriveId(null);
        setSoundcloudUrl(null);
        setSpotifyId(null);
        setYoutubeId(ytId);
        setIsPlaying(true);
        setLoading(false);

        setTimeout(() => {
          sendYtCommand('seekTo', [startPos, true]);
          sendYtCommand('playVideo');
          applyAudioVolume(volume, isMuted, track.volumeOffset || 0);
        }, 120);

        startTicker(startPos, track);
        pushToast(`Đang phát đoạn nhạc YouTube: "${track.title}"`, 'success');
        return;
      }

      // 2. SoundCloud Engine
      const scUrl = extractSoundcloudUrl(track.url);
      if (scUrl) {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        setActiveEngine('soundcloud');
        setYoutubeId(null);
        setGdriveId(null);
        setSpotifyId(null);
        setSoundcloudUrl(scUrl);
        setIsPlaying(true);
        setLoading(false);
        startTicker(startPos, track);
        pushToast(`Đang phát nhạc SoundCloud: "${track.title}"`, 'success');
        return;
      }

      // 3. Spotify Engine
      const spotId = extractSpotifyTrackId(track.url);
      if (spotId) {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
        setActiveEngine('spotify');
        setYoutubeId(null);
        setGdriveId(null);
        setSoundcloudUrl(null);
        setSpotifyId(spotId);
        setIsPlaying(true);
        setLoading(false);
        startTicker(startPos, track);
        pushToast(`Đang mở nhạc Spotify: "${track.title}"`, 'success');
        return;
      }

      // 4. Google Drive Audio Engine (High-speed direct CDN streaming)
      const driveId = extractDriveFileId(track.url);
      if (driveId && !track.audioId) {
        setYoutubeId(null);
        sendYtCommand('stopVideo');
        setSoundcloudUrl(null);
        setSpotifyId(null);
        setActiveEngine('audio');
        setGdriveId(null);

        if (!audio) return;

        const directUrl = getGoogleDriveDirectStreamUrl(driveId);
        if (audio.src !== directUrl) {
          audio.src = directUrl;
          audio.load();
        }

        audio.currentTime = startPos;
        applyAudioVolume(volume, isMuted, track.volumeOffset || 0);

        audio
          .play()
          .then(() => {
            setIsPlaying(true);
            setLoading(false);
          })
          .catch((err) => {
            console.warn('[gdrive-direct-error, trying ucUrl]', err);
            const ucUrl = `https://drive.google.com/uc?export=download&id=${driveId}&confirm=t`;
            audio.src = ucUrl;
            audio.load();
            audio.currentTime = startPos;
            audio
              .play()
              .then(() => {
                setIsPlaying(true);
                setLoading(false);
              })
              .catch(() => {
                // Fallback: local/vercel 307 proxy
                const proxyUrl = `/api/gdrive/stream?id=${driveId}`;
                audio.src = proxyUrl;
                audio.load();
                audio.currentTime = startPos;
                audio
                  .play()
                  .then(() => {
                    setIsPlaying(true);
                    setLoading(false);
                  })
                  .catch((finalErr) => {
                    console.error('[gdrive-all-failed]', finalErr);
                    setIsPlaying(false);
                    setLoading(false);
                    pushToast(
                      `Không thể phát tệp Google Drive ("${track.title}"). Vui lòng kiểm tra quyền chia sẻ "Bất kỳ ai có đường liên kết" trên Google Drive!`,
                      'error'
                    );
                  });
              });
          });
        return;
      }

      // 5. Unplayable Web Music Link (ZingMP3, NCT, generic web pages)
      const isDirect = isDirectAudioUrl(track.url) || !!track.audioId;
      if (!isDirect && track.url && /^https?:\/\//i.test(track.url)) {
        const query = `${track.title} ${track.artist || ''}`.trim();
        if (query) {
          if (audio) {
            audio.pause();
            audio.src = '';
          }
          setActiveEngine('youtube');
          setGdriveId(null);
          setSoundcloudUrl(null);
          setSpotifyId(null);
          setYoutubeId(`search:${encodeURIComponent(query)}`);
          setIsPlaying(true);
          setLoading(false);
          startTicker(startPos, track);
          pushToast(`✨ Đang phát bài hát: "${track.title}"`, 'success');
          return;
        }
      }

      // 6. Standard HTML5 Audio (Local / Uploaded / Direct MP3)
      setActiveEngine('audio');
      setYoutubeId(null);
      sendYtCommand('stopVideo');
      setGdriveId(null);
      setSoundcloudUrl(null);
      setSpotifyId(null);

      if (!audio) return;
      const sourceUrl = resolvePlayableAudioUrl(track);
      if (audio.src !== sourceUrl) {
        audio.src = sourceUrl;
        audio.load();
      }

      audio.currentTime = startPos;
      applyAudioVolume(volume, isMuted, track.volumeOffset || 0);

      audio
        .play()
        .then(() => {
          setIsPlaying(true);
          setLoading(false);
        })
        .catch((err) => {
          setLoading(false);
          setIsPlaying(false);
          console.warn('Audio playback error:', err);
        });
    },
    [mode, volume, isMuted, applyAudioVolume, pushToast, playlist.meta.couple, startTicker, stopTicker]
  );

  const togglePlay = useCallback(() => {
    if (activeEngine === 'youtube') {
      if (isPlaying) {
        sendYtCommand('pauseVideo');
        stopTicker();
        setIsPlaying(false);
      } else {
        sendYtCommand('playVideo');
        setIsPlaying(true);
        if (currentTrack) {
          startTicker(currentTime, currentTrack);
        }
      }
      return;
    }

    if (activeEngine === 'gdrive' || activeEngine === 'soundcloud' || activeEngine === 'spotify') {
      if (isPlaying) {
        stopTicker();
        setIsPlaying(false);
      } else {
        setIsPlaying(true);
        if (currentTrack) {
          startTicker(currentTime, currentTrack);
        }
      }
      return;
    }

    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      if (currentTrack) {
        audio.play().catch(() => {});
      } else if (playlist.tracks.length > 0) {
        playTrack(playlist.tracks[0]);
      }
    }
  }, [activeEngine, isPlaying, currentTrack, currentTime, playlist.tracks, playTrack, startTicker, stopTicker]);

  const pause = useCallback(() => {
    if (activeEngine === 'youtube') {
      sendYtCommand('pauseVideo');
      stopTicker();
      setIsPlaying(false);
      return;
    }
    if (activeEngine === 'gdrive' || activeEngine === 'soundcloud' || activeEngine === 'spotify') {
      stopTicker();
      setIsPlaying(false);
      return;
    }
    audioRef.current?.pause();
  }, [activeEngine, stopTicker]);

  const stop = useCallback(() => {
    stopTicker();
    if (activeEngine === 'youtube') {
      sendYtCommand('stopVideo');
      const startPos = mode === 'clip' && currentTrack ? currentTrack.trimStart || 0 : 0;
      setCurrentTime(startPos);
      setIsPlaying(false);
      return;
    }
    if (activeEngine === 'gdrive' || activeEngine === 'soundcloud' || activeEngine === 'spotify') {
      const startPos = mode === 'clip' && currentTrack ? currentTrack.trimStart || 0 : 0;
      setCurrentTime(startPos);
      setIsPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    const startPos = mode === 'clip' && currentTrack ? currentTrack.trimStart || 0 : 0;
    audio.currentTime = startPos;
    setCurrentTime(startPos);
    setIsPlaying(false);
  }, [activeEngine, mode, currentTrack, stopTicker]);

  const fadeStop = useCallback(
    (durationSeconds = 2) => {
      if (activeEngine !== 'audio') {
        stop();
        return;
      }
      const audio = audioRef.current;
      if (!audio || !isPlaying) return;

      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

      const steps = 20;
      const stepTime = (durationSeconds * 1000) / steps;
      const startVolume = audio.volume;
      let stepCount = 0;

      fadeIntervalRef.current = setInterval(() => {
        stepCount++;
        const nextVol = Math.max(0, startVolume * (1 - stepCount / steps));
        audio.volume = nextVol;

        if (stepCount >= steps) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
          audio.pause();
          setIsPlaying(false);
          applyAudioVolume(volume, isMuted, currentTrack?.volumeOffset || 0);
        }
      }, stepTime);
    },
    [activeEngine, isPlaying, volume, isMuted, currentTrack, applyAudioVolume, stop]
  );

  const seek = useCallback(
    (seconds: number) => {
      const clamped = Math.max(0, Math.min(seconds, duration || 9999));
      setCurrentTime(clamped);
      if (activeEngine === 'youtube') {
        sendYtCommand('seekTo', [clamped, true]);
        return;
      }
      if (activeEngine === 'audio' && audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
    },
    [activeEngine, duration]
  );

  const toggleLoop = useCallback(() => {
    setLoop((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const nextTrack: () => void = useCallback(() => {
    if (!currentTrack || playlist.tracks.length === 0) return;
    const currentSectionTracks = playlist.tracks.filter((t) => t.sectionId === currentTrack.sectionId);
    const currentIndex = currentSectionTracks.findIndex((t) => t.id === currentTrack.id);

    if (currentIndex >= 0 && currentIndex < currentSectionTracks.length - 1) {
      playTrack(currentSectionTracks[currentIndex + 1]);
      return;
    }

    const globalIndex = playlist.tracks.findIndex((t) => t.id === currentTrack.id);
    if (globalIndex >= 0 && globalIndex < playlist.tracks.length - 1) {
      playTrack(playlist.tracks[globalIndex + 1]);
    } else if (loop) {
      playTrack(playlist.tracks[0]);
    } else {
      stop();
    }
  }, [currentTrack, playlist.tracks, loop, playTrack, stop]);

  const prevTrack: () => void = useCallback(() => {
    if (!currentTrack || playlist.tracks.length === 0) return;
    const currentSectionTracks = playlist.tracks.filter((t) => t.sectionId === currentTrack.sectionId);
    const currentIndex = currentSectionTracks.findIndex((t) => t.id === currentTrack.id);

    if (currentIndex > 0) {
      playTrack(currentSectionTracks[currentIndex - 1]);
      return;
    }

    const globalIndex = playlist.tracks.findIndex((t) => t.id === currentTrack.id);
    if (globalIndex > 0) {
      playTrack(playlist.tracks[globalIndex - 1]);
    }
  }, [currentTrack, playlist.tracks, playTrack]);

  const handleTrackEnded = useCallback(() => {
    if (loop && currentTrackRef.current) {
      playTrack(currentTrackRef.current);
      return;
    }
    if (autoNextRef.current) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  }, [loop, playTrack, nextTrack]);

  nextTrackRef.current = nextTrack;
  handleTrackEndedRef.current = handleTrackEnded;

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        mode,
        loop,
        loading,
        activeEngine,
        youtubeId,
        gdriveId,
        soundcloudUrl,
        spotifyId,
        playTrack,
        togglePlay,
        pause,
        stop,
        seek,
        setVolume,
        toggleMute,
        setMode,
        toggleLoop,
        nextTrack,
        prevTrack,
        fadeStop,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextType {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
