import React, { useState } from 'react';
import type { WeddingSide } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { importGoogleDriveAudio } from '../../services/api';
import {
  GoogleDriveIcon,
  CloseIcon,
  DownloadIcon,
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

  if (!open) return null;

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!driveUrl.trim()) {
      pushToast('Vui lòng nhập đường dẫn Google Drive', 'error');
      return;
    }

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
          note: 'Tải từ Google Drive',
          favorite: false,
          trimStart: 0,
          trimEnd: null,
          duration: null,
          volumeOffset: 0,
          fadeIn: 2,
          fadeOut: 2,
        });

        pushToast('Đã nạp bài hát từ Google Drive thành công!', 'success');
        onClose();
      } else {
        throw new Error(res.error || 'Không thể tải tệp');
      }
    } catch (err: any) {
      pushToast('Lỗi: ' + err.message, 'error');
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
            <input
              type="text"
              className="form-input"
              placeholder="https://drive.google.com/file/d/1A2B3C.../view?usp=sharing"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              required
            />
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
