import React, { useState, useMemo } from 'react';
import type { Section, Track } from '../types';
import { TrackItem } from './TrackItem';
import { usePlaylist } from '../state/playlistContext';
import { usePlayer } from '../state/playerContext';
import {
  PlayIcon,
  PlusIcon,
  EditIcon,
  TrashIcon,
} from './common/Icons';

interface SectionCardProps {
  section: Section;
  tracks: Track[];
  onEditSection: (section: Section) => void;
  onAddTrack: (sectionId: string) => void;
  onEditTrack: (track: Track) => void;
}

function formatSectionDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}p ${s > 0 ? `${s}s` : ''}`;
}

export const SectionCard: React.FC<SectionCardProps> = ({
  section,
  tracks,
  onEditSection,
  onAddTrack,
  onEditTrack,
}) => {
  const { deleteSection, moveTrackOrder, moveTrackToIndex } = usePlaylist();
  const { playTrack } = usePlayer();
  const [collapsed, setCollapsed] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Always guarantee tracks inside section are sorted by order
  const sortedTracks = useMemo(() => {
    return [...tracks].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [tracks]);

  const totalDuration = sortedTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  const handlePlayFirst = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (sortedTracks.length > 0) {
      playTrack(sortedTracks[0], 'clip');
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`Xóa giai đoạn "${section.name}" và toàn bộ ${sortedTracks.length} bài hát trong đó?`)) {
      deleteSection(section.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (!isDragOver) setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const draggedTrackId = e.dataTransfer.getData('text/plain');
    if (!draggedTrackId) return;
    moveTrackToIndex(draggedTrackId, section.id, sortedTracks.length);
  };

  return (
    <div
      className={`section-panel section-panel--${section.tone || 'rose'} ${
        isDragOver ? 'section-drag-over' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Section Header */}
      <div className="section-header" onClick={() => setCollapsed(!collapsed)}>
        <div className="section-header-left">
          <span className="section-order-tag">{section.order}</span>
          <div>
            <div className="section-title-row">
              <h3 className="section-title">{section.name}</h3>
              <span className={`tone-pill tone-pill--${section.tone}`}>{section.tone}</span>
            </div>
            {section.description && <p className="section-desc">{section.description}</p>}
          </div>
        </div>

        <div className="section-header-right">
          <div className="section-counts">
            <span className="count-tracks">{sortedTracks.length} bài</span>
            {totalDuration > 0 && (
              <span className="count-duration">· {formatSectionDuration(totalDuration)}</span>
            )}
          </div>

          {/* Quick Play All In Section */}
          {sortedTracks.length > 0 && (
            <button
              type="button"
              className="section-play-btn"
              onClick={handlePlayFirst}
              title="Phát từ bài đầu tiên của giai đoạn này"
            >
              <PlayIcon />
              <span>Phát mục</span>
            </button>
          )}

          {/* Add Track */}
          <button
            type="button"
            className="section-add-btn"
            onClick={(e) => {
              e.stopPropagation();
              onAddTrack(section.id);
            }}
            title="Thêm bài hát vào giai đoạn này"
          >
            <PlusIcon />
            <span>Thêm bài</span>
          </button>

          {/* Edit Section */}
          <button
            type="button"
            className="icon-action-btn"
            onClick={(e) => {
              e.stopPropagation();
              onEditSection(section);
            }}
            title="Sửa tên hoặc mô tả giai đoạn"
          >
            <EditIcon />
          </button>

          {/* Delete Section */}
          <button
            type="button"
            className="icon-action-btn icon-action-btn--danger"
            onClick={handleDelete}
            title="Xóa giai đoạn này"
          >
            <TrashIcon />
          </button>
        </div>
      </div>

      {/* Track List inside this Section */}
      {!collapsed && (
        <div className="section-body">
          {sortedTracks.length === 0 ? (
            <div className="empty-section-placeholder">
              <p>Chưa có bài hát nào trong giai đoạn này.</p>
              <button
                type="button"
                className="empty-add-btn"
                onClick={() => onAddTrack(section.id)}
              >
                + Thêm bài hát ngay (Máy tính / Điện thoại / Drive)
              </button>
            </div>
          ) : (
            <div className="tracks-container">
              {sortedTracks.map((track, idx) => (
                <TrackItem
                  key={track.id}
                  track={track}
                  index={idx}
                  totalInList={sortedTracks.length}
                  onEdit={onEditTrack}
                  onMoveUp={() => moveTrackOrder(track.id, 'up')}
                  onMoveDown={() => moveTrackOrder(track.id, 'down')}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
