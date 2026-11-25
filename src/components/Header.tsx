import React, { useRef, useState, useEffect } from 'react';
import type { DeviceMode } from '../types';
import { usePlaylist } from '../state/playlistContext';
import {
  CloudCheckIcon,
  CloudSyncIcon,
  QrCodeIcon,
  PrinterIcon,
  DownloadIcon,
  UploadIcon,
  GoogleDriveIcon,
  SettingsIcon,
  SparklesIcon,
} from './common/Icons';

interface HeaderProps {
  onOpenConfig: () => void;
  onOpenQR: () => void;
  onOpenPrint: () => void;
  onOpenDrive: () => void;
  deviceMode: DeviceMode;
  effectiveDevice?: 'pc' | 'phone' | 'ipad' | 'tv';
  onSelectDevice: (mode: DeviceMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConfig,
  onOpenQR,
  onOpenPrint,
  onOpenDrive,
  deviceMode,
  effectiveDevice = 'pc',
  onSelectDevice,
}) => {
  const { playlist, syncState, clientCount, exportProject, importProject } = usePlaylist();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const lastScrollY = useRef(0);

  // Auto-hide header when scrolling down on phone/mobile
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Always show at top of page
      if (currentScrollY <= 30) {
        setIsHeaderVisible(true);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Scrolling down significantly -> hide header
      if (currentScrollY > lastScrollY.current + 12 && currentScrollY > 60) {
        setIsHeaderVisible(false);
      }
      // Scrolling up significantly -> reveal header
      else if (currentScrollY < lastScrollY.current - 10) {
        setIsHeaderVisible(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        importProject(parsed);
      } catch (err) {
        alert('Tệp không hợp lệ: ' + (err as any).message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
    setShowMobileMenu(false);
  };

  return (
    <>
      <header className={`header-masthead ${!isHeaderVisible ? 'header-masthead--hidden' : ''}`}>
        <div className="header-container">
          {/* Left: Brand & Couple Name */}
          <div className="header-brand">
            <div className="header-logo-icon">
              <SparklesIcon className="icon-sparkle" />
            </div>
            <div className="header-brand-text">
              <div className="header-sub">Wedding Playlist Studio · AjiNO</div>
              <h1 className="header-title">
                Duyên Ca <span className="header-divider">—</span>{' '}
                <span className="header-couple">{playlist.meta.couple || 'Cô Dâu & Chú Rể'}</span>
              </h1>
            </div>
          </div>

          {/* Right: Actions & Switchers */}
          <div className="header-actions">
            {/* Device View Mode Switcher */}
            <div className="device-switcher-pill" title="Chuyển đổi giao diện phù hợp với từng thiết bị">
              <button
                type="button"
                className={`device-btn ${deviceMode === 'auto' ? 'active' : ''}`}
                onClick={() => onSelectDevice('auto')}
                title={`Tự động nhận diện thiết bị (Đang phát hiện: ${effectiveDevice === 'phone' ? '📱 Điện thoại' : effectiveDevice === 'ipad' ? '📱 iPad' : '💻 Máy tính'})`}
              >
                <span>⚡ Tự động {deviceMode === 'auto' && `(${effectiveDevice === 'phone' ? '📱' : effectiveDevice === 'ipad' ? '📱' : '💻'})`}</span>
              </button>
              <button
                type="button"
                className={`device-btn ${deviceMode === 'pc' ? 'active' : ''}`}
                onClick={() => onSelectDevice('pc')}
                title="Giao diện chuẩn Máy tính (PC / Laptop)"
              >
                <span>💻 PC</span>
              </button>
              <button
                type="button"
                className={`device-btn ${deviceMode === 'phone' ? 'active' : ''}`}
                onClick={() => onSelectDevice('phone')}
                title="Giao diện Điện thoại (Phone)"
              >
                <span>📱 Phone</span>
              </button>
              <button
                type="button"
                className={`device-btn ${deviceMode === 'ipad' ? 'active' : ''}`}
                onClick={() => onSelectDevice('ipad')}
                title="Giao diện Máy tính bảng (iPad / Tablet)"
              >
                <span>📱 iPad</span>
              </button>
              <button
                type="button"
                className={`device-btn device-btn--tv ${deviceMode === 'tv' ? 'active' : ''}`}
                onClick={() => onSelectDevice('tv')}
                title="Chế độ Sân khấu / Smart TV / Màn hình LED lớn"
              >
                <span>📺 TV Sân Khấu</span>
              </button>
            </div>

            {/* Sync status indicator */}
            <div className={`sync-pill sync-pill--${syncState}`}>
              {syncState === 'saving' ? (
                <>
                  <CloudSyncIcon className="sync-icon spin" />
                  <span className="sync-label">Đang lưu...</span>
                </>
              ) : syncState === 'synced' || syncState === 'saved' ? (
                <>
                  <CloudCheckIcon className="sync-icon" />
                  <span className="sync-label">Đồng bộ tự động</span>
                </>
              ) : (
                <>
                  <span className="offline-dot" />
                  <span className="sync-label">Ngoại tuyến</span>
                </>
              )}

              {clientCount > 1 && (
                <span className="device-count-badge" title="Số thiết bị đang mở cùng lúc">
                  {clientCount} thiết bị
                </span>
              )}
            </div>

            {/* Desktop Action Buttons (Hidden on phone to save screen space) */}
            <div className="header-desktop-actions">
              <button
                type="button"
                className="action-btn action-btn--accent"
                onClick={onOpenQR}
                title="Kết nối điện thoại thông minh qua mã QR"
              >
                <QrCodeIcon />
                <span className="btn-text">Điện thoại</span>
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={onOpenDrive}
                title="Nhập nhạc từ Google Drive"
              >
                <GoogleDriveIcon />
                <span className="btn-text">Google Drive</span>
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={onOpenPrint}
                title="In kịch bản âm thanh tiệc cưới (Cue Sheet) cho MC / DJ"
              >
                <PrinterIcon />
                <span className="btn-text">In kịch bản</span>
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={exportProject}
                title="Sao lưu dự án cưới ra tệp .duyenca"
              >
                <DownloadIcon />
                <span className="btn-text">Sao lưu</span>
              </button>

              <button
                type="button"
                className="action-btn"
                onClick={() => fileInputRef.current?.click()}
                title="Nạp dự án đã lưu từ tệp .duyenca"
              >
                <UploadIcon />
                <span className="btn-text">Khôi phục</span>
              </button>

              <button
                type="button"
                className="action-btn action-btn--icon-only"
                onClick={onOpenConfig}
                title="Cài đặt thông tin tiệc cưới"
              >
                <SettingsIcon />
              </button>
            </div>

            {/* Mobile Hamburger / Menu Toggle Button */}
            <button
              type="button"
              className="mobile-menu-toggle-btn"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              title="Mở menu tính năng nhanh"
            >
              <span>{showMobileMenu ? '✕' : '☰'}</span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".duyenca,.json"
          style={{ display: 'none' }}
          onChange={handleImportFile}
        />
      </header>

      {/* Mobile Drawer Menu Modal */}
      {showMobileMenu && (
        <div className="mobile-menu-backdrop" onClick={() => setShowMobileMenu(false)}>
          <div className="mobile-menu-sheet" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <span className="mobile-menu-title">💐 Tùy Chọn Studio Cưới</span>
              <button
                type="button"
                className="mobile-menu-close"
                onClick={() => setShowMobileMenu(false)}
              >
                ✕
              </button>
            </div>

            <div className="mobile-menu-list">
              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenConfig();
                }}
              >
                <SettingsIcon className="w-5 h-5 text-amber-600" />
                <div className="mobile-menu-item-text">
                  <span className="item-title">Cài đặt thông tin tiệc cưới</span>
                  <span className="item-desc">Tên cô dâu chú rể, ngày cưới, sảnh tiệc, giao diện</span>
                </div>
              </button>

              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenQR();
                }}
              >
                <QrCodeIcon className="w-5 h-5 text-purple-600" />
                <div className="mobile-menu-item-text">
                  <span className="item-title">Mã QR kết nối điện thoại</span>
                  <span className="item-desc">Quét mã để mở trên thiết bị khác tức thì</span>
                </div>
              </button>

              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenDrive();
                }}
              >
                <GoogleDriveIcon className="w-5 h-5 text-emerald-600" />
                <div className="mobile-menu-item-text">
                  <span className="item-title">Nhập nhạc từ Google Drive</span>
                  <span className="item-desc">Đồng bộ file nhạc từ kho lưu trữ đám mây</span>
                </div>
              </button>

              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  onOpenPrint();
                }}
              >
                <PrinterIcon className="w-5 h-5 text-blue-600" />
                <div className="mobile-menu-item-text">
                  <span className="item-title">In Kịch Bản Âm Thanh (Cue Sheet)</span>
                  <span className="item-desc">Bản in chuẩn cho MC, DJ và quản lý tiệc cưới</span>
                </div>
              </button>

              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  setShowMobileMenu(false);
                  exportProject();
                }}
              >
                <DownloadIcon className="w-5 h-5 text-indigo-600" />
                <div className="mobile-menu-item-text">
                  <span className="item-title">Sao lưu dự án (.duyenca)</span>
                  <span className="item-desc">Tải tệp sao lưu về máy để giữ an toàn 100%</span>
                </div>
              </button>

              <button
                type="button"
                className="mobile-menu-item"
                onClick={() => {
                  fileInputRef.current?.click();
                }}
              >
                <UploadIcon className="w-5 h-5 text-teal-600" />
                <div className="mobile-menu-item-text">
                  <span className="item-title">Khôi phục dự án đã lưu</span>
                  <span className="item-desc">Nạp lại danh sách từ tệp .duyenca</span>
                </div>
              </button>

              {/* Mobile Device Mode Switcher */}
              <div className="mobile-menu-device-section">
                <span className="mobile-menu-section-label">
                  Thiết bị hiển thị (Đang phát hiện: {effectiveDevice === 'phone' ? '📱 Điện thoại' : effectiveDevice === 'ipad' ? '📱 iPad' : '💻 Máy tính'})
                </span>
                <div className="mobile-device-grid">
                  <button
                    type="button"
                    className={`mobile-device-chip ${deviceMode === 'auto' ? 'active' : ''}`}
                    onClick={() => {
                      onSelectDevice('auto');
                      setShowMobileMenu(false);
                    }}
                  >
                    ⚡ Tự động ({effectiveDevice === 'phone' ? '📱' : effectiveDevice === 'ipad' ? '📱' : '💻'})
                  </button>
                  <button
                    type="button"
                    className={`mobile-device-chip ${deviceMode === 'phone' ? 'active' : ''}`}
                    onClick={() => {
                      onSelectDevice('phone');
                      setShowMobileMenu(false);
                    }}
                  >
                    📱 Điện thoại
                  </button>
                  <button
                    type="button"
                    className={`mobile-device-chip ${deviceMode === 'ipad' ? 'active' : ''}`}
                    onClick={() => {
                      onSelectDevice('ipad');
                      setShowMobileMenu(false);
                    }}
                  >
                    📱 iPad / Tablet
                  </button>
                  <button
                    type="button"
                    className={`mobile-device-chip ${deviceMode === 'pc' ? 'active' : ''}`}
                    onClick={() => {
                      onSelectDevice('pc');
                      setShowMobileMenu(false);
                    }}
                  >
                    💻 Máy tính
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
