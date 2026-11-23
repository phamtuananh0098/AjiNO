import React, { useState, useMemo } from 'react';
import type { Section, Track } from '../types';
import { usePlaylist } from '../state/playlistContext';
import { SectionCard } from './SectionCard';
import { PlusIcon } from './common/Icons';

interface SectionListProps {
  onOpenAddSection: () => void;
  onEditSection: (section: Section) => void;
  onAddTrack: (sectionId: string) => void;
  onEditTrack: (track: Track) => void;
}

export const SectionList: React.FC<SectionListProps> = ({
  onOpenAddSection,
  onEditSection,
  onAddTrack,
  onEditTrack,
}) => {
  const { playlist } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState('');

  // Group tracks by section
  const tracksBySection = useMemo(() => {
    const map = new Map<string, Track[]>();
    for (const sec of playlist.sections) {
      map.set(sec.id, []);
    }
    const q = searchQuery.toLowerCase().trim();
    for (const trk of playlist.tracks) {
      if (q) {
        const matchTitle = trk.title.toLowerCase().includes(q);
        const matchArtist = trk.artist.toLowerCase().includes(q);
        const matchNote = trk.note.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchNote) continue;
      }
      const list = map.get(trk.sectionId);
      if (list) {
        list.push(trk);
      }
    }
    // Sort each group by order
    for (const [_, list] of map.entries()) {
      list.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    return map;
  }, [playlist.sections, playlist.tracks, searchQuery]);

  return (
    <div className="section-list-wrapper">
      {/* Search and Section Controls */}
      <div className="list-toolbar-row">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Tìm bài hát, nghệ sĩ, hoặc ghi chú kịch bản (CUE)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchQuery('')}
            >
              ✕
            </button>
          )}
        </div>

        <button
          type="button"
          className="add-section-btn"
          onClick={onOpenAddSection}
        >
          <PlusIcon />
          <span>Thêm giai đoạn mới</span>
        </button>
      </div>

      {/* Sections rendering */}
      <div className="sections-container">
        {playlist.sections.length === 0 ? (
          <div className="empty-project-box">
            <h3>Chưa có giai đoạn nào trong kịch bản tiệc cưới</h3>
            <p>Hãy tạo các giai đoạn như Đón khách, Lễ cưới, Khai tiệc để bắt đầu lên danh sách nhạc.</p>
            <button
              type="button"
              className="primary-btn"
              onClick={onOpenAddSection}
            >
              + Tạo giai đoạn đầu tiên
            </button>
          </div>
        ) : (
          playlist.sections.map((sec) => (
            <SectionCard
              key={sec.id}
              section={sec}
              tracks={tracksBySection.get(sec.id) || []}
              onEditSection={onEditSection}
              onAddTrack={onAddTrack}
              onEditTrack={onEditTrack}
            />
          ))
        )}
      </div>
    </div>
  );
};
