import React from 'react';
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
  VolumeHighIcon,
  VolumeMuteIcon,
  SparklesIcon,
} from './common/Icons';

function formatTime(sec: number): string {
  if (isNaN(sec) || sec < 0) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const StudioConsole: React.FC = () => {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    mode,
    loop,
    loading,
    togglePlay,
    stop,
    seek,
    setVolume,
    toggleMute,
    setMode,
    toggleLoop,
    nextTrack,
    prevTrack,
    fadeStop,
  } = usePlayer();

  const { playlist } = usePlaylist();

  if (!currentTrack) {
    return (
      <footer className="studio-console-bar studio-console-bar--idle">
        <div className="console-idle-text">
          <SparklesIcon className="w-4 h-4 text-amber-500" />
          <span>Chọn một bài hát trong danh sách cưới để bắt đầu phát nhạc tại Studio</span>
        </div>
      </footer>
    );
  }

  const activeSection = playlist.sections.find((s) => s.id === currentTrack.sectionId);

  const total = duration > 0 ? duration : 1;
  const progressPercent = Math.min(100, (currentTime / total) * 100);
  const trimStartPercent = Math.min(100, ((currentTrack.trimStart || 0) / total) * 100);
  const trimEndPercent = currentTrack.trimEnd
    ? Math.min(100, (currentTrack.trimEnd / total) * 100)
    : 100;

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    seek(ratio * total);
  };

  return (
    <footer className="studio-console-bar">
      {/* Visual Timeline Bar with Trim Markers */}
      <div
        className="timeline-track-wrapper"
        onClick={handleTimelineClick}
        title="Nhấp để chuyển đến vị trí phát"
      >
        <div className="timeline-rail">
          {mode === 'clip' && (
            <div
              className="timeline-clip-zone"
              style={{
                left: `${trimStartPercent}%`,
                width: `${Math.max(0, trimEndPercent - trimStartPercent)}%`,
              }}
            />
          )}

          <div
            className="timeline-progress-fill"
            style={{ width: `${progressPercent}%` }}
          />

          <div
            className="timeline-playhead"
            style={{ left: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="console-content">
        {/* Left: Current Track Details & Side Badge */}
        <div className="console-track-info">
          <div className="console-meta-left">
            <div className="console-tags-row">
              {/* Wedding Side Tag */}
              <span className={`console-side-tag console-side-tag--${currentTrack.side || 'both'}`}>
                {currentTrack.side === 'groom' && '🤵 NHÀ TRAI'}
                {currentTrack.side === 'bride' && '👰 NHÀ GÁI'}
                {(currentTrack.side === 'both' || !currentTrack.side) && '💍 CHUNG'}
              </span>

              {activeSection && (
                <span className={`console-section-tag tone-pill--${activeSection.tone}`}>
                  {activeSection.name}
                </span>
              )}
            </div>

            <div className="console-title-row">
              <span className="console-title">{currentTrack.title}</span>
              {currentTrack.artist && (
                <span className="console-artist">· {currentTrack.artist}</span>
              )}
            </div>

            {currentTrack.note && (
              <div className="console-cue-tip">
                <span className="cue-badge">CUE</span>
                <span className="cue-msg">{currentTrack.note}</span>
              </div>
            )}
          </div>
        </div>

        {/* Center: Playback Controls */}
        <div className="console-controls-center">
          <div className="console-buttons-row">
            <button
              type="button"
              className="console-btn"
              onClick={prevTrack}
              title="Bài trước"
            >
              <SkipPrevIcon />
            </button>

            <button
              type="button"
              className="console-btn-play"
              onClick={togglePlay}
              disabled={loading}
              title={isPlaying ? 'Tạm dừng (Space)' : 'Phát nhạc'}
            >
              {loading ? (
                <span className="console-spinner" />
              ) : isPlaying ? (
                <PauseIcon />
              ) : (
                <PlayIcon />
              )}
            </button>

            <button
              type="button"
              className="console-btn"
              onClick={stop}
              title="Dừng hẳn"
            >
              <StopIcon />
            </button>

            <button
              type="button"
              className="console-btn"
              onClick={nextTrack}
              title="Bài kế tiếp"
            >
              <SkipNextIcon />
            </button>

            <button
              type="button"
              className="console-btn console-btn--fade"
              onClick={() => fadeStop(2)}
              title="Dừng dịu (Fade-out 2 giây, không giật tiếng)"
            >
              Fade Stop
            </button>
          </div>

          <div className="console-time-mode-row">
            <span className="console-time-text">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="mode-toggle-group">
              <button
                type="button"
                className={`mode-toggle-btn ${mode === 'clip' ? 'active' : ''}`}
                onClick={() => setMode('clip')}
                title="Phát đúng đoạn cắt (Trim)"
              >
                <ScissorsIcon className="w-3 h-3" />
                <span>Đoạn cắt</span>
              </button>
              <button
                type="button"
                className={`mode-toggle-btn ${mode === 'full' ? 'active' : ''}`}
                onClick={() => setMode('full')}
                title="Phát trọn vẹn cả bài"
              >
                <span>Cả bài</span>
              </button>
            </div>

            <button
              type="button"
              className={`console-btn-icon ${loop ? 'active' : ''}`}
              onClick={toggleLoop}
              title={loop ? 'Đang bật lặp lại bài hát' : 'Bật lặp lại bài hát'}
            >
              <LoopIcon />
            </button>
          </div>
        </div>

        {/* Right: Master Volume Slider */}
        <div className="console-right-volume">
          <button
            type="button"
            className="volume-mute-btn"
            onClick={toggleMute}
            title={isMuted ? 'Bật tiếng' : 'Tắt tiếng'}
          >
            {isMuted || volume === 0 ? <VolumeMuteIcon /> : <VolumeHighIcon />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="volume-slider"
            title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
          <span className="volume-label">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </div>
    </footer>
  );
};
