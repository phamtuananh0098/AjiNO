import React, { useState, useEffect } from 'react';
import { usePlaylist } from '../../state/playlistContext';
import { useToast } from '../../state/toastContext';
import { CloseIcon, CheckIcon, SettingsIcon } from '../common/Icons';

interface WeddingConfigModalProps {
  open: boolean;
  onClose: () => void;
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
      setGroomName(playlist.meta.groomName || 'Minh Quân (Họ Nhà Trai)');
      setBrideName(playlist.meta.brideName || 'Thùy Dung (Họ Nhà Gái)');
      setGroomMusicStyle(playlist.meta.groomMusicStyle || 'Pop Rock, Acoustic, Ballad vui tươi, Gu nhạc chú rể');
      setBrideMusicStyle(playlist.meta.brideMusicStyle || 'Ballad lãng mạn, Nhạc Hoa, K-Pop, Gu nhạc cô dâu');
      setDate(playlist.meta.date || '');
      setTime(playlist.meta.time || '');
      setVenue(playlist.meta.venue || '');
      setNote(playlist.meta.note || '');
    }
  }, [open, playlist.meta]);

  if (!open) return null;

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
          <div className="form-group">
            <label className="form-label">Tên cặp đôi hiển thị chung *</label>
            <input
              type="text"
              className="form-input form-input--lg"
              placeholder="Ví dụ: Minh Quân & Thùy Dung"
              value={couple}
              onChange={(e) => setCouple(e.target.value)}
              required
            />
          </div>

          {/* Dual Side Personalization Group */}
          <div className="config-dual-box">
            {/* Groom side */}
            <div className="config-side-col config-side-col--groom">
              <div className="config-side-title">
                <span>🤵</span>
                <b>HỌ NHÀ TRAI</b>
              </div>
              <div className="form-group">
                <label className="form-label">Tên đại diện Chú Rể / Nhà Trai</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Minh Quân"
                  value={groomName}
                  onChange={(e) => setGroomName(e.target.value)}
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
                <b>HỌ NHÀ GÁI</b>
              </div>
              <div className="form-group">
                <label className="form-label">Tên đại diện Cô Dâu / Nhà Gái</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ví dụ: Thùy Dung"
                  value={brideName}
                  onChange={(e) => setBrideName(e.target.value)}
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

          <div className="form-group">
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
