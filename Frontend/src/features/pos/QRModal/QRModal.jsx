import React, { useState, useEffect, useContext } from 'react';
import { CheckCircle2, ShieldCheck, Loader2, Printer, AlertTriangle } from 'lucide-react';
import { Button } from '../../../components/Button/Button';
import { TenantContext } from '../../../context/TenantContext';
import styles from './QRModal.module.css';

// Modal hiển thị QR Code thanh toán VietQR động
export const QRModal = ({ 
  amount, 
  orderId, 
  onConfirm, 
  onClose,
  cartItems,
  subTotal,
  discountAmount,
  taxAmount,
  activeTableName,
  tenantName
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { tenant, bankId, bankFullName, bankAccountNo, bankAccountName } = useContext(TenantContext);

  // Sinh liên kết ảnh VietQR tự động dựa trên số tiền và mã đơn hàng
  const generateQRCode = (amt, ordId) => {
    if (!bankId || !bankAccountNo) {
      return '';
    }

    const template = 'compact'; // compact | qr_only | print
    const accountName = encodeURIComponent((bankAccountName || 'CUA HANG').toUpperCase());
    const addInfo = encodeURIComponent(`THANH TOAN DON ${ordId}`);
    
    // Chuẩn hóa Bank ID (ví dụ: tp bank -> tpb)
    const normalizedBank = bankId.toLowerCase().replace(/\s+/g, '');
    
    return `https://img.vietqr.io/image/${normalizedBank}-${bankAccountNo}-${template}.png?amount=${amt}&addInfo=${addInfo}&accountName=${accountName}`;
  };

  const handlePrintBill = () => {
    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) {
      alert('Vui lòng cho phép trình duyệt hiển thị Popup để in hóa đơn!');
      return;
    }
    
    const itemsHtml = (cartItems || []).map(item => `
      <tr>
        <td style="padding: 6px 0; max-width: 120px; word-break: break-all;">${item.product.name}</td>
        <td style="text-align: center; padding: 6px 0;">${item.quantity}</td>
        <td style="text-align: right; padding: 6px 0;">${(item.product.sellingPrice).toLocaleString('vi-VN')}đ</td>
        <td style="text-align: right; padding: 6px 0;">${(item.product.sellingPrice * item.quantity).toLocaleString('vi-VN')}đ</td>
      </tr>
    `).join('');

    const formattedSubTotal = subTotal ? subTotal.toLocaleString('vi-VN') + 'đ' : '0đ';
    const formattedDiscount = discountAmount ? '-' + discountAmount.toLocaleString('vi-VN') + 'đ' : '0đ';
    const formattedTax = taxAmount ? '+' + taxAmount.toLocaleString('vi-VN') + 'đ' : '0đ';
    const formattedTotal = amount ? amount.toLocaleString('vi-VN') + 'đ' : '0đ';
    
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('vi-VN');

    printWindow.document.write(`
      <html>
        <head>
          <title>Hoa Don Thanh Toan - ${orderId}</title>
          <style>
            @media print {
              body { margin: 0; padding: 10px; font-family: 'Courier New', Courier, monospace; font-size: 11px; color: #000; }
              .receipt-container { width: 100%; max-width: 80mm; margin: 0 auto; }
              .center { text-align: center; }
              .bold { font-weight: bold; }
              .divider { border-top: 1px dashed #000; margin: 8px 0; }
              table { width: 100%; border-collapse: collapse; }
              .right { text-align: right; }
            }
            body { font-family: 'Courier New', Courier, monospace; padding: 20px; font-size: 13px; }
            .receipt-container { width: 280px; margin: 0 auto; border: 1px solid #ccc; padding: 15px; background: #fff; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            table { width: 100%; border-collapse: collapse; }
            .right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <h2 class="center bold" style="margin: 0 0 5px 0; text-transform: uppercase; font-size: 16px;">${tenantName || 'CUA HANG'}</h2>
            <div class="center" style="font-size: 10px; margin-bottom: 10px; font-style: italic;">Hóa Đơn Thanh Toán</div>
            <div style="font-size: 10px; line-height: 1.4;">
              <div>Mã hóa đơn: ${orderId}</div>
              <div>Bàn phục vụ: ${activeTableName || 'Mang đi'}</div>
              <div>Thời gian: ${dateStr} ${timeStr}</div>
              <div>Nhân viên: Thu ngân</div>
            </div>
            <div class="divider"></div>
            <table style="font-size: 10px;">
              <thead>
                <tr style="border-bottom: 1px dashed #000;">
                  <th style="text-align: left; padding-bottom: 5px;">Món</th>
                  <th style="text-align: center; padding-bottom: 5px; width: 30px;">SL</th>
                  <th style="text-align: right; padding-bottom: 5px; width: 60px;">Đơn giá</th>
                  <th style="text-align: right; padding-bottom: 5px; width: 60px;">T.Tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            <div class="divider"></div>
            <div style="font-size: 10px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Tạm tính:</span>
                <span>${formattedSubTotal}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Giảm giá:</span>
                <span>${formattedDiscount}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                <span>Thuế VAT:</span>
                <span>${formattedTax}</span>
              </div>
              <div class="divider"></div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; font-weight: bold;">
                <span>TỔNG CỘNG:</span>
                <span>${formattedTotal}</span>
              </div>
            </div>
            <div class="divider"></div>
            <div class="center bold" style="font-size: 10px; margin-top: 15px;">XIN CẢM ƠN QUÝ KHÁCH!</div>
            <div class="center" style="font-size: 8px; color: #555; margin-top: 5px;">quản lý bán hàng by Sinh Viên Bonnie v1.0.0</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    
    printWindow.document.close();
  };

  const qrUrl = generateQRCode(amount, orderId);

  // Đặt lại trạng thái tải ảnh khi số tiền hoặc đơn hàng đổi
  useEffect(() => {
    setImageLoaded(false);
  }, [amount, orderId]);

  // Xử lý xác nhận đã nhận tiền (giả lập loading mượt mà trước khi hoàn tất)
  const handleConfirmPayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      onConfirm();
    }, 1200); // 1.2s giả lập xử lý giao dịch cực mượt
  };

  // Định dạng số tiền VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className={styles.container}>
      {/* Thông tin hóa đơn */}
      <div className={styles.receiptSummary}>
        <div className={styles.summaryRow}>
          <span className={styles.label}>Mã hóa đơn:</span>
          <span className={styles.valueHighlight}>{orderId}</span>
        </div>
        <div className={styles.summaryRow}>
          <span className={styles.label}>Số tiền cần thu:</span>
          <span className={styles.amountHighlight}>{formatCurrency(amount)}</span>
        </div>
      </div>

      {/* Vùng hiển thị QR Code */}
      <div className={styles.qrArea}>
        {!qrUrl ? (
          <div className={styles.qrConfigWarning}>
            <AlertTriangle size={28} className={styles.warningIcon} />
            <span>Chưa cấu hình nhận tiền</span>
            <p>Vui lòng vào trang <strong>Admin &gt; Tổng quan</strong> để cấu hình Tài khoản Ngân hàng nhận tiền VietQR.</p>
          </div>
        ) : (
          <>
            {/* Skeleton Loading hiển thị khi ảnh chưa tải xong */}
            {!imageLoaded && (
              <div className={`${styles.qrSkeleton} skeleton`}>
                <Loader2 size={32} className={styles.spinner} />
                <span>Đang tạo mã QR bảo mật...</span>
              </div>
            )}
            
            <img
              src={qrUrl}
              alt={`VietQR ${orderId}`}
              className={`${styles.qrImage} ${imageLoaded ? styles.loaded : styles.hidden}`}
              onLoad={() => setImageLoaded(true)}
            />
          </>
        )}
      </div>

      {/* Thông tin chuyển khoản liên kết hiển thị cho khách/thu ngân xem đối chiếu */}
      {qrUrl && (
        <div className={styles.bankDetailsBox}>
          <div className={styles.bankDetailItem}>
            <span className={styles.detailLabel}>Ngân hàng nhận:</span>
            <span className={styles.detailValue}>{bankFullName}</span>
          </div>
          <div className={styles.bankDetailItem}>
            <span className={styles.detailLabel}>Số tài khoản:</span>
            <span className={styles.detailValueHighlight}>{bankAccountNo}</span>
          </div>
          <div className={styles.bankDetailItem}>
            <span className={styles.detailLabel}>Tên người nhận:</span>
            <span className={styles.detailValueName}>{bankAccountName.toUpperCase()}</span>
          </div>
        </div>
      )}

      {/* Cam kết bảo mật & Hướng dẫn */}
      <div className={styles.securityBadge}>
        <ShieldCheck size={16} className={styles.shieldIcon} />
        <span>Giao dịch thanh toán tự động qua Napas 24/7</span>
      </div>

      <div className={styles.instructions}>
        <p>Quét mã QR bằng ứng dụng ngân hàng hoặc ví điện tử bất kỳ để thanh toán trực tiếp vào tài khoản cửa hàng.</p>
      </div>

      {/* Nút thao tác */}
      <div className={styles.actions}>
        <Button variant="outline" onClick={onClose} disabled={isProcessing}>
          Hủy bỏ
        </Button>
        <Button
          variant="primary"
          icon={isProcessing ? undefined : CheckCircle2}
          onClick={handleConfirmPayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 size={16} className={styles.btnSpinner} />
              <span>Đang xác nhận...</span>
            </>
          ) : (
            'Đã thu tiền khách'
          )}
        </Button>
      </div>
    </div>
  );
};
