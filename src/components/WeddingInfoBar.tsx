import React, { useState } from 'react';
import { usePlaylist } from '../state/playlistContext';
import type { AppTheme, WeddingSide } from '../types';
import {
  CalendarIcon,
  MapPinIcon,
  ClockIcon,
  EditIcon,
} from './common/Icons';

interface WeddingInfoBarProps {
  onOpenConfig: () => void;
  onOpenAddTrack: (sectionId?: string, defaultSide?: WeddingSide) => void;
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const remM = m % 60;
    return `${h}g ${remM}p`;
  }
  return `${m}p ${s > 0 ? `${s}s` : ''}`;
}

export const WeddingInfoBar: React.FC<WeddingInfoBarProps> = ({
  onOpenConfig,
  onOpenAddTrack,
}) => {
  const { playlist, setTheme } = usePlaylist();
  const { meta, tracks, preferences } = playlist;
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);

  const groomTracksCount = tracks.filter((t) => t.side === 'groom' || t.side === 'both').length;
  const brideTracksCount = tracks.filter((t) => t.side === 'bride' || t.side === 'both').length;
  const totalSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);

  return (
    <section className="wedding-masthead-card">
      {/* Slim Mobile Bar (Prominent on Phone, Compact) */}
      <div className="mobile-masthead-bar">
        <div className="mobile-masthead-title-row">
          <div className="mobile-couple-names">
            <span className="couple-badge couple-badge--groom">🤵 {meta.groomName || 'Nhà Trai'}</span>
            <span className="couple-heart">💍</span>
            <span className="couple-badge couple-badge--bride">👰 {meta.brideName || 'Nhà Gái'}</span>
          </div>
          <button
            type="button"
            className="mobile-collapse-toggle-btn"
            onClick={() => setIsMobileExpanded(!isMobileExpanded)}
            title={isMobileExpanded ? 'Thu gọn chi tiết' : 'Xem thông tin chi tiết tiệc cưới'}
          >
            <span>{isMobileExpanded ? '▴ Thu gọn' : '▾ Chi tiết'}</span>
          </button>
        </div>

        <div className="mobile-quick-stats-row">
          <span className="mobile-stat-chip">🎵 {tracks.length} bài ({formatDuration(totalSeconds)})</span>
          <div className="mobile-add-btns">
            <button
              type="button"
              className="mobile-add-btn mobile-add-btn--groom"
              onClick={() => onOpenAddTrack(undefined, 'groom')}
            >
              +🤵 Trai
            </button>
            <button
              type="button"
              className="mobile-add-btn mobile-add-btn--bride"
              onClick={() => onOpenAddTrack(undefined, 'bride')}
            >
              +👰 Gái
            </button>
          </div>
        </div>
      </div>

      {/* Main Wedding Info (Always visible on PC/iPad, Collapsible on Phone) */}
      <div className={`wedding-masthead-inner ${!isMobileExpanded ? 'wedding-masthead-inner--mobile-collapsed' : ''}`}>
        {/* Main Wedding Info */}
        <div className="wedding-info-left">
          <div className="wedding-couple-row">
            <h2 className="wedding-couple-title">{meta.couple || 'Cô Dâu & Chú Rể'}</h2>
            <button
              type="button"
              className="inline-edit-btn"
              onClick={onOpenConfig}
              title="Chỉnh sửa thông tin đám cưới & gu âm nhạc 2 bên"
            >
              <EditIcon className="w-3.5 h-3.5" />
              <span>Chỉnh sửa thông tin</span>
            </button>
          </div>

          {/* Groom & Bride Dual Badges */}
          <div className="dual-side-pills-row">
            <div className="side-banner-pill side-banner-pill--groom">
              <span className="pill-icon">🤵</span>
              <div className="pill-content">
                <span className="pill-label">Nhà Trai:</span>
                <span className="pill-name">{meta.groomName || 'Họ Nhà Trai'}</span>
              </div>
            </div>

            <span className="dual-heart-symbol">💍</span>

            <div className="side-banner-pill side-banner-pill--bride">
              <span className="pill-icon">👰</span>
              <div className="pill-content">
                <span className="pill-label">Nhà Gái:</span>
                <span className="pill-name">{meta.brideName || 'Họ Nhà Gái'}</span>
              </div>
            </div>
          </div>

          <p className="wedding-ceremony-title">{meta.title || 'Lễ Thành Hôn & Dạ Tiệc Cưới'}</p>

          <div className="wedding-meta-chips">
            {meta.date && (
              <span className="meta-chip">
                <CalendarIcon />
                <span>{meta.date}</span>
              </span>
            )}
            {meta.time && (
              <span className="meta-chip">
                <ClockIcon />
                <span>{meta.time}</span>
              </span>
            )}
            {meta.venue && (
              <span className="meta-chip">
                <MapPinIcon />
                <span>{meta.venue}</span>
              </span>
            )}
          </div>

          {meta.note && <div className="wedding-note-box">"{meta.note}"</div>}
        </div>

        {/* Quick Stats & Theme */}
        <div className="wedding-info-right">
          <div className="stats-grid">
            <div className="stat-card stat-card--groom" title="Số bài thuộc sở thích Nhà Trai">
              <span className="stat-num">{groomTracksCount}</span>
              <span className="stat-label">🤵 Nhà Trai</span>
            </div>
            <div className="stat-card stat-card--bride" title="Số bài thuộc sở thích Nhà Gái">
              <span className="stat-num">{brideTracksCount}</span>
              <span className="stat-label">👰 Nhà Gái</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{tracks.length}</span>
              <span className="stat-label">Tổng bài</span>
            </div>
            <div className="stat-card">
              <span className="stat-num">{formatDuration(totalSeconds)}</span>
              <span className="stat-label">Thời lượng</span>
            </div>
          </div>

          <div className="masthead-controls">
            {/* Theme switcher */}
            <div className="theme-selector" title="Chọn giao diện màu sắc">
              {(['paper', 'night', 'champagne', 'rose'] as AppTheme[]).map((thm) => (
                <button
                  key={thm}
                  type="button"
                  className={`theme-tab-btn ${preferences.theme === thm ? 'active' : ''}`}
                  onClick={() => setTheme(thm)}
                >
                  {thm === 'paper' && '📜 Giấy ngà'}
                  {thm === 'night' && '🌙 Dạ tiệc'}
                  {thm === 'champagne' && '🥂 Sâm banh'}
                  {thm === 'rose' && '🌹 Hoa hồng'}
                </button>
              ))}
            </div>

            <div className="add-buttons-group">
              <button
                type="button"
                className="primary-add-btn primary-add-btn--groom"
                onClick={() => onOpenAddTrack(undefined, 'groom')}
                title="Thêm bài hát mới cho Nhà Trai"
              >
                <span>+ 🤵 Bài Nhà Trai</span>
              </button>
              <button
                type="button"
                className="primary-add-btn primary-add-btn--bride"
                onClick={() => onOpenAddTrack(undefined, 'bride')}
                title="Thêm bài hát mới cho Nhà Gái"
              >
                <span>+ 👰 Bài Nhà Gái</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
