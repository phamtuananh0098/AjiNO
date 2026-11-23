import React, { useState, useEffect, useMemo } from 'react';
import { usePlayer } from '../state/playerContext';
import { usePlaylist } from '../state/playlistContext';
import {
  PlayIcon,
  PauseIcon,
  StopIcon,
  SkipNextIcon,
  SkipPrevIcon,
  ScissorsIcon,
  LoopIcon,
  SparklesIcon,
} from './common/Icons';

interface TVStageViewProps {
  onExitTv: () => void;
}

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const TVStageView: React.FC<TVStageViewProps> = ({ onExitTv }) => {
  const { playlist } = usePlaylist();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    mode,
    loop,
    loading,
    togglePlay,
    stop,
    nextTrack,
    prevTrack,
    fadeStop,
    setMode,
    toggleLoop,
  } = usePlayer();

  const [clock, setClock] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Live Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setClock(
        now.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts (Space, Arrows, F, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        nextTrack();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        prevTrack();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'Escape') {
        if (!document.fullscreenElement) {
          onExitTv();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, nextTrack, prevTrack, onExitTv]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  // Current Section
  const currentSection = useMemo(() => {
    if (!currentTrack) return null;
    return playlist.sections.find((s) => s.id === currentTrack.sectionId);
  }, [currentTrack, playlist.sections]);

  // Upcoming Track
  const nextTrackInfo = useMemo(() => {
    if (!currentTrack || playlist.tracks.length === 0) return null;
    const idx = playlist.tracks.findIndex((t) => t.id === currentTrack.id);
    if (idx >= 0 && idx < playlist.tracks.length - 1) {
      return playlist.tracks[idx + 1];
    }
    return playlist.tracks[0] || null;
  }, [currentTrack, playlist.tracks]);

  const total = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, (currentTime / total) * 100);

  const coupleName = playlist.meta.couple || 'Cô Dâu & Chú Rể';
  const weddingDate = playlist.meta.date
    ? new Date(playlist.meta.date).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : '';

  return (
    <div className="tv-stage-view">
      {/* Background Ambient Glow */}
      <div
        className={`tv-stage-glow tv-stage-glow--${
          currentTrack?.side === 'groom'
            ? 'groom'
            : currentTrack?.side === 'bride'
            ? 'bride'
            : 'both'
        }`}
      />

      {/* Top Header Bar */}
      <header className="tv-stage-header">
        <div className="tv-header-left">
          <div className="tv-logo-tag">
            <SparklesIcon className="w-5 h-5 text-amber-400" />
            <span>DUYÊN CA · SÂN KHẤU TIỆC CƯỚI</span>
          </div>
          <h1 className="tv-couple-title">{coupleName}</h1>
          {weddingDate && <span className="tv-wedding-date">{weddingDate}</span>}
        </div>

        <div className="tv-header-right">
          <div className="tv-digital-clock" title="Thời gian hiện tại">
            {clock}
          </div>

          <button
            type="button"
            className="tv-action-pill"
            onClick={toggleFullscreen}
            title="Bật/Tắt toàn màn hình (Phím F)"
          >
            <span>{isFullscreen ? '⤢ Thu Nhỏ' : '⤢ Toàn Màn Hình'}</span>
          </button>

          <button
            type="button"
            className="tv-exit-pill"
            onClick={onExitTv}
            title="Thoát chế độ TV về giao diện máy tính (Phím Esc)"
          >
            <span>✕ Thoát TV</span>
          </button>
        </div>
      </header>

      {/* Main Center Stage */}
      <main className="tv-stage-main">
        {currentTrack ? (
          <div className="tv-main-grid">
            {/* Left: Vinyl Disc & Cover */}
            <div className="tv-vinyl-column">
              <div className={`tv-vinyl-disc ${isPlaying ? 'tv-vinyl-disc--spinning' : ''}`}>
                <div className="tv-vinyl-grooves" />
                {currentTrack.thumbnail ? (
                  <img
                    src={currentTrack.thumbnail}
                    alt={currentTrack.title}
                    className="tv-vinyl-thumb"
                  />
                ) : (
                  <div className="tv-vinyl-placeholder">💍</div>
                )}
                <div className="tv-vinyl-center-pin" />
              </div>

              {/* Animated Equalizer Waveform Bars */}
              <div className={`tv-equalizer-bars ${isPlaying ? 'active' : ''}`}>
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
                <span className="bar" />
              </div>
            </div>

            {/* Center: Track Info & CUE Banner */}
            <div className="tv-info-column">
              <div className="tv-side-badge-row">
                <span
                  className={`tv-side-tag tv-side-tag--${currentTrack.side || 'both'}`}
                >
                  {currentTrack.side === 'groom' && '🤵 HỌ NHÀ TRAI'}
                  {currentTrack.side === 'bride' && '👰 HỌ NHÀ GÁI'}
                  {(currentTrack.side === 'both' || !currentTrack.side) && '💍 CHUNG CẢ HAI NHÀ'}
                </span>

                {currentSection && (
                  <span className={`tv-section-tag tone-pill--${currentSection.tone}`}>
                    {currentSection.name}
                  </span>
                )}

                <span className="tv-mode-badge">
                  {mode === 'clip' ? '✂ PHÁT ĐOẠN CẮT' : '▶ PHÁT TOÀN BÀI'}
                </span>
              </div>

              <h2 className="tv-track-title">{currentTrack.title}</h2>
              {currentTrack.artist && (
                <div className="tv-track-artist">{currentTrack.artist}</div>
              )}

              {/* Giant MC CUE Banner */}
              {currentTrack.note ? (
                <div className="tv-cue-box">
                  <div className="tv-cue-badge">⚡ GHI CHÚ CUE CHO MC / DJ:</div>
                  <div className="tv-cue-text">{currentTrack.note}</div>
                </div>
              ) : (
                <div className="tv-cue-box tv-cue-box--auto">
                  <div className="tv-cue-badge">⚡ THỜI ĐIỂM:</div>
                  <div className="tv-cue-text">
                    Giai đoạn {currentSection ? currentSection.name : 'Chính thức'} — Khớp kịch bản tiệc cưới
                  </div>
                </div>
              )}

              {/* Time & Timeline Progress */}
              <div className="tv-progress-box">
                <div className="tv-time-row">
                  <span className="tv-time-now">{formatTime(currentTime)}</span>
                  <span className="tv-time-total">{formatTime(duration)}</span>
                </div>
                <div className="tv-progress-rail">
                  <div
                    className="tv-progress-fill"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Right: Upcoming Song & Hall QR */}
            <div className="tv-side-column">
              {nextTrackInfo && (
                <div className="tv-next-card">
                  <div className="tv-next-label">SẮP PHÁT TIẾP THEO:</div>
                  <div className="tv-next-item">
                    {nextTrackInfo.thumbnail && (
                      <img
                        src={nextTrackInfo.thumbnail}
                        alt=""
                        className="tv-next-thumb"
                      />
                    )}
                    <div className="tv-next-meta">
                      <div className="tv-next-title">{nextTrackInfo.title}</div>
                      <div className="tv-next-artist">{nextTrackInfo.artist || '—'}</div>
                      <span className={`tv-next-side tv-next-side--${nextTrackInfo.side || 'both'}`}>
                        {nextTrackInfo.side === 'groom'
                          ? '🤵 Nhà Trai'
                          : nextTrackInfo.side === 'bride'
                          ? '👰 Nhà Gái'
                          : '💍 Chung'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="tv-qr-box">
                <div className="tv-qr-label">QUÉT MÃ ĐIỀU KHIỂN / XEM MENU:</div>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                    typeof window !== 'undefined' ? window.location.href : 'https://vercel.app'
                  )}&color=74263a&bgcolor=fdfaf7`}
                  alt="QR Code"
                  className="tv-qr-img"
                />
                <span className="tv-qr-desc">Dùng camera điện thoại để kết nối trực tiếp</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="tv-empty-stage">
            <SparklesIcon className="w-16 h-16 text-amber-400 mb-4 animate-bounce" />
            <h2>SÂN KHẤU ĐANG SẴN SÀNG</h2>
            <p>Vui lòng chọn bài hát để bắt đầu kịch bản âm thanh tiệc cưới</p>
          </div>
        )}
      </main>

      {/* Bottom Stage Control Console */}
      <footer className="tv-stage-footer">
        <div className="tv-footer-controls">
          <button
            type="button"
            className="tv-btn tv-btn--prev"
            onClick={prevTrack}
            title="Bài trước (Phím Mũi tên trái)"
          >
            <SkipPrevIcon className="w-7 h-7" />
            <span>Bài Trước</span>
          </button>

          <button
            type="button"
            className="tv-btn tv-btn--play"
            onClick={togglePlay}
            disabled={loading}
            title={isPlaying ? 'Tạm dừng (Phím Space)' : 'Phát nhạc (Phím Space)'}
          >
            {loading ? (
              <span className="tv-spinner" />
            ) : isPlaying ? (
              <>
                <PauseIcon className="w-8 h-8" />
                <span>TẠM DỪNG</span>
              </>
            ) : (
              <>
                <PlayIcon className="w-8 h-8" />
                <span>PHÁT NHẠC</span>
              </>
            )}
          </button>

          <button
            type="button"
            className="tv-btn tv-btn--stop"
            onClick={stop}
            title="Dừng hẳn"
          >
            <StopIcon className="w-6 h-6" />
            <span>Dừng Hẳn</span>
          </button>

          <button
            type="button"
            className="tv-btn tv-btn--next"
            onClick={nextTrack}
            title="Bài tiếp theo (Phím Mũi tên phải)"
          >
            <SkipNextIcon className="w-7 h-7" />
            <span>Bài Kế Tiếp</span>
          </button>

          <button
            type="button"
            className="tv-btn tv-btn--fade"
            onClick={() => fadeStop(2)}
            title="Hạ dần âm lượng trong 2 giây rồi dừng dịu dàng"
          >
            <span>Fade Dịu 2s</span>
          </button>

          <button
            type="button"
            className={`tv-btn tv-btn--mode ${mode === 'clip' ? 'active' : ''}`}
            onClick={() => setMode(mode === 'clip' ? 'full' : 'clip')}
            title="Chuyển chế độ phát toàn bài hoặc phát đoạn cắt"
          >
            <ScissorsIcon className="w-5 h-5" />
            <span>{mode === 'clip' ? 'Đoạn Cắt (CUE)' : 'Toàn Bài'}</span>
          </button>

          <button
            type="button"
            className={`tv-btn tv-btn--loop ${loop ? 'active' : ''}`}
            onClick={toggleLoop}
            title="Lặp lại bài hát"
          >
            <LoopIcon className="w-5 h-5" />
            <span>{loop ? 'Lặp: BẬT' : 'Lặp: TẮT'}</span>
          </button>
        </div>
      </footer>
    </div>
  );
};
