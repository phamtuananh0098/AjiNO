import React, { useState, useRef, useEffect } from 'react';
import type { AudioPlatform, Section, WeddingSide } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { uploadAudioFile, importGoogleDriveAudio } from '../../services/api';
import { parseFilenameToMeta, probeAudioDuration } from '../../services/audioScanner';
import {
  LaptopIcon,
  SmartphoneIcon,
  GoogleDriveIcon,
  LinkIcon,
  CloseIcon,
  UploadIcon,
  CheckIcon,
} from '../common/Icons';

interface AddTrackModalProps {
  open: boolean;
  onClose: () => void;
  defaultSectionId?: string;
  defaultSide?: WeddingSide;
  sections: Section[];
}

export const AddTrackModal: React.FC<AddTrackModalProps> = ({
  open,
  onClose,
  defaultSectionId,
  defaultSide = 'both',
  sections,
}) => {
  const { addTrack } = usePlaylist();
  const { pushToast } = useToast();

  const [platformTab, setPlatformTab] = useState<AudioPlatform>('local');
  const [side, setSide] = useState<WeddingSide>(defaultSide);
  const [targetSectionId, setTargetSectionId] = useState<string>(
    defaultSectionId || sections[0]?.id || ''
  );

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [duration, setDuration] = useState<number | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      if (defaultSide) setSide(defaultSide);
      if (defaultSectionId) setTargetSectionId(defaultSectionId);
    }
  }, [open, defaultSide, defaultSectionId]);

  if (!open) return null;

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsUploading(true);

    try {
      const dur = await probeAudioDuration(file);
      setDuration(dur);
      if (dur > 0) {
        setTrimEnd(dur);
      }

      const parsed = parseFilenameToMeta(file.name);
      if (!title) setTitle(parsed.title);
      if (!artist && parsed.artist) setArtist(parsed.artist);

      const uploadRes = await uploadAudioFile(file);
      if (uploadRes.ok && uploadRes.audio) {
        setUploadedAudioId(uploadRes.audio.id);
        setUrl(uploadRes.audio.url);
        pushToast('Đã tải tệp lên máy chủ lưu trữ thành công!', 'success');
      } else {
        const blobUrl = URL.createObjectURL(file);
        setUrl(blobUrl);
        pushToast('Đang dùng tệp cục bộ (máy chủ không khả dụng)', 'info');
      }
    } catch (err: any) {
      pushToast('Lỗi xử lý tệp: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImportDrive = async () => {
    if (!url.trim()) {
      pushToast('Vui lòng nhập đường dẫn Google Drive', 'error');
      return;
    }
    setIsUploading(true);
    try {
      const res = await importGoogleDriveAudio(url, title || 'DriveAudio.mp3');
      if (res.ok && res.audio) {
        setUploadedAudioId(res.audio.id);
        setUrl(res.audio.url);
        if (!title) setTitle(res.audio.name);
        pushToast('Đã kéo tệp từ Google Drive về máy chủ thành công!', 'success');
      } else {
        throw new Error(res.error || 'Không thể nhập tệp');
      }
    } catch (err: any) {
      pushToast('Lỗi nhập Google Drive: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      pushToast('Vui lòng nhập tên bài hát', 'error');
      return;
    }
    if (!url.trim()) {
      pushToast('Vui lòng chọn tệp âm thanh hoặc nhập liên kết', 'error');
      return;
    }

    addTrack({
      sectionId: targetSectionId || sections[0]?.id || '',
      side: side,
      title: title.trim(),
      artist: artist.trim(),
      platform: platformTab,
      url: url.trim(),
      audioId: uploadedAudioId || undefined,
      fileName: selectedFileName || undefined,
      note: note.trim(),
      favorite: false,
      trimStart: Number(trimStart) || 0,
      trimEnd: trimEnd ? Number(trimEnd) : null,
      duration: duration,
      volumeOffset: 0,
      fadeIn: 2,
      fadeOut: 2,
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Thêm bài hát vào tiệc cưới</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Side Selector (Nhà Trai vs Nhà Gái vs Cả Hai) */}
        <div className="modal-side-selector-row">
          <span className="side-selector-label">Chọn phía gia đình:</span>
          <div className="side-selector-buttons">
            <button
              type="button"
              className={`side-select-btn side-select-btn--groom ${side === 'groom' ? 'active' : ''}`}
              onClick={() => setSide('groom')}
            >
              <span>🤵 Nhà Trai</span>
            </button>
            <button
              type="button"
              className={`side-select-btn side-select-btn--bride ${side === 'bride' ? 'active' : ''}`}
              onClick={() => setSide('bride')}
            >
              <span>👰 Nhà Gái</span>
            </button>
            <button
              type="button"
              className={`side-select-btn side-select-btn--both ${side === 'both' ? 'active' : ''}`}
              onClick={() => setSide('both')}
            >
              <span>💍 Cả Hai Bên</span>
            </button>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="source-tabs-row">
          <button
            type="button"
            className={`source-tab-btn ${platformTab === 'local' ? 'active' : ''}`}
            onClick={() => setPlatformTab('local')}
          >
            <LaptopIcon />
            <span>Máy tính</span>
          </button>

          <button
            type="button"
            className={`source-tab-btn ${platformTab === 'mobile' ? 'active' : ''}`}
            onClick={() => setPlatformTab('mobile')}
          >
            <SmartphoneIcon />
            <span>Điện thoại</span>
          </button>

          <button
            type="button"
            className={`source-tab-btn ${platformTab === 'gdrive' ? 'active' : ''}`}
            onClick={() => setPlatformTab('gdrive')}
          >
            <GoogleDriveIcon />
            <span>Google Drive</span>
          </button>

          <button
            type="button"
            className={`source-tab-btn ${platformTab === 'link' ? 'active' : ''}`}
            onClick={() => setPlatformTab('link')}
          >
            <LinkIcon />
            <span>Link Web</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label className="form-label">Giai đoạn tiệc cưới</label>
            <select
              className="form-select"
              value={targetSectionId}
              onChange={(e) => setTargetSectionId(e.target.value)}
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.order}. {sec.name} {sec.side === 'groom' ? '(Nhà Trai)' : sec.side === 'bride' ? '(Nhà Gái)' : ''}
                </option>
              ))}
            </select>
          </div>

          {(platformTab === 'local' || platformTab === 'mobile') && (
            <div className="form-group">
              <label className="form-label">
                {platformTab === 'local' ? 'Chọn tệp âm thanh từ Máy tính' : 'Chọn tệp từ Điện thoại'}
              </label>
              <div
                className="file-drop-zone"
                onClick={() => fileInputRef.current?.click()}
              >
                <UploadIcon className="drop-icon" />
                <span className="drop-text">
                  {isUploading
                    ? 'Đang tải tệp lên máy chủ...'
                    : selectedFileName
                    ? `Đã chọn: ${selectedFileName}`
                    : 'Nhấn vào đây để duyệt file (MP3, WAV, FLAC, M4A, OGG)'}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg,.opus,.webm"
                  style={{ display: 'none' }}
                  onChange={handleFileChosen}
                />
              </div>
            </div>
          )}

          {platformTab === 'gdrive' && (
            <div className="form-group">
              <label className="form-label">Đường dẫn tệp chia sẻ Google Drive</label>
              <div className="flex-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleImportDrive}
                  disabled={isUploading}
                >
                  {isUploading ? 'Đang kéo...' : 'Tải về máy chủ'}
                </button>
              </div>
              <p className="form-hint">
                Tệp Google Drive cần đặt quyền "Bất kỳ ai có đường liên kết đều có thể xem".
              </p>
            </div>
          )}

          {platformTab === 'link' && (
            <div className="form-group">
              <label className="form-label">Địa chỉ URL bài hát (Trực tiếp .mp3 / luồng audio)</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/audio/song.mp3"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
          )}

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tên bài hát *</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Ánh Nắng Của Anh"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Nghệ sĩ / Ca sĩ</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: Đức Phúc"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú khoảnh khắc phát (CUE cho MC / DJ)</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Bật ngay khi cô dâu bước qua cánh cửa lễ đường"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {duration != null && duration > 0 && (
            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Bắt đầu từ (giây)</label>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.5"
                  className="form-input"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value) || 0)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Kết thúc ở (giây, để trống = hết bài)</label>
                <input
                  type="number"
                  min="0"
                  max={duration}
                  step="0.5"
                  className="form-input"
                  placeholder={`Toàn bài (${duration}s)`}
                  value={trimEnd ?? ''}
                  onChange={(e) =>
                    setTrimEnd(e.target.value ? parseFloat(e.target.value) : null)
                  }
                />
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-btn" disabled={isUploading}>
              <CheckIcon />
              <span>Hoàn tất & Thêm vào kịch bản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
