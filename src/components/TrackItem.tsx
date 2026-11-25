import React, { useState } from 'react';
import type { Track } from '../types';
import { usePlayer } from '../state/playerContext';
import { usePlaylist } from '../state/playlistContext';
import {
  PlayIcon,
  PauseIcon,
  EditIcon,
  TrashIcon,
  HeartIcon,
  LinkIcon,
} from './common/Icons';

interface TrackItemProps {
  track: Track;
  index: number;
  totalInList?: number;
  onEdit: (track: Track) => void;
  onMoveUp?: (trackId: string) => void;
  onMoveDown?: (trackId: string) => void;
}

function formatTime(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const TrackItem: React.FC<TrackItemProps> = ({
  track,
  index,
  totalInList,
  onEdit,
  onMoveUp,
  onMoveDown,
}) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { playlist, updateTrack, deleteTrack, moveTrack, moveTrackOrder, moveTrackToIndex } = usePlaylist();

  const [isDragging, setIsDragging] = useState(false);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);

  const isCurrent = currentTrack?.id === track.id;
  const isPlayingNow = isCurrent && isPlaying;

  const handlePlayClip = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playTrack(track, 'clip');
    }
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTrack(track.id, { favorite: !track.favorite });
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Xác nhận xóa bài "${track.title}" khỏi danh sách?`)) {
      deleteTrack(track.id);
    }
  };

  const handleMoveSection = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const targetSectionId = e.target.value;
    if (targetSectionId && targetSectionId !== track.sectionId) {
      moveTrack(track.id, targetSectionId);
    }
  };

  const handleMoveUpClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveUp) {
      onMoveUp(track.id);
    } else {
      moveTrackOrder(track.id, 'up');
    }
  };

  const handleMoveDownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onMoveDown) {
      onMoveDown(track.id);
    } else {
      moveTrackOrder(track.id, 'down');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', track.id);
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDropPosition(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) {
      setDropPosition('top');
    } else {
      setDropPosition('bottom');
    }
  };

  const handleDragLeave = () => {
    setDropPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedTrackId = e.dataTransfer.getData('text/plain');
    if (!draggedTrackId || draggedTrackId === track.id) {
      setDropPosition(null);
      return;
    }
    const targetIdx = dropPosition === 'bottom' ? index + 1 : index;
    moveTrackToIndex(draggedTrackId, track.sectionId, targetIdx);
    setDropPosition(null);
  };

  const hasTrim = track.trimStart > 0 || (track.trimEnd != null && track.trimEnd < (track.duration || 999999));

  return (
    <div
      className={`track-item-card track-item-card--${track.side || 'both'} ${
        isCurrent ? 'track-item--active' : ''
      } ${isPlayingNow ? 'track-item--playing' : ''} ${
        isDragging ? 'track-item--dragging' : ''
      } ${dropPosition ? `track-drop--${dropPosition}` : ''}`}
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Main Track Row: Stepper + Play button + Info + Quick Actions */}
      <div className="track-item-header-row">
        {/* Play/Pause Button */}
        <button
          type="button"
          className={`track-play-btn ${isPlayingNow ? 'track-play-btn--active' : ''}`}
          onClick={handlePlayClip}
          title={isPlayingNow ? 'Tạm dừng phát nhạc' : 'Phát bài hát'}
        >
          {isPlayingNow ? <PauseIcon /> : <PlayIcon />}
        </button>

        {/* Order Stepper (Move Up ▲ / Number / Move Down ▼) */}
        <div className="track-order-stepper" title="Di chuyển thứ tự bài hát lên/xuống">
          <button
            type="button"
            className="track-stepper-btn track-stepper-btn--up"
            onClick={handleMoveUpClick}
            title="Đẩy bài hát lên trên (hoặc chuyển sang mục trước)"
          >
            ▲
          </button>
          <span className="track-order-num">{index + 1}</span>
          <button
            type="button"
            className="track-stepper-btn track-stepper-btn--down"
            onClick={handleMoveDownClick}
            title="Đẩy bài hát xuống dưới (hoặc chuyển sang mục sau)"
          >
            ▼
          </button>
        </div>

        {/* Thumbnail if available */}
        {track.thumbnail && (
          <img
            src={track.thumbnail}
            alt=""
            className="track-thumb-cover"
            loading="lazy"
            onError={(e) => {
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
        )}

        {/* Song Title, Artist, Timing & Side */}
        <div className="track-info">
          <div className="track-title-row">
            <span className="track-title" title={track.title}>
              {track.title}
            </span>
          </div>

          <div className="track-sub-row">
            <span className="track-artist">
              {track.artist || 'Nghệ sĩ tiệc cưới'}
            </span>
            <span className="track-dot-sep">·</span>
            <span className="track-duration-pill">
              {hasTrim ? (
                <>✂ {formatTime(track.trimStart)} - {formatTime(track.trimEnd)}</>
              ) : (
                <>{formatTime(track.duration)}</>
              )}
            </span>
            <span className={`track-side-chip track-side-chip--${track.side || 'both'}`}>
              {track.side === 'groom' && '🤵 Trai'}
              {track.side === 'bride' && '👰 Gái'}
              {(track.side === 'both' || !track.side) && '💍 Chung'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="track-actions">
          {/* Quick Move to another stage/section (Works on Phone, iPad & PC) */}
          {playlist.sections.length > 1 && (
            <div className="track-move-trigger" title="Chuyển bài hát sang giai đoạn khác">
              <button type="button" className="track-move-btn" tabIndex={-1}>
                <span className="track-move-icon">⇄</span>
                <span className="track-move-text">Mục</span>
              </button>
              <select
                className="track-move-overlay-select"
                value={track.sectionId}
                onChange={handleMoveSection}
                title="Chuyển bài hát sang giai đoạn khác"
                onClick={(e) => e.stopPropagation()}
              >
                <option value="" disabled>-- Chuyển sang giai đoạn khác --</option>
                {playlist.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.order}. {s.name} ({s.side === 'groom' ? 'Nhà Trai' : s.side === 'bride' ? 'Nhà Gái' : 'Cả hai'})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Link Web Icon (Desktop only) */}
          {track.url && /^https?:\/\//i.test(track.url) && (
            <a
              href={track.url}
              target="_blank"
              rel="noopener noreferrer"
              className="icon-action-btn desktop-only-action"
              title="Mở liên kết gốc bài hát"
              onClick={(e) => e.stopPropagation()}
            >
              <LinkIcon />
            </a>
          )}

          {/* Edit button */}
          <button
            type="button"
            className="icon-action-btn"
            onClick={() => onEdit(track)}
            title="Chỉnh sửa chi tiết bài hát, cắt đoạn, âm lượng"
          >
            <EditIcon />
          </button>

          {/* Favorite button */}
          <button
            type="button"
            className={`icon-action-btn ${track.favorite ? 'icon-action-btn--fav' : ''}`}
            onClick={toggleFavorite}
            title={track.favorite ? 'Bỏ ưu tiên' : 'Đánh dấu ưu tiên phát'}
          >
            <HeartIcon fillHeart={track.favorite} />
          </button>

          {/* Delete button */}
          <button
            type="button"
            className="icon-action-btn icon-action-btn--danger"
            onClick={handleDelete}
            title="Xóa bài hát"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* MC Cue Note banner (Shown when note is provided) */}
      {track.note && (
        <div className="track-cue-banner" title="Ghi chú thời điểm phát cho MC/DJ">
          <span className="cue-badge">CUE MC</span>
          <span className="cue-text">{track.note}</span>
        </div>
      )}
    </div>
  );
};
