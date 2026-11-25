import React, { useState, useRef, useEffect } from 'react';
import type { Track, WeddingSide } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { fetchLinkInfo, importGoogleDriveAudio } from '../../services/api';
import { extractDriveFileId } from '../../services/linkDetector';
import {
  CloseIcon,
  PlayIcon,
  PauseIcon,
  ScissorsIcon,
  CheckIcon,
  HeartIcon,
  SparklesIcon,
  GoogleDriveIcon,
  DownloadIcon,
} from '../common/Icons';

interface EditTrackModalProps {
  track: Track | null;
  open: boolean;
  onClose: () => void;
}

function formatSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.floor((sec % 1) * 10);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
}

export const EditTrackModal: React.FC<EditTrackModalProps> = ({
  track,
  open,
  onClose,
}) => {
  const { updateTrack, moveTrack, playlist } = usePlaylist();
  const { pushToast } = useToast();

  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [side, setSide] = useState<WeddingSide>('both');
  const [sectionId, setSectionId] = useState<string>(track?.sectionId || '');
  const [thumbnail, setThumbnail] = useState<string>('');
  const [note, setNote] = useState('');
  const [trimStart, setTrimStart] = useState<number>(0);
  const [trimEnd, setTrimEnd] = useState<number | null>(null);
  const [duration, setDuration] = useState<number>(180);
  const [volumeOffset, setVolumeOffset] = useState<number>(0);
  const [fadeIn, setFadeIn] = useState<number>(2);
  const [fadeOut, setFadeOut] = useState<number>(2);
  const [favorite, setFavorite] = useState<boolean>(false);
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [isCachingDrive, setIsCachingDrive] = useState<boolean>(false);

  const [previewPlaying, setPreviewPlaying] = useState<boolean>(false);
  const [previewTime, setPreviewTime] = useState<number>(0);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);
  const ytTimerRef = useRef<any>(null);

  const ytMatch = track?.url?.match(
    /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
  );
  const isYouTube = !!ytMatch;
  const ytId = ytMatch ? ytMatch[1] : null;

  const driveId = track?.url ? extractDriveFileId(track.url) : null;
  const isDrive = track?.platform === 'gdrive' || !!driveId;

  const sendTrimmerYtCommand = (func: string, args: any = '') => {
    const iframe = document.getElementById('duyen-ca-trimmer-yt-player') as HTMLIFrameElement | null;
    if (!iframe || !iframe.contentWindow) return;
    const payload = JSON.stringify({
      event: 'command',
      func,
      args: args !== '' ? (Array.isArray(args) ? args : [args]) : '',
    });
    iframe.contentWindow.postMessage(payload, '*');
  };

  useEffect(() => {
    if (track && open) {
      setTitle(track.title);
      setArtist(track.artist || '');
      setSide(track.side || 'both');
      setThumbnail(track.thumbnail || '');
      setNote(track.note || '');
      setTrimStart(track.trimStart || 0);
      setDuration(track.duration || 180);
      setTrimEnd(track.trimEnd != null ? track.trimEnd : (track.duration || 180));
      setVolumeOffset(track.volumeOffset || 0);
      setFadeIn(track.fadeIn != null ? track.fadeIn : 2);
      setFadeOut(track.fadeOut != null ? track.fadeOut : 2);
      setFavorite(!!track.favorite);
      setSectionId(track.sectionId || '');

      const dId = extractDriveFileId(track.url);
      const playableUrl = track.audioId
        ? `/api/audio/${track.audioId}`
        : dId
        ? `https://drive.usercontent.google.com/download?id=${dId}&export=download&confirm=t`
        : track.url;

      const audio = new Audio(playableUrl);
      audioPreviewRef.current = audio;

      const onTime = () => {
        if (!audio) return;
        setPreviewTime(audio.currentTime);
        if (trimEnd && audio.currentTime >= trimEnd) {
          audio.pause();
          setPreviewPlaying(false);
        }
      };

      const onLoadedMetadata = () => {
        if (!audio) return;
        const dur = audio.duration;
        if (Number.isFinite(dur) && dur > 0) {
          const rounded = Math.round(dur);
          setDuration(rounded);
          if (!track.trimEnd || track.trimEnd > rounded) {
            setTrimEnd(rounded);
          }
        }
      };

      const onError = () => {
        if (dId && audio && !audio.src.includes('drive.usercontent.google.com')) {
          audio.src = `https://drive.usercontent.google.com/download?id=${dId}&export=download&confirm=t`;
          audio.load();
        }
      };

      const onEnded = () => setPreviewPlaying(false);
      audio.addEventListener('timeupdate', onTime);
      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('ended', onEnded);
      audio.addEventListener('error', onError);

      return () => {
        audio.pause();
        audio.removeEventListener('timeupdate', onTime);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('ended', onEnded);
        audio.removeEventListener('error', onError);
        audioPreviewRef.current = null;
        if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      };
    }
  }, [track, open]);

  if (!open || !track) return null;

  const handleTogglePreviewClip = () => {
    if (isYouTube) {
      if (previewPlaying) {
        sendTrimmerYtCommand('pauseVideo');
        if (ytTimerRef.current) clearInterval(ytTimerRef.current);
        setPreviewPlaying(false);
      } else {
        sendTrimmerYtCommand('seekTo', [trimStart, true]);
        sendTrimmerYtCommand('playVideo');
        setPreviewPlaying(true);
        setPreviewTime(trimStart);
        let cur = trimStart;
        if (ytTimerRef.current) clearInterval(ytTimerRef.current);
        ytTimerRef.current = setInterval(() => {
          cur += 0.5;
          setPreviewTime(cur);
          if (trimEnd && cur >= trimEnd) {
            sendTrimmerYtCommand('pauseVideo');
            setPreviewPlaying(false);
            clearInterval(ytTimerRef.current);
            ytTimerRef.current = null;
          }
        }, 500);
      }
      return;
    }

    const audio = audioPreviewRef.current;
    if (!audio) return;

    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
    } else {
      audio.currentTime = trimStart;
      audio.play().then(() => setPreviewPlaying(true)).catch(() => {
        setPreviewPlaying(false);
        const dId = extractDriveFileId(track.url);
        if (dId && !audio.src.includes('drive.usercontent.google.com')) {
          audio.src = `https://drive.usercontent.google.com/download?id=${dId}&export=download&confirm=t`;
          audio.currentTime = trimStart;
          audio.play().then(() => setPreviewPlaying(true)).catch(() => {
            pushToast('Không thể phát tệp Google Drive. Vui lòng đảm bảo tệp đã chia sẻ công khai.', 'error');
          });
          return;
        }
        pushToast('Không thể phát thử đoạn nhạc. Vui lòng kiểm tra lại đường dẫn.', 'error');
      });
    }
  };

  const handleTogglePreviewFull = () => {
    if (isYouTube) {
      sendTrimmerYtCommand('seekTo', [0, true]);
      sendTrimmerYtCommand('playVideo');
      setPreviewPlaying(true);
      setPreviewTime(0);
      let cur = 0;
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      ytTimerRef.current = setInterval(() => {
        cur += 0.5;
        setPreviewTime(cur);
      }, 500);
      return;
    }

    const audio = audioPreviewRef.current;
    if (!audio) return;
    if (previewPlaying) {
      audio.pause();
      setPreviewPlaying(false);
    } else {
      audio.currentTime = 0;
      audio.play().then(() => setPreviewPlaying(true)).catch(() => {
        const dId = extractDriveFileId(track.url);
        if (dId && !audio.src.includes('drive.usercontent.google.com')) {
          audio.src = `https://drive.usercontent.google.com/download?id=${dId}&export=download&confirm=t`;
          audio.currentTime = 0;
          audio.play().then(() => setPreviewPlaying(true)).catch(() => {});
        }
      });
    }
  };

  const handleCacheToStudio = async () => {
    if (!track) return;
    const dId = extractDriveFileId(track.url);
    if (!dId && !track.url) return;

    setIsCachingDrive(true);
    try {
      const res = await importGoogleDriveAudio(track.url, `${title || 'DriveAudio'}.mp3`);
      if (res.ok && res.audio) {
        updateTrack(track.id, {
          audioId: res.audio.id,
          url: res.audio.url,
          fileName: res.audio.name,
        });
        if (audioPreviewRef.current) {
          audioPreviewRef.current.src = res.audio.url;
          audioPreviewRef.current.load();
        }
        pushToast('✨ Đã tải và lưu trữ bài hát từ Google Drive vào Studio thành công!', 'success');
      } else {
        pushToast('Lỗi tải tệp: ' + (res.error || 'Không rõ'), 'error');
      }
    } catch (err: any) {
      pushToast('Lỗi tải vào Studio: ' + err.message, 'error');
    } finally {
      setIsCachingDrive(false);
    }
  };

  const handleStopPreview = () => {
    if (isYouTube) {
      sendTrimmerYtCommand('pauseVideo');
      sendTrimmerYtCommand('seekTo', [trimStart, true]);
      if (ytTimerRef.current) clearInterval(ytTimerRef.current);
      setPreviewPlaying(false);
      setPreviewTime(trimStart);
      return;
    }

    const audio = audioPreviewRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = trimStart;
    setPreviewPlaying(false);
    setPreviewTime(trimStart);
  };

  const handleReDetect = async () => {
    let cleanUrl = track?.url?.trim() || '';
    if (!cleanUrl) {
      pushToast('Bài hát này không có liên kết web để nhận diện', 'info');
      return;
    }
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    setIsDetecting(true);
    try {
      const res = await fetchLinkInfo(cleanUrl);
      if (res.ok) {
        if (res.title) setTitle(res.title);
        if (res.artist) setArtist(res.artist);
        if (res.thumbnail) setThumbnail(res.thumbnail);
        if (res.duration) {
          setDuration(res.duration);
          if (!trimEnd || trimEnd > res.duration) setTrimEnd(res.duration);
        }
        pushToast(`✨ Đã nhận diện lại thông tin từ liên kết: "${res.title}"`, 'success');
      } else {
        pushToast(res.error || 'Không thể nhận diện liên kết', 'info');
      }
    } catch (err: any) {
      pushToast('Lỗi nhận diện: ' + err.message, 'error');
    } finally {
      setIsDetecting(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      pushToast('Vui lòng nhập tên bài hát', 'error');
      return;
    }

    const start = Math.max(0, Number(trimStart) || 0);
    const end = trimEnd ? Math.max(start + 1, Number(trimEnd)) : null;

    updateTrack(track.id, {
      title: title.trim(),
      artist: artist.trim(),
      side: side,
      thumbnail: thumbnail.trim() || undefined,
      note: note.trim(),
      trimStart: start,
      trimEnd: end,
      volumeOffset: Number(volumeOffset),
      fadeIn: Number(fadeIn),
      fadeOut: Number(fadeOut),
      favorite,
    });

    if (sectionId && sectionId !== track.sectionId) {
      moveTrack(track.id, sectionId);
    }

    handleStopPreview();
    pushToast(`Đã lưu thay đổi cho bài "${title}"`, 'success');
    onClose();
  };

  const maxDur = duration > 0 ? duration : 300;
  const clipLength = (trimEnd || maxDur) - trimStart;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <ScissorsIcon className="text-amber-500" />
            <h3 className="modal-title">Studio Cắt Nhạc & Tinh Chỉnh Bài Hát</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSave} className="modal-form">
          {/* Side Selector */}
          <div className="modal-side-selector-row">
            <span className="side-selector-label">Phía gia đình sở hữu bài hát:</span>
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

          {/* Section (Phase) Selector */}
          <div className="form-group mb-3">
            <label className="form-label font-bold text-sm">Giai đoạn phát tiệc cưới (Mục kịch bản)</label>
            <select
              className="form-input"
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
            >
              {playlist.sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.order}. {s.name} ({s.side === 'groom' ? 'Nhà Trai' : s.side === 'bride' ? 'Nhà Gái' : 'Cả Hai Bên'})
                </option>
              ))}
            </select>
            <span className="form-hint text-xs text-gray-500 mt-1 block">
              💡 Chuyển bài hát này sang giai đoạn khác nếu muốn đổi kịch bản chương trình.
            </span>
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Tên bài hát</label>
              <input
                type="text"
                className="form-input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Nghệ sĩ</label>
              <input
                type="text"
                className="form-input"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Ảnh bìa bài hát</label>
            <div className="flex-input-row">
              <input
                type="text"
                className="form-input"
                placeholder="https://... ảnh bìa bài hát"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
              />
              {track.url && /^https?:\/\//i.test(track.url) && (
                <button
                  type="button"
                  className="secondary-btn"
                  onClick={handleReDetect}
                  disabled={isDetecting}
                  title="Nhận diện lại thông tin từ liên kết gốc"
                >
                  <SparklesIcon className="w-4 h-4 text-amber-500" />
                  <span>{isDetecting ? 'Đang quét...' : 'Quét lại link'}</span>
                </button>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">
              ⚡ Ghi chú thời điểm phát (CUE cho MC / DJ đám cưới)
            </label>
            <input
              type="text"
              className="form-input form-input--cue"
              placeholder="Ví dụ: Bắt đầu phát khi cô dâu bước vào lễ đường"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          {/* Trimmer Console */}
          <div className="trimmer-studio-box">
            <div className="trimmer-header">
              <span className="trimmer-label">CẮT ĐOẠN NHẠC (TRIM AUDIO)</span>
              <span className="trimmer-duration-tag">
                Thời lượng phát: <b>{Math.round(clipLength)} giây</b> (
                {formatSec(trimStart)} → {formatSec(trimEnd || maxDur)})
              </span>
            </div>

            {isYouTube && ytId && (
              <div className="trimmer-yt-preview-box">
                <div className="trimmer-yt-badge-row">
                  <span className="link-platform-tag">YOUTUBE VIDEO</span>
                  <span className="trimmer-yt-hint">
                    ▶ Xem trước video và kiểm tra trực tiếp đoạn cắt âm thanh bên dưới
                  </span>
                </div>
                <iframe
                  id="duyen-ca-trimmer-yt-player"
                  src={`https://www.youtube-nocookie.com/embed/${ytId}?enablejsapi=1&autoplay=0&start=${Math.floor(trimStart)}`}
                  allow="autoplay; encrypted-media"
                  title="YouTube Preview"
                  className="trimmer-yt-iframe"
                />
              </div>
            )}

            {isDrive && (
              <div className="trimmer-drive-box">
                <div className="trimmer-drive-info">
                  <span className="link-platform-tag">GOOGLE DRIVE AUDIO</span>
                  <span className="trimmer-drive-desc">
                    {track.audioId
                      ? '✓ Đã lưu trữ trong Studio: phát & cắt đoạn tức thì, không lo gián đoạn'
                      : 'Đang phát trực tiếp từ Google Drive'}
                  </span>
                </div>
                {!track.audioId && (
                  <button
                    type="button"
                    className="trimmer-drive-cache-btn"
                    onClick={handleCacheToStudio}
                    disabled={isCachingDrive}
                    title="Kéo tệp từ Google Drive về lưu trữ trong Studio"
                  >
                    <DownloadIcon className="w-3.5 h-3.5" />
                    <span>{isCachingDrive ? 'Đang tải về Studio...' : 'Lưu trữ tệp vào Studio'}</span>
                  </button>
                )}
              </div>
            )}

            <div className="trimmer-visual-rail">
              <div
                className="trimmer-highlight-zone"
                style={{
                  left: `${(trimStart / maxDur) * 100}%`,
                  width: `${(clipLength / maxDur) * 100}%`,
                }}
              />
              <div
                className="trimmer-playhead"
                style={{ left: `${(previewTime / maxDur) * 100}%` }}
              />
            </div>

            <div className="trimmer-sliders-grid">
              <div className="trim-slider-col">
                <div className="slider-label-row">
                  <span>Bắt đầu (Start):</span>
                  <b>{formatSec(trimStart)}</b>
                </div>
                <input
                  type="range"
                  min="0"
                  max={Math.max(0, (trimEnd || maxDur) - 1)}
                  step="0.5"
                  value={trimStart}
                  onChange={(e) => setTrimStart(parseFloat(e.target.value))}
                  className="trim-range"
                />
              </div>

              <div className="trim-slider-col">
                <div className="slider-label-row">
                  <span>Kết thúc (End):</span>
                  <b>{formatSec(trimEnd || maxDur)}</b>
                </div>
                <input
                  type="range"
                  min={trimStart + 1}
                  max={maxDur}
                  step="0.5"
                  value={trimEnd || maxDur}
                  onChange={(e) => setTrimEnd(parseFloat(e.target.value))}
                  className="trim-range"
                />
              </div>
            </div>

            <div className="trimmer-presets-row">
              <span className="preset-label">Mẫu nhanh:</span>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setTrimStart(0);
                  setTrimEnd(60);
                }}
              >
                1 phút đầu
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setTrimStart(30);
                  setTrimEnd(90);
                }}
              >
                Điệp khúc (30s-90s)
              </button>
              <button
                type="button"
                className="preset-btn"
                onClick={() => {
                  setTrimStart(0);
                  setTrimEnd(maxDur);
                }}
              >
                Toàn bài ({Math.round(maxDur)}s)
              </button>
            </div>

            <div className="trimmer-preview-bar">
              <button
                type="button"
                className={`preview-btn ${previewPlaying ? 'active' : ''}`}
                onClick={handleTogglePreviewClip}
              >
                {previewPlaying ? <PauseIcon /> : <PlayIcon />}
                <span>{previewPlaying ? 'Tạm dừng' : 'Nghe thử đoạn cắt'}</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={handleTogglePreviewFull}
              >
                Nghe toàn bài
              </button>

              <button
                type="button"
                className="secondary-btn"
                onClick={handleStopPreview}
              >
                Dừng hẳn
              </button>
            </div>
          </div>

          <div className="form-row-3">
            <div className="form-group">
              <label className="form-label">Cân bằng âm lượng (dB)</label>
              <div className="gain-input-row">
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={volumeOffset}
                  onChange={(e) => setVolumeOffset(parseInt(e.target.value))}
                  className="gain-slider"
                />
                <span className="gain-value">
                  {volumeOffset > 0 ? `+${volumeOffset} dB` : `${volumeOffset} dB`}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Fade-in (Êm đầu)</label>
              <select
                className="form-select"
                value={fadeIn}
                onChange={(e) => setFadeIn(parseInt(e.target.value))}
              >
                <option value={0}>Không</option>
                <option value={1}>1 giây</option>
                <option value={2}>2 giây (Chuẩn)</option>
                <option value={3}>3 giây</option>
                <option value={5}>5 giây</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fade-out (Dịu đuôi)</label>
              <select
                className="form-select"
                value={fadeOut}
                onChange={(e) => setFadeOut(parseInt(e.target.value))}
              >
                <option value={0}>Không</option>
                <option value={1}>1 giây</option>
                <option value={2}>2 giây (Chuẩn)</option>
                <option value={3}>3 giây</option>
                <option value={5}>5 giây</option>
              </select>
            </div>
          </div>

          <div className="form-check-row">
            <label className="check-label">
              <input
                type="checkbox"
                checked={favorite}
                onChange={(e) => setFavorite(e.target.checked)}
              />
              <HeartIcon fillHeart={favorite} className="w-4 h-4 text-rose-500" />
              <span>Đánh dấu bài hát quan trọng / Yêu thích</span>
            </label>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="secondary-btn"
              onClick={() => {
                handleStopPreview();
                onClose();
              }}
            >
              Hủy
            </button>
            <button type="submit" className="primary-btn">
              <CheckIcon />
              <span>Lưu thay đổi kịch bản</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
