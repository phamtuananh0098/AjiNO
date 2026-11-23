import React, { useState, useRef } from 'react';
import type { WeddingSide } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { importGoogleDriveAudio } from '../../services/api';
import { detectLinkMetadata, extractDriveFileId } from '../../services/linkDetector';
import {
  GoogleDriveIcon,
  CloseIcon,
  DownloadIcon,
  SparklesIcon,
} from '../common/Icons';

interface GoogleDriveModalProps {
  open: boolean;
  onClose: () => void;
}

export const GoogleDriveModal: React.FC<GoogleDriveModalProps> = ({ open, onClose }) => {
  const { playlist, addTrack } = usePlaylist();
  const { pushToast } = useToast();

  const [driveUrl, setDriveUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [side, setSide] = useState<WeddingSide>('both');
  const [targetSectionId, setTargetSectionId] = useState(playlist.sections[0]?.id || '');
  const [isImporting, setIsImporting] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);

  const debounceTimerRef = useRef<any>(null);

  if (!open) return null;

  const handleAutoDetect = async (urlStr: string) => {
    const trimmed = urlStr.trim();
    if (!trimmed) return;
    setIsDetecting(true);
    try {
      const info = await detectLinkMetadata(trimmed);
      if (info && info.ok) {
        if (info.title && !songTitle) setSongTitle(info.title);
        if (info.artist && !songArtist) setSongArtist(info.artist);
        pushToast(`✨ Đã nhận diện tên tệp: "${info.title}"`, 'success');
      }
    } catch {}
    finally {
      setIsDetecting(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDriveUrl(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim().length > 15 && val.includes('drive.google.com')) {
      debounceTimerRef.current = setTimeout(() => {
        handleAutoDetect(val);
      }, 500);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.trim()) {
      setDriveUrl(pasted.trim());
      setTimeout(() => handleAutoDetect(pasted.trim()), 50);
    }
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      pushToast('Vui lòng nhập đường dẫn Google Drive', 'error');
      return;
    }

    const driveId = extractDriveFileId(driveUrl);
    setIsImporting(true);
    try {
      const res = await importGoogleDriveAudio(driveUrl, songTitle || 'DriveAudio.mp3');
      if (res.ok && res.audio) {
        addTrack({
          sectionId: targetSectionId || playlist.sections[0]?.id || '',
          side,
          title: songTitle.trim() || res.audio.name.replace(/\.[^/.]+$/, ''),
          artist: songArtist.trim(),
          platform: 'gdrive',
          url: res.audio.url,
          audioId: res.audio.id,
          fileName: res.audio.name,
          thumbnail: driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w600` : undefined,
          note: 'Lưu trữ từ Google Drive',
          favorite: false,
          trimStart: 0,
          trimEnd: null,
          duration: null,
          volumeOffset: 0,
          fadeIn: 2,
          fadeOut: 2,
        });

        pushToast('Đã nạp và lưu trữ bài hát từ Google Drive thành công!', 'success');
        onClose();
      } else {
        // Fallback: add stream directly so the user is never blocked
        if (driveId) {
          addTrack({
            sectionId: targetSectionId || playlist.sections[0]?.id || '',
            side,
            title: songTitle.trim() || `Nhạc Google Drive (${driveId.slice(0, 8)})`,
            artist: songArtist.trim(),
            platform: 'gdrive',
            url: `/api/gdrive/stream?id=${driveId}`,
            fileName: `${songTitle || 'DriveAudio'}.mp3`,
            thumbnail: `https://drive.google.com/thumbnail?id=${driveId}&sz=w600`,
            note: 'Phát trực tuyến Google Drive',
            favorite: false,
            trimStart: 0,
            trimEnd: null,
            duration: null,
            volumeOffset: 0,
            fadeIn: 2,
            fadeOut: 2,
          });
          pushToast('Đã thêm bài hát Google Drive vào danh sách tiệc cưới!', 'success');
          onClose();
        } else {
          throw new Error(res.error || 'Không thể đọc tệp từ liên kết đã nhập');
        }
      }
    } catch (err: any) {
      if (driveId) {
        addTrack({
          sectionId: targetSectionId || playlist.sections[0]?.id || '',
          side,
          title: songTitle.trim() || `Nhạc Google Drive (${driveId.slice(0, 8)})`,
          artist: songArtist.trim(),
          platform: 'gdrive',
          url: `/api/gdrive/stream?id=${driveId}`,
          fileName: `${songTitle || 'DriveAudio'}.mp3`,
          thumbnail: `https://drive.google.com/thumbnail?id=${driveId}&sz=w600`,
          note: 'Phát trực tuyến Google Drive',
          favorite: false,
          trimStart: 0,
          trimEnd: null,
          duration: null,
          volumeOffset: 0,
          fadeIn: 2,
          fadeOut: 2,
        });
        pushToast('Đã thêm bài hát Google Drive vào danh sách!', 'success');
        onClose();
      } else {
        pushToast('Lỗi: ' + err.message, 'error');
      }
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <GoogleDriveIcon className="text-amber-500 w-5 h-5" />
            <h3 className="modal-title">Nhập Nhạc Từ Google Drive</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleImport} className="modal-form">
          <div className="gdrive-guide-card">
            <h4>💡 Cách lấy đường dẫn từ Google Drive:</h4>
            <ol>
              <li>Nhấp chuột phải vào tệp nhạc trên Google Drive → chọn <b>Chia sẻ</b>.</li>
              <li>Tại mục <i>Quyền truy cập chung</i>, chọn <b>Bất kỳ ai có đường liên kết</b>.</li>
              <li>Bấm <b>Sao chép đường liên kết</b> và dán vào ô bên dưới.</li>
            </ol>
          </div>

          <div className="form-group">
            <label className="form-label">Đường dẫn tệp Google Drive *</label>
            <div className="flex-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
                value={driveUrl}
                onChange={handleUrlChange}
                onPaste={handlePaste}
                required
              />
              <button
                type="button"
                className="auto-detect-btn"
                onClick={() => handleAutoDetect(driveUrl)}
                disabled={isDetecting}
                title="Nhận diện tên bài hát từ liên kết"
              >
                <SparklesIcon className="w-4 h-4 text-amber-500" />
                <span>{isDetecting ? 'Đang đọc...' : 'Nhận diện'}</span>
              </button>
            </div>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tên bài hát</label>
              <input
                type="text"
                className="form-input"
                placeholder="Để trống sẽ tự lấy tên tệp"
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nghệ sĩ</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Bằng Kiều, Uyên Linh..."
                value={songArtist}
                onChange={(e) => setSongArtist(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Giai đoạn tiệc cưới đưa bài vào</label>
            <select
              className="form-select"
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
            >
              {playlist.sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.order}. {sec.name}
                </option>
              ))}
            </select>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-btn" disabled={isImporting}>
              <DownloadIcon />
              <span>{isImporting ? 'Đang kéo tệp về...' : 'Nhập vào kịch bản'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
