import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import type { Track, PlaybackMode } from '../types';
import { usePlaylist } from './playlistContext';
import { useToast } from './toastContext';

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

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeIntervalRef = useRef<any>(null);
  const currentTrackRef = useRef<Track | null>(null);
  const modeRef = useRef<PlaybackMode>('clip');
  const autoNextRef = useRef<boolean>(playlist.preferences.autoNext ?? true);

  currentTrackRef.current = currentTrack;
  modeRef.current = mode;
  autoNextRef.current = playlist.preferences.autoNext ?? true;

  // Initialize Audio element once
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onWaiting = () => setLoading(true);
    const onCanPlay = () => setLoading(false);

    const onTimeUpdate = () => {
      if (!audio) return;
      const cur = audio.currentTime;
      setCurrentTime(cur);

      // Check clip trim boundary
      const track = currentTrackRef.current;
      const currentMode = modeRef.current;

      if (track && currentMode === 'clip' && track.trimEnd && track.trimEnd > track.trimStart) {
        if (cur >= track.trimEnd) {
          // Clip finished
          if (audio.loop) {
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
      if (Number.isFinite(dur)) {
        setDuration(dur);
      }
      setLoading(false);
    };

    const onEnded = () => {
      handleTrackEnded();
    };

    const onError = () => {
      setLoading(false);
      setIsPlaying(false);
      pushToast('Không thể phát tệp âm thanh. Vui lòng kiểm tra lại nguồn tệp.', 'error');
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
    if (!audioRef.current) return;
    if (muted) {
      audioRef.current.volume = 0;
      return;
    }
    // Gain offset: e.g. -5 to +5 -> multiplier
    const offsetFactor = Math.pow(10, trackOffset / 20);
    const targetVol = Math.max(0, Math.min(1, vol * offsetFactor));
    audioRef.current.volume = targetVol;
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

  // Play track
  const playTrack = useCallback((track: Track, forceMode?: PlaybackMode) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    const useMode = forceMode ?? mode;
    setCurrentTrack(track);
    setLoading(true);

    const sourceUrl = track.audioId ? `/api/audio/${track.audioId}` : track.url;
    if (audio.src !== sourceUrl) {
      audio.src = sourceUrl;
      audio.load();
    }

    // Set start position
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
        console.warn('Playback blocked or failed:', err);
      });
  }, [mode, volume, isMuted, applyAudioVolume]);

  const togglePlay = useCallback(() => {
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
  }, [isPlaying, currentTrack, playlist.tracks, playTrack]);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    const startPos = mode === 'clip' && currentTrack ? (currentTrack.trimStart || 0) : 0;
    audio.currentTime = startPos;
    setCurrentTime(startPos);
    setIsPlaying(false);
  }, [mode, currentTrack]);

  const fadeStop = useCallback((durationSeconds = 2) => {
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
  }, [isPlaying, volume, isMuted, currentTrack, applyAudioVolume]);

  const seek = useCallback((seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  }, []);

  const toggleLoop = useCallback(() => {
    setLoop((prev) => {
      const next = !prev;
      if (audioRef.current) {
        audioRef.current.loop = next;
      }
      return next;
    });
  }, []);

  // Track next / prev in current section or playlist
  const nextTrack = useCallback(() => {
    if (!currentTrack || playlist.tracks.length === 0) return;
    // Prefer next track in the same section
    const currentSectionTracks = playlist.tracks.filter((t) => t.sectionId === currentTrack.sectionId);
    const currentIndex = currentSectionTracks.findIndex((t) => t.id === currentTrack.id);

    if (currentIndex >= 0 && currentIndex < currentSectionTracks.length - 1) {
      playTrack(currentSectionTracks[currentIndex + 1]);
      return;
    }

    // Otherwise next in global playlist
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

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
