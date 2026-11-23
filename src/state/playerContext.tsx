import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Track, PlaybackMode } from '../types';
import { usePlaylist } from './playlistContext';
import { useToast } from './toastContext';
import { extractDriveFileId } from '../services/linkDetector';

export function resolvePlayableAudioUrl(track: Track): string {
  if (track.audioId) {
    return `/api/audio/${track.audioId}`;
  }
  const driveId = extractDriveFileId(track.url);
  if (driveId) {
    return `/api/gdrive/stream?id=${driveId}`;
  }
  return track.url;
}

interface PlayerContextType {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  mode: PlaybackMode;
  loop: boolean;
  loading: boolean;
  youtubeId: string | null;
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

function extractYoutubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
  return m ? m[1] : null;
}

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
  const [youtubeId, setYoutubeId] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any>(null);
  const ytTimerRef = useRef<any>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const modeRef = useRef<PlaybackMode>('clip');
  const loopRef = useRef<boolean>(false);
  const autoNextRef = useRef<boolean>(playlist.preferences.autoNext ?? true);

  currentTrackRef.current = currentTrack;
  modeRef.current = mode;
  loopRef.current = loop;
  autoNextRef.current = playlist.preferences.autoNext ?? true;

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

      // Check clip trim boundary
      const track = currentTrackRef.current;
      const currentMode = modeRef.current;

      if (track && currentMode === 'clip' && track.trimEnd && track.trimEnd > track.trimStart) {
        if (cur >= track.trimEnd) {
          if (audio.loop || loopRef.current) {
            audio.currentTime = track.trimStart || 0;
            audio.play().catch(() => {});
          } else {
            handleTrackEnded();
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
      handleTrackEnded();
    };

    const onError = () => {
      setLoading(false);
      setIsPlaying(false);
      const track = currentTrackRef.current;
      if (!track) return;
      if (extractYoutubeId(track.url)) return;

      const driveId = extractDriveFileId(track.url);
      if (driveId && audio && !audio.src.includes('drive.usercontent.google.com')) {
        // Fallback directly to Google Drive user content endpoint
        const directUrl = `https://drive.usercontent.google.com/download?id=${driveId}&export=download&confirm=t`;
        audio.src = directUrl;
        audio.load();
        audio.play().then(() => {
          setIsPlaying(true);
        }).catch(() => {
          pushToast(
            'Không thể tải tệp nhạc từ Google Drive. Vui lòng đảm bảo tệp đã bật "Bất kỳ ai có đường liên kết đều có thể xem".',
            'error'
          );
        });
        return;
      }

      pushToast('Không thể phát tệp âm thanh này. Vui lòng kiểm tra lại nguồn phát.', 'error');
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
  }, [pushToast]);

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

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    setIsMuted(false);
    applyAudioVolume(clamped, false, currentTrack?.volumeOffset || 0);
  }, [applyAudioVolume, currentTrack]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      applyAudioVolume(volume, next, currentTrack?.volumeOffset || 0);
      return next;
    });
  }, [applyAudioVolume, volume, currentTrack]);

  // Play track (supports Local, Google Drive, and YouTube)
  const playTrack = useCallback((track: Track, forceMode?: PlaybackMode) => {
    const audio = audioRef.current;
    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }
    if (ytTimerRef.current) {
      clearInterval(ytTimerRef.current);
      ytTimerRef.current = null;
    }

    const useMode = forceMode ?? mode;
    setCurrentTrack(track);
    setLoading(true);

    const sourceUrl = resolvePlayableAudioUrl(track);
    const ytId = extractYoutubeId(track.url);

    if (ytId) {
      // 1. YouTube Playback Engine
      if (audio) {
        audio.pause();
        audio.src = '';
      }

      setYoutubeId(ytId);
      const startPos = useMode === 'clip' ? (track.trimStart || 0) : 0;
      const trackDur = track.duration || 240;
      setCurrentTime(startPos);
      setDuration(trackDur);
      setIsPlaying(true);
      setLoading(false);

      // Tell YouTube iframe to seek and play
      setTimeout(() => {
        sendYtCommand('seekTo', [startPos, true]);
        sendYtCommand('playVideo');
        applyAudioVolume(volume, isMuted, track.volumeOffset || 0);
      }, 100);

      // Start ticker to track YouTube playback and handle clip boundaries
      let cur = startPos;
      ytTimerRef.current = setInterval(() => {
        cur += 0.5;
        setCurrentTime(cur);

        // Clip boundary check
        if (useMode === 'clip' && track.trimEnd && track.trimEnd > track.trimStart) {
          if (cur >= track.trimEnd) {
            if (loopRef.current) {
              cur = track.trimStart || 0;
              setCurrentTime(cur);
              sendYtCommand('seekTo', [cur, true]);
              sendYtCommand('playVideo');
            } else {
              sendYtCommand('pauseVideo');
              setIsPlaying(false);
              clearInterval(ytTimerRef.current);
              ytTimerRef.current = null;
              if (autoNextRef.current) {
                nextTrack();
              }
            }
          }
        }
      }, 500);

      pushToast(`Đang phát đoạn nhạc YouTube: "${track.title}"`, 'success');
      return;
    }

    // 2. Standard Audio / Google Drive / Local Engine
    setYoutubeId(null);
    sendYtCommand('stopVideo');

    if (!audio) return;
    if (audio.src !== sourceUrl) {
      audio.src = sourceUrl;
      audio.load();
    }

    const startPos = useMode === 'clip' ? (track.trimStart || 0) : 0;
    audio.currentTime = startPos;
    setCurrentTime(startPos);
    setDuration(track.duration || 0);

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
  }, [mode, volume, isMuted, applyAudioVolume, pushToast]);

  const togglePlay = useCallback(() => {
    if (youtubeId) {
      if (isPlaying) {
        sendYtCommand('pauseVideo');
        if (ytTimerRef.current) clearInterval(ytTimerRef.current);
        setIsPlaying(false);
      } else {
        sendYtCommand('playVideo');
        setIsPlaying(true);
        // resume ticker
        if (!ytTimerRef.current) {
          ytTimerRef.current = setInterval(() => {
            setCurrentTime((prev) => prev + 0.5);
          }, 500);
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
  }, [isPlaying, youtubeId, currentTrack, playlist.tracks, playTrack]);

  const pause = useCallback(() => {
    if (youtubeId) {
      sendYtCommand('pauseVideo');
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      setIsPlaying(false);
      return;
    }
    audioRef.current?.pause();
  }, [youtubeId]);

  const stop = useCallback(() => {
    if (youtubeId) {
      sendYtCommand('stopVideo');
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      const startPos = mode === 'clip' && currentTrack ? (currentTrack.trimStart || 0) : 0;
      setCurrentTime(startPos);
      setIsPlaying(false);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    const startPos = mode === 'clip' && currentTrack ? (currentTrack.trimStart || 0) : 0;
    audio.currentTime = startPos;
    setCurrentTime(startPos);
    setIsPlaying(false);
  }, [youtubeId, mode, currentTrack]);

  const fadeStop = useCallback((durationSeconds = 2) => {
    if (youtubeId) {
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
  }, [youtubeId, isPlaying, volume, isMuted, currentTrack, applyAudioVolume, stop]);

  const seek = useCallback((seconds: number) => {
    if (youtubeId) {
      sendYtCommand('seekTo', [seconds, true]);
      setCurrentTime(seconds);
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, [youtubeId]);

  const toggleLoop = useCallback(() => {
    setLoop((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.loop = next;
      }
      return next;
    });
  }, []);

  const nextTrack = useCallback(() => {
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

  const prevTrack = useCallback(() => {
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

  const handleTrackEnded = () => {
    if (loop && currentTrackRef.current) {
      playTrack(currentTrackRef.current);
      return;
    }
    if (autoNextRef.current) {
      nextTrack();
    } else {
      setIsPlaying(false);
    }
  };

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
        youtubeId,
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
