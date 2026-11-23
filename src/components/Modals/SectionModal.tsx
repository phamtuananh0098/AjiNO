import React, { useState, useEffect } from 'react';
import type { Section, SectionTone, WeddingSide } from '../../types';
import { usePlaylist } from '../../state/playlistContext';
import { CloseIcon, CheckIcon } from '../common/Icons';

interface SectionModalProps {
  open: boolean;
  onClose: () => void;
  sectionToEdit: Section | null;
  defaultSide?: WeddingSide;
}

const TONES: Array<{ id: SectionTone; label: string; color: string }> = [
  { id: 'rose', label: 'Hoa hồng', color: '#a95f68' },
  { id: 'wine', label: 'Rượu vang', color: '#74263a' },
  { id: 'gold', label: 'Hoàng kim', color: '#b18b45' },
  { id: 'champagne', label: 'Sâm banh', color: '#c49a45' },
  { id: 'olive', label: 'Xanh ô liu', color: '#6a703f' },
  { id: 'terracotta', label: 'Đất nung', color: '#a95a3d' },
  { id: 'ink', label: 'Mực đen', color: '#2c221f' },
  { id: 'lavender', label: 'Oải hương', color: '#8874a6' },
  { id: 'navy', label: 'Xanh Navy (Nhà Trai)', color: '#1a365d' },
];

export const SectionModal: React.FC<SectionModalProps> = ({
  open,
  onClose,
  sectionToEdit,
  defaultSide = 'both',
}) => {
  const { addSection, updateSection } = usePlaylist();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tone, setTone] = useState<SectionTone>('rose');
  const [side, setSide] = useState<WeddingSide>(defaultSide);

  useEffect(() => {
    if (sectionToEdit && open) {
      setName(sectionToEdit.name);
      setDescription(sectionToEdit.description || '');
      setTone(sectionToEdit.tone || 'rose');
      setSide(sectionToEdit.side || 'both');
    } else {
      setName('');
      setDescription('');
      setTone(defaultSide === 'groom' ? 'gold' : defaultSide === 'bride' ? 'rose' : 'champagne');
      setSide(defaultSide);
    }
  }, [sectionToEdit, open, defaultSide]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (sectionToEdit) {
      updateSection(sectionToEdit.id, {
        name: name.trim(),
        description: description.trim(),
        tone,
        side,
      });
    } else {
      addSection(name.trim(), description.trim(), tone, side);
    }

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">
            {sectionToEdit ? 'Chỉnh Sửa Giai Đoạn Tiệc' : 'Thêm Giai Đoạn Tiệc Cưới Mới'}
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          {/* Side Selector */}
          <div className="modal-side-selector-row">
            <span className="side-selector-label">Giai đoạn này thuộc:</span>
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

          <div className="form-group">
            <label className="form-label">Tên giai đoạn tiệc cưới *</label>
            <input
              type="text"
              className="form-input"
              placeholder="Ví dụ: Rước dâu nhà trai, Lễ vu quy nhà gái, Cắt bánh rót rượu..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mô tả & Hướng dẫn âm thanh</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Ghi chú thể loại nhạc, âm lượng hoặc thời điểm MC cần lưu ý..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Màu sắc nhận diện (Tone)</label>
            <div className="tone-selector-grid">
              {TONES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tone-choice-btn ${tone === t.id ? 'active' : ''}`}
                  onClick={() => setTone(t.id)}
                >
                  <span
                    className="tone-dot"
                    style={{ backgroundColor: t.color }}
                  />
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>
              Hủy
            </button>
            <button type="submit" className="primary-btn">
              <CheckIcon />
              <span>{sectionToEdit ? 'Lưu thay đổi' : 'Tạo giai đoạn'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
