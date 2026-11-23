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
  LaptopIcon,
  SmartphoneIcon,
  GoogleDriveIcon,
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

  const handlePlayFull = (e: React.MouseEvent) => {
    e.stopPropagation();
    playTrack(track, 'full');
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateTrack(track.id, { favorite: !track.favorite });
  };

  const toggleSide = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextSide: WeddingSide =
      track.side === 'groom' ? 'bride' : track.side === 'bride' ? 'both' : 'groom';
    updateTrack(track.id, { side: nextSide });
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
  const trimDuration = track.trimEnd ? Math.max(0, track.trimEnd - track.trimStart) : null;

  return (
    <div
      className={`track-item-card track-item-card--${track.side || 'both'} ${
        isCurrent ? 'track-item--active' : ''
      } ${isPlayingNow ? 'track-item--playing' : ''}`}
    >
      {/* Index & Play Button */}
      <div className="track-left">
        <button
          type="button"
          className={`track-play-btn ${isPlayingNow ? 'track-play-btn--active' : ''}`}
          onClick={handlePlayClip}
          title={isPlayingNow ? 'Tạm dừng' : 'Phát đoạn nhạc cắt (Clip)'}
        >
          {isPlayingNow ? <PauseIcon /> : <PlayIcon />}
        </button>

        <span className="track-order-num">{index + 1}</span>

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

        {/* Title, Artist & Cue */}
        <div className="track-info">
          <div className="track-title-row">
            <span className="track-title">{track.title}</span>
            {track.artist && <span className="track-artist">· {track.artist}</span>}
          </div>

          {track.note && (
            <div className="track-cue-note" title="Ghi chú thời điểm phát cho MC/DJ">
              <span className="cue-badge">CUE</span>
              <span className="cue-text">{track.note}</span>
            </div>
          )}
        </div>
      </div>

      {/* Metadata Badges, Side & Timing */}
      <div className="track-center">
        {/* Side Badge (Groom / Bride / Both) */}
        <button
          type="button"
          className={`side-pill side-pill--${track.side || 'both'}`}
          onClick={toggleSide}
          title="Bấm để đổi bên (Nhà Trai / Nhà Gái / Chung)"
        >
          {track.side === 'groom' && '🤵 Nhà Trai'}
          {track.side === 'bride' && '👰 Nhà Gái'}
          {(track.side === 'both' || !track.side) && '💍 Cả Hai Bên'}
        </button>

        {/* Source badge */}
        <span className={`source-badge source-badge--${track.platform}`}>
          {track.platform === 'local' && (
            <>
              <LaptopIcon /> <span>Máy tính</span>
            </>
          )}
          {track.platform === 'mobile' && (
            <>
              <SmartphoneIcon /> <span>Điện thoại</span>
            </>
          )}
          {track.platform === 'gdrive' && (
            <>
              <GoogleDriveIcon /> <span>Google Drive</span>
            </>
          )}
          {track.platform === 'link' && (
            <>
              <LinkIcon /> <span>Link Web</span>
            </>
          )}
        </span>

        {/* Trim badge */}
        {hasTrim ? (
          <button
            type="button"
            className="trim-badge trim-badge--active"
            onClick={() => onEdit(track)}
            title="Đoạn cắt âm thanh. Bấm để sửa."
          >
            <ScissorsIcon className="w-3.5 h-3.5" />
            <span>
              {formatTime(track.trimStart)} - {formatTime(track.trimEnd)}
              {trimDuration && ` (${Math.round(trimDuration)}s)`}
            </span>
          </button>
        ) : (
          <button
            type="button"
            className="trim-badge"
            onClick={() => onEdit(track)}
            title="Chưa cắt đoạn nhạc. Bấm để cắt."
          >
            <span>Toàn bài ({formatTime(track.duration)})</span>
          </button>
        )}

        {track.volumeOffset !== undefined && track.volumeOffset !== 0 && (
          <span className="gain-badge" title="Tăng giảm âm lượng riêng cho bài này">
            {track.volumeOffset > 0 ? `+${track.volumeOffset}dB` : `${track.volumeOffset}dB`}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="track-actions">
        {hasTrim && (
          <button
            type="button"
            className="icon-action-btn"
            onClick={handlePlayFull}
            title="Phát nguyên bài (không cắt)"
          >
            <span style={{ fontSize: '11px', fontWeight: 600 }}>FULL</span>
          </button>
        )}

        {/* Edit track */}
        <button
          type="button"
          className="icon-action-btn"
          onClick={() => onEdit(track)}
          title="Cắt nhạc, chỉnh fade, âm lượng và đổi bên"
        >
          <EditIcon />
        </button>

        {/* Favorite toggle */}
        <button
          type="button"
          className={`icon-action-btn ${track.favorite ? 'icon-action-btn--fav' : ''}`}
          onClick={toggleFavorite}
          title={track.favorite ? 'Bỏ ưu tiên' : 'Đánh dấu ưu tiên / yêu thích'}
        >
          <HeartIcon fillHeart={track.favorite} />
        </button>

        {/* Open original link */}
        {track.url && /^https?:\/\//i.test(track.url) && (
          <a
            href={track.url}
            target="_blank"
            rel="noopener noreferrer"
            className="icon-action-btn"
            title="Mở liên kết gốc (YouTube, Spotify, ZingMP3...)"
            onClick={(e) => e.stopPropagation()}
          >
            <LinkIcon />
          </a>
        )}

        {/* Move to another section */}
        {playlist.sections.length > 1 && (
          <select
            className="track-move-select"
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

        {/* Delete */}
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
  );
};
