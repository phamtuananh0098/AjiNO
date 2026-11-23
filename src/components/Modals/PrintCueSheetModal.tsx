import React, { useState } from 'react';
import { usePlaylist } from '../../state/playlistContext';
import { PrinterIcon, CloseIcon } from '../common/Icons';

interface PrintCueSheetModalProps {
  open: boolean;
  onClose: () => void;
}

function formatTime(sec: number | null | undefined): string {
  if (sec == null || isNaN(sec)) return '--:--';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const PrintCueSheetModal: React.FC<PrintCueSheetModalProps> = ({ open, onClose }) => {
  const { playlist } = usePlaylist();
  const { meta, sections, tracks } = playlist;
  const [printFilter, setPrintFilter] = useState<'both' | 'groom' | 'bride'>('both');

  if (!open) return null;

  const handlePrint = () => {
    window.print();
  };

  // Filter sections and tracks based on printFilter
  const filteredSections = sections.filter((s) => {
    if (printFilter === 'both') return true;
    if (printFilter === 'groom') return s.side === 'groom' || s.side === 'both' || !s.side;
    if (printFilter === 'bride') return s.side === 'bride' || s.side === 'both' || !s.side;
    return true;
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog--sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header no-print">
          <div className="flex items-center gap-2">
            <PrinterIcon className="text-amber-500 w-5 h-5" />
            <h3 className="modal-title">Kịch Bản Âm Thanh Tiệc Cưới (Cue Sheet)</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Print filter buttons */}
            <div className="print-filter-group">
              <button
                type="button"
                className={`print-filter-btn ${printFilter === 'both' ? 'active' : ''}`}
                onClick={() => setPrintFilter('both')}
              >
                👥 Cả Hai Bên
              </button>
              <button
                type="button"
                className={`print-filter-btn ${printFilter === 'groom' ? 'active' : ''}`}
                onClick={() => setPrintFilter('groom')}
              >
                🤵 Nhà Trai
              </button>
              <button
                type="button"
                className={`print-filter-btn ${printFilter === 'bride' ? 'active' : ''}`}
                onClick={() => setPrintFilter('bride')}
              >
                👰 Nhà Gái
              </button>
            </div>

            <button type="button" className="primary-btn" onClick={handlePrint}>
              <PrinterIcon />
              <span>In ra giấy / Xuất PDF</span>
            </button>
            <button type="button" className="modal-close-btn" onClick={onClose}>
              <CloseIcon />
            </button>
          </div>
        </div>

        {/* Printable Sheet View */}
        <div className="print-document-container">
          <div className="print-sheet-header">
            <div className="print-brand-tag">
              DUYÊN CA · WEDDING PLAYLIST STUDIO
              {printFilter === 'groom' && ' — BẢN DÀNH CHO HỌ NHÀ TRAI'}
              {printFilter === 'bride' && ' — BẢN DÀNH CHO HỌ NHÀ GÁI'}
              {printFilter === 'both' && ' — BẢN TỔNG HỢP HAI HỌ'}
            </div>
            <h1 className="print-couple-name">{meta.couple || 'Cô Dâu & Chú Rể'}</h1>
            <h2 className="print-sheet-title">{meta.title || 'Lễ Thành Hôn & Dạ Tiệc Cưới'}</h2>

            <div className="print-meta-grid">
              <div>
                <b>Họ Nhà Trai (Chú Rể):</b> {meta.groomName || 'Minh Quân'}
              </div>
              <div>
                <b>Họ Nhà Gái (Cô Dâu):</b> {meta.brideName || 'Thùy Dung'}
              </div>
              <div>
                <b>Ngày tổ chức:</b> {meta.date || 'Chưa cập nhật'}
              </div>
              <div>
                <b>Thời gian:</b> {meta.time || '18:00'}
              </div>
              <div className="print-col-span-2">
                <b>Địa điểm:</b> {meta.venue || 'Chưa cập nhật'}
              </div>
            </div>

            {meta.note && (
              <div className="print-general-note">
                <b>Lưu ý chung cho Kỹ thuật viên & MC:</b> {meta.note}
              </div>
            )}
          </div>

          <div className="print-sections-list">
            {filteredSections.map((sec) => {
              const secTracks = tracks
                .filter((t) => {
                  if (t.sectionId !== sec.id) return false;
                  if (printFilter === 'both') return true;
                  if (printFilter === 'groom') return t.side === 'groom' || t.side === 'both';
                  if (printFilter === 'bride') return t.side === 'bride' || t.side === 'both';
                  return true;
                })
                .sort((a, b) => (a.order || 0) - (b.order || 0));

              return (
                <div key={sec.id} className="print-section-block">
                  <div className="print-section-head">
                    <span className="print-sec-order">Mục {sec.order}</span>
                    <span className="print-sec-name">{sec.name}</span>
                    <span className="print-sec-side-tag">
                      {sec.side === 'groom' ? '🤵 Nhà Trai' : sec.side === 'bride' ? '👰 Nhà Gái' : '💍 Chung'}
                    </span>
                    {sec.description && (
                      <span className="print-sec-desc">({sec.description})</span>
                    )}
                  </div>

                  {secTracks.length === 0 ? (
                    <div className="print-empty-note">
                      * Chưa chọn bài hát cố định (Dùng nhạc nền tự do)
                    </div>
                  ) : (
                    <table className="print-tracks-table">
                      <thead>
                        <tr>
                          <th style={{ width: '5%' }}>STT</th>
                          <th style={{ width: '12%' }}>Phía</th>
                          <th style={{ width: '28%' }}>Tên Bài Hát & Nghệ Sĩ</th>
                          <th style={{ width: '18%' }}>Đoạn Cắt (Trim)</th>
                          <th style={{ width: '37%' }}>Thời Điểm Phát (CUE của MC / Điều phối)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {secTracks.map((t, idx) => {
                          const hasTrim =
                            t.trimStart > 0 || (t.trimEnd != null && t.trimEnd < (t.duration || 999999));
                          return (
                            <tr key={t.id}>
                              <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                              <td>
                                <span className={`print-side-badge print-side-badge--${t.side || 'both'}`}>
                                  {t.side === 'groom' ? '🤵 Trai' : t.side === 'bride' ? '👰 Gái' : '💍 Chung'}
                                </span>
                              </td>
                              <td>
                                <b>{t.title}</b>
                                {t.artist && <div className="print-artist">{t.artist}</div>}
                              </td>
                              <td>
                                {hasTrim ? (
                                  <span>
                                    ✂ {formatTime(t.trimStart)} - {formatTime(t.trimEnd)}
                                  </span>
                                ) : (
                                  <span>Toàn bài ({formatTime(t.duration)})</span>
                                )}
                              </td>
                              <td className="print-cue-cell">
                                {t.note ? <b>{t.note}</b> : <span className="text-muted">—</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>

          <div className="print-sheet-footer">
            <span>Kịch bản tạo từ Duyên Ca — Wedding Playlist Studio (Nhà Trai & Nhà Gái)</span>
            <span>Ngày in: {new Date().toLocaleDateString('vi-VN')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
