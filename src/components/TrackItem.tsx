import React from 'react';
import type { Track, WeddingSide } from '../types';
import { usePlayer } from '../state/playerContext';
import { usePlaylist } from '../state/playlistContext';
import {
  PlayIcon,
  PauseIcon,
  ScissorsIcon,
  EditIcon,
  TrashIcon,
  HeartIcon,
  LinkIcon,
} from './common/Icons';

interface TrackItemProps {
  track: Track;
  index: number;
  onEdit: (track: Track) => void;
}

function formatTime(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const TrackItem: React.FC<TrackItemProps> = ({ track, index, onEdit }) => {
  const { currentTrack, isPlaying, playTrack, togglePlay } = usePlayer();
  const { playlist, updateTrack, deleteTrack, moveTrack } = usePlaylist();

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

  const hasTrim = track.trimStart > 0 || (track.trimEnd != null && track.trimEnd < (track.duration || 999999));

  return (
    <div
      className={`track-item-card track-item-card--${track.side || 'both'} ${
        isCurrent ? 'track-item--active' : ''
      } ${isPlayingNow ? 'track-item--playing' : ''}`}
    >
      {/* Main Track Row: Play button + Info + Quick Actions */}
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

        {/* Track Order Number */}
        <span className="track-order-num">{index + 1}</span>

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

          {/* Move to another section (Desktop only) */}
          {playlist.sections.length > 1 && (
            <select
              className="track-move-select desktop-only-action"
              value={track.sectionId}
              onChange={handleMoveSection}
              title="Chuyển sang giai đoạn khác"
            >
              {playlist.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
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
