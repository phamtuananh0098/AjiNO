import React, { useRef } from 'react';
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
}

export const Header: React.FC<HeaderProps> = ({
  onOpenConfig,
  onOpenQR,
  onOpenPrint,
  onOpenDrive,
}) => {
  const { playlist, syncState, clientCount, exportProject, importProject } = usePlaylist();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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
  };

  return (
    <header className="header-masthead">
      <div className="header-container">
        {/* Left: Brand & Couple Name */}
        <div className="header-brand">
          <div className="header-logo-icon">
            <SparklesIcon className="icon-sparkle" />
          </div>
          <div>
            <div className="header-sub">Wedding Playlist Studio · AjiNO</div>
            <h1 className="header-title">
              Duyên Ca <span className="header-divider">—</span>{' '}
              <span className="header-couple">{playlist.meta.couple || 'Cô Dâu & Chú Rể'}</span>
            </h1>
          </div>
        </div>

        {/* Right: Sync Status & Action Bar */}
        <div className="header-actions">
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

          {/* Quick buttons */}
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
          <input
            ref={fileInputRef}
            type="file"
            accept=".duyenca,.json"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />

          <button
            type="button"
            className="action-btn action-btn--icon-only"
            onClick={onOpenConfig}
            title="Cài đặt thông tin tiệc cưới"
          >
            <SettingsIcon />
          </button>
        </div>
      </div>
    </header>
  );
};
