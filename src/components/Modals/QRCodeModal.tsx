import React, { useEffect, useState } from 'react';
import type { ServerInfo } from '../../types';
import { fetchServerInfo } from '../../services/api';
import { useToast } from '../../state/toastContext';
import {
  QrCodeIcon,
  CloseIcon,
  SmartphoneIcon,
  LaptopIcon,
  SparklesIcon,
} from '../common/Icons';

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({ open, onClose }) => {
  const { pushToast } = useToast();
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string>('');

  useEffect(() => {
    if (open) {
      fetchServerInfo().then((info) => {
        if (info) {
          setServerInfo(info);
          setSelectedUrl(info.primaryLanUrl || window.location.href);
        } else {
          setSelectedUrl(window.location.href);
        }
      });
    }
  }, [open]);

  if (!open) return null;

  const currentUrl = selectedUrl || window.location.href;
  const qrCodeImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(
    currentUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentUrl);
    pushToast('Đã sao chép liên kết vào bộ nhớ tạm!', 'success');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog modal-dialog--qr" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <QrCodeIcon className="text-amber-500 w-5 h-5" />
            <h3 className="modal-title">Kết Nối Điện Thoại & Đồng Bộ Tức Thì</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <div className="qr-modal-body">
          <p className="qr-modal-desc">
            Quét mã QR bằng Camera điện thoại để mở danh sách nhạc cưới. Mọi thay đổi trên điện thoại
            sẽ lập tức đồng bộ lên máy tính DJ trong tiệc cưới!
          </p>

          {/* QR Code Container */}
          <div className="qr-code-frame">
            <img
              src={qrCodeImgSrc}
              alt="Mã QR mở Duyên Ca trên điện thoại"
              className="qr-image"
              width={220}
              height={220}
            />
          </div>

          {/* URL box with copy button */}
          <div className="qr-url-box">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="qr-url-input"
            />
            <button
              type="button"
              className="copy-url-btn"
              onClick={handleCopy}
            >
              Sao chép
            </button>
          </div>

          {/* Additional LAN IPs if available */}
          {serverInfo && serverInfo.localIps && serverInfo.localIps.length > 1 && (
            <div className="alt-ips-row">
              <span className="alt-ips-label">Hoặc chọn IP mạng Wi-Fi khác:</span>
              <div className="alt-ips-list">
                {serverInfo.localIps.map((ip) => {
                  const u = `http://${ip}:${serverInfo.port}`;
                  return (
                    <button
                      key={ip}
                      type="button"
                      className={`alt-ip-btn ${selectedUrl === u ? 'active' : ''}`}
                      onClick={() => setSelectedUrl(u)}
                    >
                      {ip}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Smartphone PWA Tip */}
          <div className="pwa-install-tip">
            <div className="pwa-tip-header">
              <SmartphoneIcon className="w-4 h-4 text-amber-500" />
              <span>Mẹo dùng như ứng dụng App trên điện thoại:</span>
            </div>
            <ul>
              <li><b>iPhone / iPad (Safari)</b>: Nhấn biểu tượng <i>Chia sẻ (Share)</i> → chọn <b>Thêm vào MH chính (Add to Home Screen)</b>.</li>
              <li><b>Android (Chrome)</b>: Nhấn menu <i>⋮</i> → chọn <b>Cài đặt ứng dụng</b> hoặc <b>Thêm vào màn hình chính</b>.</li>
            </ul>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="primary-btn" onClick={onClose}>
            Đã hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
