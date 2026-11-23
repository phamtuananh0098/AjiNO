import React, { useState, useMemo } from 'react';
import type { Section, Track, WeddingSide } from '../types';
import { usePlaylist } from '../state/playlistContext';
import { SectionCard } from './SectionCard';
import { PlusIcon, SparklesIcon } from './common/Icons';

interface DualSideViewProps {
  onOpenAddSection: (defaultSide?: WeddingSide) => void;
  onEditSection: (section: Section) => void;
  onAddTrack: (sectionId: string, defaultSide?: WeddingSide) => void;
  onEditTrack: (track: Track) => void;
}

export const DualSideView: React.FC<DualSideViewProps> = ({
  onOpenAddSection,
  onEditSection,
  onAddTrack,
  onEditTrack,
}) => {
  const { playlist, activeSideView, setActiveSideView } = usePlaylist();
  const [searchQuery, setSearchQuery] = useState('');

  const { meta, sections, tracks } = playlist;

  // Filter tracks by search query
  const filteredTracks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return tracks;
    return tracks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.artist.toLowerCase().includes(q) ||
        t.note.toLowerCase().includes(q)
    );
  }, [tracks, searchQuery]);

  // Groom Side Data: tracks with side === 'groom' || side === 'both'
  const groomTracks = useMemo(
    () => filteredTracks.filter((t) => t.side === 'groom' || t.side === 'both'),
    [filteredTracks]
  );
  const groomTotalSeconds = groomTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  // Bride Side Data: tracks with side === 'bride' || side === 'both'
  const brideTracks = useMemo(
    () => filteredTracks.filter((t) => t.side === 'bride' || t.side === 'both'),
    [filteredTracks]
  );
  const brideTotalSeconds = brideTracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  // Groom Sections: sections that are 'groom' or 'both' or have groom tracks
  const groomSections = useMemo(() => {
    return sections
      .filter((s) => s.side === 'groom' || s.side === 'both' || !s.side)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections]);

  // Bride Sections: sections that are 'bride' or 'both' or have bride tracks
  const brideSections = useMemo(() => {
    return sections
      .filter((s) => s.side === 'bride' || s.side === 'both' || !s.side)
      .sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections]);

  const formatDuration = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    return `${m} phút`;
  };

  return (
    <div className="dual-side-container">
      {/* View Switcher Bar & Search */}
      <div className="dual-view-toolbar">
        {/* Switcher Buttons */}
        <div className="view-mode-tabs">
          <button
            type="button"
            className={`view-mode-btn ${activeSideView === 'split' ? 'active' : ''}`}
            onClick={() => setActiveSideView('split')}
            title="Hiển thị song song 2 bên Nhà Trai và Nhà Gái"
          >
            <span className="tab-icon">👥</span>
            <span>Song Song (50 / 50)</span>
          </button>

          <button
            type="button"
            className={`view-mode-btn view-mode-btn--groom ${activeSideView === 'groom' ? 'active' : ''}`}
            onClick={() => setActiveSideView('groom')}
            title="Tập trung danh sách Nhà Trai"
          >
            <span className="tab-icon">🤵</span>
            <span>Nhà Trai ({groomTracks.length})</span>
          </button>

          <button
            type="button"
            className={`view-mode-btn view-mode-btn--bride ${activeSideView === 'bride' ? 'active' : ''}`}
            onClick={() => setActiveSideView('bride')}
            title="Tập trung danh sách Nhà Gái"
          >
            <span className="tab-icon">👰</span>
            <span>Nhà Gái ({brideTracks.length})</span>
          </button>
        </div>

        {/* Search */}
        <div className="dual-search-box">
          <input
            type="text"
            className="search-input"
            placeholder="🔍 Tìm bài hát, nghệ sĩ hoặc CUE cả 2 bên..."
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
      </div>

      {/* Main Dual Columns Grid */}
      <div className={`dual-grid-layout dual-grid-layout--${activeSideView}`}>
        {/* ========================================================
            LEFT COLUMN: NHÀ TRAI (GROOM'S SIDE)
            ======================================================== */}
        {(activeSideView === 'split' || activeSideView === 'groom') && (
          <div className="side-column side-column--groom">
            {/* Column Header */}
            <div className="side-column-header">
              <div className="side-header-info">
                <div className="side-avatar-badge side-avatar-badge--groom">
                  <span>🤵</span>
                </div>
                <div>
                  <div className="side-role-tag">HỌ NHÀ TRAI</div>
                  <h3 className="side-person-name">
                    {meta.groomName || (meta.couple ? meta.couple.split('&')[0].trim() : 'Chú Rể')}
                  </h3>
                  {meta.groomMusicStyle && (
                    <p className="side-style-note">🎵 {meta.groomMusicStyle}</p>
                  )}
                </div>
              </div>

              <div className="side-header-actions">
                <div className="side-stats-chip">
                  <b>{groomTracks.length}</b> bài · {formatDuration(groomTotalSeconds)}
                </div>
                <button
                  type="button"
                  className="side-action-add-btn side-action-add-btn--groom"
                  onClick={() => onAddTrack(groomSections[0]?.id || sections[0]?.id, 'groom')}
                  title="Thêm bài hát mới theo sở thích Nhà Trai"
                >
                  <PlusIcon />
                  <span>+ Bài Nhà Trai</span>
                </button>
              </div>
            </div>

            {/* Sections & Tracks of Groom */}
            <div className="side-sections-list">
              {groomSections.length === 0 ? (
                <div className="side-empty-box">
                  <p>Chưa có mục nào cho Nhà Trai.</p>
                  <button
                    type="button"
                    className="side-add-first-btn"
                    onClick={() => onOpenAddSection('groom')}
                  >
                    + Tạo giai đoạn cho Nhà Trai
                  </button>
                </div>
              ) : (
                groomSections.map((sec) => {
                  const secTracks = groomTracks.filter((t) => t.sectionId === sec.id);
                  return (
                    <SectionCard
                      key={`groom_${sec.id}`}
                      section={sec}
                      tracks={secTracks}
                      onEditSection={onEditSection}
                      onAddTrack={(sId) => onAddTrack(sId, 'groom')}
                      onEditTrack={onEditTrack}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            RIGHT COLUMN: NHÀ GÁI (BRIDE'S SIDE)
            ======================================================== */}
        {(activeSideView === 'split' || activeSideView === 'bride') && (
          <div className="side-column side-column--bride">
            {/* Column Header */}
            <div className="side-column-header">
              <div className="side-header-info">
                <div className="side-avatar-badge side-avatar-badge--bride">
                  <span>👰</span>
                </div>
                <div>
                  <div className="side-role-tag">HỌ NHÀ GÁI</div>
                  <h3 className="side-person-name">
                    {meta.brideName || (meta.couple ? meta.couple.split('&')[1]?.trim() : 'Cô Dâu')}
                  </h3>
                  {meta.brideMusicStyle && (
                    <p className="side-style-note">🎵 {meta.brideMusicStyle}</p>
                  )}
                </div>
              </div>

              <div className="side-header-actions">
                <div className="side-stats-chip">
                  <b>{brideTracks.length}</b> bài · {formatDuration(brideTotalSeconds)}
                </div>
                <button
                  type="button"
                  className="side-action-add-btn side-action-add-btn--bride"
                  onClick={() => onAddTrack(brideSections[0]?.id || sections[0]?.id, 'bride')}
                  title="Thêm bài hát mới theo sở thích Nhà Gái"
                >
                  <PlusIcon />
                  <span>+ Bài Nhà Gái</span>
                </button>
              </div>
            </div>

            {/* Sections & Tracks of Bride */}
            <div className="side-sections-list">
              {brideSections.length === 0 ? (
                <div className="side-empty-box">
                  <p>Chưa có mục nào cho Nhà Gái.</p>
                  <button
                    type="button"
                    className="side-add-first-btn"
                    onClick={() => onOpenAddSection('bride')}
                  >
                    + Tạo giai đoạn cho Nhà Gái
                  </button>
                </div>
              ) : (
                brideSections.map((sec) => {
                  const secTracks = brideTracks.filter((t) => t.sectionId === sec.id);
                  return (
                    <SectionCard
                      key={`bride_${sec.id}`}
                      section={sec}
                      tracks={secTracks}
                      onEditSection={onEditSection}
                      onAddTrack={(sId) => onAddTrack(sId, 'bride')}
                      onEditTrack={onEditTrack}
                    />
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
