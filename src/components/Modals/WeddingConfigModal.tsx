import React, { useState, useEffect } from 'react';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { CloseIcon, CheckIcon, SettingsIcon } from '../common/Icons';

interface WeddingConfigModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Parses couple string like "Minh Quân & Thùy Dung", "Minh Quân - Thùy Dung",
 * "Quân và Dung", "Tuấn + Mai", "Anh x Phương" into Groom & Bride names.
 */
function parseCoupleNames(coupleStr: string): { groom: string; bride: string } | null {
  if (!coupleStr || !coupleStr.trim()) return null;
  // Match delimiters: &, và, va, -, –, —, +, /, x, X, ❤️, 💍
  const delimiterRegex = /\s*(?:&|\s+(?:và|va|v[aà]|x)\s+|\-|\–|\—|\+|\/|❤️|💍)\s*/i;
  const parts = coupleStr.split(delimiterRegex);
  if (parts.length >= 2) {
    const groom = parts[0].trim();
    const bride = parts.slice(1).join(' & ').trim();
    if (groom && bride) {
      return { groom, bride };
    }
  }
  return null;
}

export const WeddingConfigModal: React.FC<WeddingConfigModalProps> = ({ open, onClose }) => {
  const { playlist, updateMeta } = usePlaylist();
  const { pushToast } = useToast();

  const [title, setTitle] = useState('');
  const [couple, setCouple] = useState('');
  const [groomName, setGroomName] = useState('');
  const [brideName, setBrideName] = useState('');
  const [groomMusicStyle, setGroomMusicStyle] = useState('');
  const [brideMusicStyle, setBrideMusicStyle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setTitle(playlist.meta.title || '');
      setCouple(playlist.meta.couple || '');
      setGroomName(playlist.meta.groomName || 'Minh Quân');
      setBrideName(playlist.meta.brideName || 'Thùy Dung');
      setGroomMusicStyle(playlist.meta.groomMusicStyle || 'Pop Rock, Acoustic, Ballad vui tươi, Gu nhạc chú rể');
      setBrideMusicStyle(playlist.meta.brideMusicStyle || 'Ballad lãng mạn, Nhạc Hoa, K-Pop, Gu nhạc cô dâu');
      setDate(playlist.meta.date || '');
      setTime(playlist.meta.time || '');
      setVenue(playlist.meta.venue || '');
      setNote(playlist.meta.note || '');
    }
  }, [open, playlist.meta]);

  if (!open) return null;

  // 1. When editing Couple Name -> Auto parse & update groomName & brideName
  const handleCoupleChange = (val: string) => {
    setCouple(val);
    const parsed = parseCoupleNames(val);
    if (parsed) {
      setGroomName(parsed.groom);
      setBrideName(parsed.bride);
    }
  };

  // 2. When editing Groom Name -> Auto sync to Couple Name
  const handleGroomNameChange = (val: string) => {
    setGroomName(val);
    if (val.trim() && brideName.trim()) {
      setCouple(`${val.trim()} & ${brideName.trim()}`);
    } else if (val.trim()) {
      setCouple(val.trim());
    }
  };

  // 3. When editing Bride Name -> Auto sync to Couple Name
  const handleBrideNameChange = (val: string) => {
    setBrideName(val);
    if (groomName.trim() && val.trim()) {
      setCouple(`${groomName.trim()} & ${val.trim()}`);
    } else if (val.trim()) {
      setCouple(val.trim());
    }
  };

  // 4. Swap Groom & Bride Names and Music Styles
  const handleSwapSides = () => {
    const newGroom = brideName;
    const newBride = groomName;
    const newGroomStyle = brideMusicStyle;
    const newBrideStyle = groomMusicStyle;

    setGroomName(newGroom);
    setBrideName(newBride);
    setGroomMusicStyle(newGroomStyle);
    setBrideMusicStyle(newBrideStyle);

    if (newGroom.trim() && newBride.trim()) {
      setCouple(`${newGroom.trim()} & ${newBride.trim()}`);
    } else if (newGroom.trim()) {
      setCouple(newGroom.trim());
    } else if (newBride.trim()) {
      setCouple(newBride.trim());
    }

    pushToast('Đã hoán đổi vị trí Nhà Trai ⇄ Nhà Gái thành công!', 'success');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMeta({
      title: title.trim(),
      couple: couple.trim(),
      groomName: groomName.trim(),
      brideName: brideName.trim(),
      groomMusicStyle: groomMusicStyle.trim(),
      brideMusicStyle: brideMusicStyle.trim(),
      date: date.trim(),
      time: time.trim(),
      venue: venue.trim(),
      note: note.trim(),
    });
    pushToast('Đã lưu thông tin cá nhân hoá tiệc cưới 2 bên thành công!', 'success');
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog--lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <SettingsIcon className="text-amber-500 w-5 h-5" />
            <h3 className="modal-title">Cá Nhân Hoá Đám Cưới: Nhà Trai & Nhà Gái</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Main Couple Name Input with Auto-Parse */}
          <div className="form-group">
            <div className="flex items-center justify-between">
              <label className="form-label font-bold text-base">Tên cặp đôi hiển thị chung *</label>
              <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                ⚡ Tự động phân tích 2 bên
              </span>
            </div>
            <input
              type="text"
              className="form-input form-input--lg font-serif text-lg font-bold"
              placeholder="Ví dụ: Minh Quân & Thùy Dung (hoặc Quân và Dung)"
              value={couple}
              onChange={(e) => handleCoupleChange(e.target.value)}
              required
            />
            <span className="form-hint text-xs text-gray-500 mt-1 block">
              💡 Gợi ý: Gõ <b>Tên Chú Rể & Tên Cô Dâu</b> (dùng <code>&</code>, <code>và</code>, <code>-</code> hoặc <code>+</code>) hệ thống sẽ tự động cập nhật xuống 2 bên Nhà Trai và Nhà Gái bên dưới.
            </span>
          </div>

          {/* Quick Swap Toolbar */}
          <div className="swap-sides-bar">
            <div className="swap-sides-info">
              <span className="swap-hint-icon">💍</span>
              <span className="swap-hint-text">
                Bên trái: <b>🤵 Nhà Trai</b> · Bên phải: <b>👰 Nhà Gái</b>
              </span>
            </div>
            <button
              type="button"
              className="swap-sides-btn"
              onClick={handleSwapSides}
              title="Hoán đổi tên và thông tin giữa Nhà Trai và Nhà Gái"
            >
              <span className="swap-btn-icon">⇄</span>
              <span>Hoán đổi Nhà Trai ⇄ Nhà Gái</span>
            </button>
          </div>

          {/* Dual Side Personalization Group */}
          <div className="config-dual-box">
            {/* Groom side */}
            <div className="config-side-col config-side-col--groom">
              <div className="config-side-title">
                <span>🤵</span>
                <b>HỌ NHÀ TRAI (CHÚ RỂ)</b>
              </div>
              <div className="form-group">
                <label className="form-label">Tên đại diện Chú Rể / Nhà Trai</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Minh Quân"
                  value={groomName}
                  onChange={(e) => handleGroomNameChange(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sở thích & Gu âm nhạc Nhà Trai</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Pop Rock, Acoustic, Nhạc hội bạn quẩy..."
                  value={groomMusicStyle}
                  onChange={(e) => setGroomMusicStyle(e.target.value)}
                />
              </div>
            </div>

            {/* Bride side */}
            <div className="config-side-col config-side-col--bride">
              <div className="config-side-title">
                <span>👰</span>
                <b>HỌ NHÀ GÁI (CÔ DÂU)</b>
              </div>
              <div className="form-group">
                <label className="form-label">Tên đại diện Cô Dâu / Nhà Gái</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Thùy Dung"
                  value={brideName}
                  onChange={(e) => handleBrideNameChange(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Sở thích & Gu âm nhạc Nhà Gái</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Ballad ngọt ngào, Nhạc Hoa, K-Pop..."
                  value={brideMusicStyle}
                  onChange={(e) => setBrideMusicStyle(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="form-group mt-3">
            <label className="form-label">Tiêu đề buổi lễ / Buổi tiệc</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Lễ Thành Hôn & Dạ Tiệc Cưới"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-row-2">
            <div className="form-group">
              <label className="form-label">Ngày tổ chức</label>
              <input
                type="date"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Giờ khai tiệc</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ví dụ: 18:00 (Đón khách 17:30)"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Địa điểm / Sảnh tiệc cưới</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Grand Palace Ballroom · Sảnh Ánh Dương"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Ghi chú chung cho Kỹ thuật viên & MC</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Ví dụ: Chú ý phối hợp các bài của Nhà Trai lúc rước dâu và Nhà Gái lúc bước vào lễ đường..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-btn">
              <CheckIcon />
              <span>Lưu thông tin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
