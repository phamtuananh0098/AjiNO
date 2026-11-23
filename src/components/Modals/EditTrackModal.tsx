import React, { useState, useRef, useEffect } from 'react';
import type { Track, WeddingSide } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import {
  CloseIcon,
  PlayIcon,
  PauseIcon,
  ScissorsIcon,
  CheckIcon,
  HeartIcon,
} from '../common/Icons';

interface EditTrackModalProps {
  track: Track | null;
  open: boolean;
  onClose: () => void;
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  track,
  open,
  onClose,
}) => {
  const { updateTrack } = usePlaylist();
  const { pushToast } = useToast();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [side, setSide] = useState<WeddingSide>('both');
  const [note, setNote] = useState('');
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(180);
  const [volumeOffset, setVolumeOffset] = useState<number>(0);
  const [fadeIn, setFadeIn] = useState<number>(2);
  const [fadeOut, setFadeOut] = useState<number>(2);
  const [favorite, setFavorite] = useState<boolean>(false);

  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  const [previewTime, setPreviewTime] = useState<number>(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (track && open) {
      setTitle(track.title);
      setArtist(track.artist || '');
      setSide(track.side || 'both');
      setNote(track.note || '');
      setTrimStart(track.trimStart || 0);
      setDuration(track.duration || 180);
      setTrimEnd(track.trimEnd != null ? track.trimEnd : (track.duration || 180));
      setVolumeOffset(track.volumeOffset || 0);
      setFadeIn(track.fadeIn != null ? track.fadeIn : 2);
      setFadeOut(track.fadeOut != null ? track.fadeOut : 2);
      setFavorite(!!track.favorite);

      const audio = new Audio(track.audioId ? `/api/audio/${track.audioId}` : track.url);
      audioPreviewRef.current = audio;

      const onTime = () => {
        if (!audio) return;
        setPreviewTime(audio.currentTime);
        if (trimEnd && audio.currentTime >= trimEnd) {
          audio.pause();
          setPreviewPlaying(false);
        }
      };

      const onEnded = () => setPreviewPlaying(false);
      audio.addEventListener('timeupdate', onTime);
      audio.addEventListener('ended', onEnded);

      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', onTime);
        audio.removeEventListener('ended', onEnded);
        audioPreviewRef.current = null;
      };
    }
  }, [track, open]);

  if (!open || !track) return null;

  const handleTogglePreviewClip = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;

    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
    } else {
      audio.currentTime = trimStart;
      audio.play().then(() => setPreviewPlaying(true)).catch(() => {});
    }
  };

  const handleTogglePreviewFull = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play().then(() => setPreviewPlaying(true)).catch(() => {});
    }
  };

  const handleStopPreview = () => {
    const audio = audioPreviewRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = trimStart;
    setPreviewPlaying(false);
    setPreviewTime(trimStart);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      pushToast('Vui lòng nhập tên bài hát', 'error');
      return;
    }

    const start = Math.max(0, Number(trimStart) || 0);
    const end = trimEnd ? Math.max(start + 1, Number(trimEnd)) : null;

    updateTrack(track.id, {
      title: title.trim(),
      artist: artist.trim(),
      side: side,
      note: note.trim(),
      trimStart: start,
      trimEnd: end,
      volumeOffset: Number(volumeOffset),
      fadeIn: Number(fadeIn),
      fadeOut: Number(fadeOut),
      favorite,
    });

    handleStopPreview();
    pushToast(`Đã lưu thay đổi cho bài "${title}"`, 'success');
    onClose();
  };

  const maxDur = duration > 0 ? duration : 300;
  const clipLength = (trimEnd || maxDur) - trimStart;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ScissorsIcon className="text-amber-500" />
            <h3 className="modal-title">Studio Cắt Nhạc & Tinh Chỉnh Bài Hát</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {/* Side Selector */}
          <div className="modal-side-selector-row">
            <span className="side-selector-label">Phía gia đình sở hữu bài hát:</span>
            <div className="side-selector-buttons">
              <button
                type="button"
                className={`side-select-btn side-select-btn--groom ${side === 'groom' ? 'active' : ''}`}
                onClick={() => setSide('groom')}
              >
                <span>🤵 Nhà Trai</span>
              </button>
              <button
                type="button"
                className={`side-select-btn side-select-btn--bride ${side === 'bride' ? 'active' : ''}`}
                onClick={() => setSide('bride')}
              >
                <span>👰 Nhà Gái</span>
              </button>
              <button
                type="button"
                className={`side-select-btn side-select-btn--both ${side === 'both' ? 'active' : ''}`}
                onClick={() => setSide('both')}
              >
                <span>💍 Cả Hai Bên</span>
              </button>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tên bài hát</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nghệ sĩ</label>
              <input
                type="text"
                className="form-input"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              ⚡ Ghi chú thời điểm phát (CUE cho MC / DJ đám cưới)
            </label>
            <input
              type="text"
              className="form-input form-input--cue"
              placeholder="Ví dụ: Bắt đầu phát khi cô dâu bước vào lễ đường"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Trimmer Console */}
          <div className="trimmer-studio-box">
            <div className="trimmer-header">
              <span className="trimmer-label">CẮT ĐOẠN NHẠC (TRIM AUDIO)</span>
              <span className="trimmer-duration-tag">
                Thời lượng phát: <b>{Math.round(clipLength)} giây</b> (
                {formatSec(trimStart)} → {formatSec(trimEnd || maxDur)})
              </span>
            </div>

            <div className="trimmer-visual-rail">
              <div
                className="trimmer-highlight-zone"
                style={{
                  left: `${(trimStart / maxDur) * 100}%`,
                  width: `${(clipLength / maxDur) * 100}%`,
                }}
              />
              <div
                className="trimmer-playhead"
                style={{ left: `${(previewTime / maxDur) * 100}%` }}
              />
            </div>

            <div className="trimmer-sliders-grid">
              <div className="trim-slider-col">
                <div className="slider-label-row">
                  <span>Bắt đầu (Start):</span>
                  <b>{formatSec(trimStart)}</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, (trimEnd || maxDur) - 1)}
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="trim-range"
                />
              </div>

              <div className="trim-slider-col">
                <div className="slider-label-row">
                  <span>Kết thúc (End):</span>
                  <b>{formatSec(trimEnd || maxDur)}</b>
                </div>
                <input
                  type="range"
                  min={trimStart + 1}
                  max={maxDur}
                  step="0.5"
                  value={trimEnd || maxDur}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="trim-range"
                />
              </div>
            </div>

            <div className="trimmer-presets-row">
              <span className="preset-label">Mẫu nhanh:</span>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setTrimStart(0);
                  setTrimEnd(60);
                }}
              >
                1 phút đầu
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setTrimStart(30);
                  setTrimEnd(90);
                }}
              >
                Điệp khúc (30s-90s)
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setTrimStart(0);
                  setTrimEnd(maxDur);
                }}
              >
                Toàn bài ({Math.round(maxDur)}s)
              </button>
            </div>

            <div className="trimmer-preview-bar">
              <button
                type="button"
                className={`preview-btn ${previewPlaying ? 'active' : ''}`}
                onClick={handleTogglePreviewClip}
              >
                {previewPlaying ? <PauseIcon /> : <PlayIcon />}
                <span>{previewPlaying ? 'Tạm dừng' : 'Nghe thử đoạn cắt'}</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={handleTogglePreviewFull}
              >
                Nghe toàn bài
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={handleStopPreview}
              >
                Dừng hẳn
              </button>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Cân bằng âm lượng (dB)</label>
              <div className="gain-input-row">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={volumeOffset}
                  onChange={(e) => setVolumeOffset(parseInt(e.target.value))}
                  className="gain-slider"
                />
                <span className="gain-value">
                  {volumeOffset > 0 ? `+${volumeOffset} dB` : `${volumeOffset} dB`}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fade-in (Êm đầu)</label>
              <select
                className="form-select"
                value={fadeIn}
                onChange={(e) => setFadeIn(parseInt(e.target.value))}
              >
                <option value={0}>Không</option>
                <option value={1}>1 giây</option>
                <option value={2}>2 giây (Chuẩn)</option>
                <option value={3}>3 giây</option>
                <option value={5}>5 giây</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fade-out (Dịu đuôi)</label>
              <select
                className="form-select"
                value={fadeOut}
                onChange={(e) => setFadeOut(parseInt(e.target.value))}
              >
                <option value={0}>Không</option>
                <option value={1}>1 giây</option>
                <option value={2}>2 giây (Chuẩn)</option>
                <option value={3}>3 giây</option>
                <option value={5}>5 giây</option>
              </select>
            </div>
          </div>

          <div className="form-check-row">
            <label className="check-label">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
              />
              <HeartIcon fillHeart={favorite} className="w-4 h-4 text-rose-500" />
              <span>Đánh dấu bài hát quan trọng / Yêu thích</span>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                handleStopPreview();
                onClose();
              }}
            >
              Hủy
            </button>
            <button type="submit" className="primary-btn">
              <CheckIcon />
              <span>Lưu thay đổi kịch bản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
