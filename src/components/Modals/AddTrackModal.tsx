import React, { useState, useRef, useEffect } from 'react';
import type { AudioPlatform, Section, WeddingSide, LinkInfoResult } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { uploadAudioFile, importGoogleDriveAudio, fetchLinkInfo } from '../../services/api';
import { detectLinkMetadata, extractDriveFileId } from '../../services/linkDetector';
import { parseFilenameToMeta, probeAudioDuration } from '../../services/audioScanner';
import {
  LaptopIcon,
  SmartphoneIcon,
  GoogleDriveIcon,
  LinkIcon,
  CloseIcon,
  UploadIcon,
  CheckIcon,
  SparklesIcon,
  MusicIcon,
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

  const [platformTab, setPlatformTab] = useState<AudioPlatform>('link');
  const [side, setSide] = useState<WeddingSide>(defaultSide);
  const [targetSectionId, setTargetSectionId] = useState<string>(
    defaultSectionId || sections[0]?.id || ''
  );

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [note, setNote] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [duration, setDuration] = useState<number | null>(null);
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedInfo, setDetectedInfo] = useState<LinkInfoResult | null>(null);
  const [detectStatusMsg, setDetectStatusMsg] = useState<string>('');
  const [uploadedAudioId, setUploadedAudioId] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const debounceTimerRef = useRef<any>(null);

  useEffect(() => {
    if (open) {
      if (defaultSide) setSide(defaultSide);
      if (defaultSectionId) setTargetSectionId(defaultSectionId);
    }
  }, [open, defaultSide, defaultSectionId]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

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
        pushToast('Đang dùng tệp cục bộ trên máy', 'info');
      }
    } catch (err: any) {
      pushToast('Lỗi xử lý tệp: ' + err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoDetectLink = async (targetUrl?: string, isSilent = false) => {
    let rawUrl = (targetUrl !== undefined ? targetUrl : url).trim();
    if (!rawUrl) {
      if (!isSilent) pushToast('Vui lòng dán hoặc nhập đường link cần nhận diện', 'info');
      return;
    }

    // Auto prepend https:// if missing
    if (!/^https?:\/\//i.test(rawUrl)) {
      rawUrl = 'https://' + rawUrl;
    }
    setUrl(rawUrl);

    setIsDetecting(true);
    setDetectStatusMsg('Đang nhận diện liên kết âm nhạc...');

    try {
      // 1. Direct In-Browser Engine (resilient, instant, zero-fail)
      const clientRes = await detectLinkMetadata(rawUrl);
      if (clientRes && clientRes.ok) {
        setDetectedInfo(clientRes);
        if (clientRes.title) setTitle(clientRes.title);
        if (clientRes.artist) setArtist(clientRes.artist);
        if (clientRes.thumbnail) setThumbnail(clientRes.thumbnail);
        if (clientRes.duration && clientRes.duration > 0) {
          setDuration(clientRes.duration);
          setTrimEnd(clientRes.duration);
        }
        if (clientRes.streamUrl) {
          if (clientRes.platform !== 'gdrive') {
            setUrl(clientRes.streamUrl);
          }
          if (clientRes.streamUrl.startsWith('/api/')) {
            probeAudioDuration(clientRes.streamUrl).then((dur) => {
              if (dur > 0) {
                setDuration(dur);
                setTrimEnd(dur);
              }
            }).catch(() => {});
          }
        }

        setDetectStatusMsg(`✨ Đã nhận diện từ [${(clientRes.platform || 'Link').toUpperCase()}]: ${clientRes.title}`);
        if (!isSilent) {
          pushToast(`✨ Nhận diện thành công: "${clientRes.title}"!`, 'success');
        }
      }

      // 2. Background Enrichment (try server API if available)
      fetchLinkInfo(rawUrl)
        .then((serverRes) => {
          if (serverRes && serverRes.ok && serverRes.title) {
            if (serverRes.title && serverRes.title !== clientRes?.title) {
              setTitle(serverRes.title);
            }
            if (serverRes.artist && serverRes.artist !== clientRes?.artist) {
              setArtist(serverRes.artist);
            }
            if (serverRes.thumbnail) {
              setThumbnail(serverRes.thumbnail);
            }
            if (serverRes.streamUrl && serverRes.platform !== 'gdrive') {
              setUrl(serverRes.streamUrl);
              if (serverRes.streamUrl.startsWith('/api/')) {
                probeAudioDuration(serverRes.streamUrl).then((dur) => {
                  if (dur > 0) {
                    setDuration(dur);
                    setTrimEnd(dur);
                  }
                }).catch(() => {});
              }
            }
            setDetectedInfo(serverRes);
          }
        })
        .catch(() => {});
    } catch (err: any) {
      setDetectStatusMsg('Không thể tự động đọc metadata. Bạn vẫn có thể điền thông tin thủ công.');
      if (!isSilent) {
        pushToast('Lỗi khi nhận diện: ' + err.message, 'info');
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleUrlInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setUrl(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    const trimmed = val.trim();
    if (trimmed.length > 10 && (trimmed.includes('.') || trimmed.startsWith('http'))) {
      debounceTimerRef.current = setTimeout(() => {
        handleAutoDetectLink(trimmed, true);
      }, 500);
    }
  };

  const handlePasteUrl = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.trim()) {
      const clean = pasted.trim();
      setUrl(clean);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      setTimeout(() => handleAutoDetectLink(clean, false), 50);
    }
  };

  const handleImportDrive = async () => {
    if (!url.trim()) {
      pushToast('Vui lòng nhập đường dẫn Google Drive', 'error');
      return;
    }
    const dId = extractDriveFileId(url);
    if (!dId) {
      pushToast('Đường dẫn Google Drive không hợp lệ', 'error');
      return;
    }
    setIsUploading(true);
    try {
      // Connect directly to 24/7 cloud stream, do not store on local disk
      setUploadedAudioId(null);
      await handleAutoDetectLink(url, false);
      pushToast('Đã kết nối luồng phát 24/7 từ Google Drive thành công!', 'success');
    } catch (err: any) {
      pushToast('Lỗi nhận diện Google Drive: ' + err.message, 'error');
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

    const driveId = extractDriveFileId(url);
    const resolvedUrl = driveId
      ? `/api/gdrive/stream?id=${driveId}`
      : uploadedAudioId
      ? `/api/audio/${uploadedAudioId}`
      : url.trim();

    addTrack({
      sectionId: targetSectionId || sections[0]?.id || '',
      side: side,
      title: title.trim(),
      artist: artist.trim(),
      platform: driveId ? 'gdrive' : platformTab,
      url: resolvedUrl,
      audioId: uploadedAudioId || undefined,
      fileName: selectedFileName || (driveId ? `${title.trim() || 'Drive'}.mp3` : undefined),
      thumbnail: thumbnail || (driveId ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w600` : undefined),
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
            className={`source-tab-btn ${platformTab === 'link' ? 'active' : ''}`}
            onClick={() => setPlatformTab('link')}
          >
            <SparklesIcon className="w-4 h-4 text-amber-500" />
            <span>Dán Link Nhận Diện</span>
          </button>

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

          {/* TAB 1: DÁN LINK TỰ ĐỘNG NHẬN DIỆN */}
          {platformTab === 'link' && (
            <div className="form-group link-input-container">
              <label className="form-label">
                Liên kết bài hát (YouTube, Spotify, SoundCloud, ZingMP3, Nhaccuatui, MP3 trực tiếp...)
              </label>
              <div className="flex-input-row">
                <input
                  type="text"
                  className="form-input form-input--link"
                  placeholder="Dán link bài hát vào đây (hệ thống tự động quét ngay khi dán)..."
                  value={url}
                  onChange={handleUrlInputChange}
                  onPaste={handlePasteUrl}
                />
                <button
                  type="button"
                  className="auto-detect-btn"
                  onClick={() => handleAutoDetectLink(url, false)}
                  disabled={isDetecting}
                >
                  <SparklesIcon className="w-4 h-4 text-amber-500" />
                  <span>{isDetecting ? 'Đang quét...' : 'Nhận diện ngay'}</span>
                </button>
              </div>

              {detectStatusMsg && (
                <div className="link-status-hint">
                  {isDetecting ? (
                    <span className="text-amber-600 font-medium">⏳ {detectStatusMsg}</span>
                  ) : (
                    <span className="text-emerald-700 font-medium">{detectStatusMsg}</span>
                  )}
                </div>
              )}

              {/* Detected Link Preview Card */}
              {(detectedInfo || thumbnail) && (
                <div className="link-detect-card">
                  <div className="link-detect-thumb">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt="Cover"
                        className="link-detect-img"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="link-detect-placeholder">
                        <MusicIcon />
                      </div>
                    )}
                  </div>
                  <div className="link-detect-info">
                    <div className="link-detect-header">
                      <span className="link-platform-tag">
                        {detectedInfo?.platform?.toUpperCase() || 'LINK'}
                      </span>
                      <span className="link-detect-success-badge">
                        <CheckIcon /> Đã nhận diện thông tin
                      </span>
                    </div>
                    <div className="link-detect-title">{title || detectedInfo?.title || 'Chưa rõ tiêu đề'}</div>
                    <div className="link-detect-artist">{artist || detectedInfo?.artist || 'Chưa rõ nghệ sĩ'}</div>
                    {duration != null && duration > 0 && (
                      <div className="link-detect-dur">
                        Thời lượng: {Math.floor(duration / 60)}:{(Math.floor(duration % 60)).toString().padStart(2, '0')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <p className="form-hint">
                💡 <b>Mẹo nhanh:</b> Hỗ trợ link YouTube, YouTube Music, Spotify, SoundCloud, Zing MP3, Nhaccuatui, Google Drive & link MP3. Chỉ cần copy và dán vào là xong!
              </p>
            </div>
          )}

          {/* TAB 2 & 3: TỆP MÁY TÍNH / ĐIỆN THOẠI */}
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

              {/* Important 24/7 Cloud Guidance Box */}
              <div className="local-file-cloud-tip-box">
                <div className="tip-header">
                  <span className="tip-icon">☁️</span>
                  <b>Cách phát nhạc từ máy tính 24/7 trên Điện thoại (kể cả khi TẮT máy tính):</b>
                </div>
                <p className="tip-desc">
                  File nhạc chọn trực tiếp từ máy tính chỉ nằm trên ổ cứng này. Khi <b>tắt máy tính</b>, điện thoại sẽ không thể lấy nhạc từ máy tính đã tắt.
                </p>
                <div className="tip-steps">
                  <div>👉 <b>Giải pháp chuẩn nhất:</b> Kéo các file nhạc trên máy tính thả vào <b>Google Drive</b> (miễn phí 15GB), bật quyền <i>"Bất kỳ ai có liên kết"</i>, sau đó dán link vào tab <b>Google Drive</b>.</div>
                </div>
                <div className="tip-actions">
                  <a
                    href="https://drive.google.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tip-link-btn"
                  >
                    📂 Mở Google Drive để tải nhạc lên (15GB miễn phí) ↗
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: GOOGLE DRIVE */}
          {platformTab === 'gdrive' && (
            <div className="form-group">
              <label className="form-label">Đường dẫn tệp chia sẻ Google Drive</label>
              <div className="flex-input-row">
                <input
                  type="text"
                  className="form-input"
                  placeholder="https://drive.google.com/file/d/..."
                  value={url}
                  onChange={handleUrlInputChange}
                  onPaste={handlePasteUrl}
                />
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => handleAutoDetectLink(url, false)}
                  disabled={isDetecting}
                  title="Nhận diện tên file từ Google Drive"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-500" />
                  <span>{isDetecting ? 'Đang đọc...' : 'Nhận diện'}</span>
                </button>
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
            <label className="form-label">Ảnh bìa bài hát (URL)</label>
            <input
              type="text"
              className="form-input"
              placeholder="https://... ảnh bìa bài hát / album"
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
            />
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
            <button type="submit" className="primary-btn" disabled={isUploading || isDetecting}>
              <CheckIcon />
              <span>Hoàn tất & Thêm vào kịch bản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
