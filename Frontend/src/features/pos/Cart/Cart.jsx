import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard, 
  Percent, 
  Receipt, 
  Trash, 
  Circle, 
  CheckCircle2,
  Settings,
  ArrowLeftRight,
  ShoppingBag,
  Utensils,
  Clock,
  Calendar,
  UserCheck,
  Combine,
  Printer
} from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { TenantContext } from '../../../context/TenantContext';
import { Button } from '../../../components/Button/Button';
import { Modal } from '../../../components/Modal/Modal';
import { QRModal } from '../QRModal/QRModal';
import styles from './Cart.module.css';

// Component Giỏ hàng & Thanh toán (POS Cart & Checkout Sidebar)
export const Cart = () => {
  const { tenantName } = useContext(TenantContext);
  const {
    isQRMode,
    tables,
    activeTableId,
    activeTableName,
    tableCarts,
    cartItems,
    discountPercentage,
    setDiscountPercentage,
    taxPercentage,
    setTaxPercentage,
    updateQuantity,
    removeFromCart,
    toggleItemServed,
    clearCart,
    completeOrder,
    subTotal,
    discountAmount,
    taxAmount,
    totalAmount,
    cartItemsCount,
    activeDiningMode,
    setDiningMode,
    transferTable,
    mergeTables,
    activeOrderMetadata,
    getTableStatus,
    submitQROrder
  } = useCart();

  // State mở Modal thanh toán QR
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState('');

  // State quản lý Popover Cấu hình Bàn ăn
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedTargetTableId, setSelectedTargetTableId] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  
  const settingsRef = useRef(null);

  // Nhận diện chế độ Khách quét QR tự gọi món từ context

  const [isOrderedConfirmed, setIsOrderedConfirmed] = useState(false);

  // Tự động chuyển đổi hiển thị "Đã gọi thành công" nếu bàn đã có món chính thức và chưa thêm món mới
  useEffect(() => {
    if (isQRMode && tableCarts && activeTableId) {
      const official = tableCarts[activeTableId] || [];
      const safeCartItems = cartItems || [];
      if (official.length > 0 && !safeCartItems.some(item => !item.submitted)) {
        setIsOrderedConfirmed(true);
      }
    }
  }, [tableCarts, activeTableId, cartItems]);

  // Khi số lượng món nháp thay đổi, đặt lại trạng thái để hiển thị nút gọi món
  useEffect(() => {
    const safeCartItems = cartItems || [];
    const hasDraft = safeCartItems.some(item => !item.submitted);
    if (hasDraft) {
      setIsOrderedConfirmed(false);
    }
  }, [(cartItems || []).reduce((a, i) => a + i.quantity, 0)]);

  const handleQROrderSubmit = () => {
    const draftItems = cartItems.filter(item => !item.submitted);
    if (draftItems.length === 0) return;
    submitQROrder(activeTableId);
    setIsOrderedConfirmed(true);
  };

  // Đóng popover cấu hình khi nhấp ra ngoài
  useEffect(() => {
    const handleClickOutsideSettings = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
      }
    };
    
    if (isSettingsOpen) {
      document.addEventListener('mousedown', handleClickOutsideSettings);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutsideSettings);
    };
  }, [isSettingsOpen]);

  // Kích hoạt thanh toán
  const handleCheckout = () => {
    if (cartItems.length === 0) return;
    
    // Sinh mã đơn hàng ngẫu nhiên để thanh toán
    const tempOrderId = `ORD-${Date.now().toString().slice(-4)}`;
    setCurrentOrderId(tempOrderId);
    setIsPayOpen(true);
  };

  const handlePrintBill = () => {
    if (cartItems.length === 0) return;
    const tempOrderId = `ORD-${Date.now().toString().slice(-4)}`;
    
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
    const formattedTotal = totalAmount ? totalAmount.toLocaleString('vi-VN') + 'đ' : '0đ';
    
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('vi-VN');

    printWindow.document.write(`
      <html>
        <head>
          <title>Hoa Don Thanh Toan - ${tempOrderId}</title>
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
            <div class="center" style="font-size: 10px; margin-bottom: 10px; font-style: italic;">Hóa Đơn Tạm Tính</div>
            <div style="font-size: 10px; line-height: 1.4;">
              <div>Mã tạm tính: ${tempOrderId}</div>
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

  // Xác nhận đã thu tiền từ khách
  const handlePaymentSuccess = () => {
    // Lưu đơn vào lịch sử và xóa giỏ hàng
    completeOrder(totalAmount);
    setIsPayOpen(false);
  };

  // Định dạng VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  // Các biến hiển thị Metadata đơn hàng
  const currentWaiter = activeOrderMetadata?.waiter || localStorage.getItem('saas_current_user') || 'Chủ cửa hàng';
  const orderDate = activeOrderMetadata?.date || new Date().toLocaleDateString('vi-VN');
  const orderStartTime = activeOrderMetadata?.startTime || 'Chưa bắt đầu order';

  // Xử lý chuyển bàn
  const handleTransferTable = () => {
    setTransferError('');
    setTransferSuccess('');

    if (!selectedTargetTableId) {
      setTransferError('Vui lòng chọn bàn nhận!');
      return;
    }

    // Kiểm tra bàn nhận có đang bận không
    if (getTableStatus) {
      const { isOccupied } = getTableStatus(selectedTargetTableId);
      if (isOccupied) {
        setTransferError('Bàn nhận đã có khách! Vui lòng dùng nút "Gộp bàn".');
        return;
      }
    }

    const result = transferTable(activeTableId, selectedTargetTableId);
    if (result.success) {
      setTransferSuccess('Chuyển bàn thành công!');
      setTimeout(() => {
        setIsSettingsOpen(false);
        setSelectedTargetTableId('');
        setTransferSuccess('');
      }, 1000);
    } else {
      setTransferError(result.message || 'Lỗi khi chuyển bàn.');
    }
  };

  // Xử lý gộp bàn
  const handleMergeTable = () => {
    setTransferError('');
    setTransferSuccess('');

    if (!selectedTargetTableId) {
      setTransferError('Vui lòng chọn bàn nhận để gộp!');
      return;
    }

    if (cartItems.length === 0) {
      setTransferError('Bàn hiện tại không có món ăn để gộp!');
      return;
    }

    // Kiểm tra bàn nhận có đang bận không
    if (getTableStatus) {
      const { isOccupied } = getTableStatus(selectedTargetTableId);
      if (!isOccupied) {
        setTransferError('Bàn nhận đang trống! Vui lòng dùng nút "Chuyển bàn".');
        return;
      }
    }

    const result = mergeTables(activeTableId, selectedTargetTableId);
    if (result.success) {
      setTransferSuccess('Gộp bàn thành công!');
      setTimeout(() => {
        setIsSettingsOpen(false);
        setSelectedTargetTableId('');
        setTransferSuccess('');
      }, 1000);
    } else {
      setTransferError(result.message || 'Lỗi khi gộp bàn.');
    }
  };

  return (
    <div className={`${styles.cartContainer} glass-panel`}>
      {/* Header Giỏ hàng */}
      <div className={styles.cartHeader}>
        <div className={styles.cartTitleWrapper}>
          <div className={styles.titleInfo}>
            <h4>Giỏ hàng - {activeTableName}</h4>
            <span className={`${styles.diningModeBadge} ${
              activeDiningMode === 'take-away' ? styles.modeTakeAway : styles.modeDineIn
            }`}>
              {activeDiningMode === 'take-away' ? 'Mang đi' : 'Ngồi ăn'}
            </span>
          </div>
          <span className={styles.itemBadge}>{cartItemsCount} món</span>
        </div>
        
        <div className={styles.headerActions} ref={settingsRef}>
          {cartItems.length > 0 && (
            <button 
              className={styles.clearBtn} 
              onClick={clearCart} 
              title="Xóa toàn bộ giỏ hàng"
            >
              <Trash size={14} />
              <span>Xóa sạch</span>
            </button>
          )}

          {/* NÚT BÁNH RĂNG CẤU HÌNH BÀN ĂN */}
          <div className={styles.settingsContainer}>
            <button
              className={`${styles.settingsBtn} ${isSettingsOpen ? styles.settingsBtnActive : ''}`}
              onClick={() => {
                setIsSettingsOpen(!isSettingsOpen);
                setTransferError('');
                setTransferSuccess('');
                setSelectedTargetTableId('');
              }}
              title="Thiết lập bàn ăn & Hình thức phục vụ"
            >
              <Settings size={16} />
            </button>

            {/* Popover thiết lập sổ xuống */}
            {isSettingsOpen && (
              <div className={`${styles.settingsPopover} glass-panel`}>
                <div className={styles.popoverHeader}>
                  <h5>Thiết lập bàn ăn</h5>
                </div>
                
                {/* 1. Thông tin đơn hàng (Giờ bắt đầu, ngày, người phục vụ) */}
                <div className={styles.popoverSection}>
                  <span className={styles.sectionLabel}>Thông tin đơn hàng</span>
                  <div className={styles.metadataGrid}>
                    <div className={styles.metadataItem}>
                      <Clock size={12} className={styles.metaIcon} />
                      <span className={styles.metaLabel}>Giờ bắt đầu:</span>
                      <span className={styles.metaValue}>{orderStartTime}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <Calendar size={12} className={styles.metaIcon} />
                      <span className={styles.metaLabel}>Ngày lập:</span>
                      <span className={styles.metaValue}>{orderDate}</span>
                    </div>
                    <div className={styles.metadataItem}>
                      <UserCheck size={12} className={styles.metaIcon} />
                      <span className={styles.metaLabel}>Phục vụ:</span>
                      <span className={styles.metaValue} style={{ textTransform: 'capitalize' }}>
                        {currentWaiter}
                      </span>
                    </div>
                  </div>
                </div>

                <hr className={styles.divider} />

                {/* 2. Chọn hình thức phục vụ: Ngồi ăn / Take away */}
                <div className={styles.popoverSection}>
                  <span className={styles.sectionLabel}>Hình thức phục vụ</span>
                  <div className={styles.modeOptions}>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${activeDiningMode === 'dine-in' ? styles.activeModeBtn : ''}`}
                      onClick={() => setDiningMode(activeTableId, 'dine-in')}
                    >
                      <Utensils size={14} />
                      <span>Ngồi ăn</span>
                    </button>
                    <button
                      type="button"
                      className={`${styles.modeBtn} ${activeDiningMode === 'take-away' ? styles.activeModeBtn : ''}`}
                      onClick={() => setDiningMode(activeTableId, 'take-away')}
                    >
                      <ShoppingBag size={14} />
                      <span>Take away</span>
                    </button>
                  </div>
                </div>

                <hr className={styles.divider} />

                {/* 3. Chuyển đổi / Gộp số bàn */}
                <div className={styles.popoverSection}>
                  <span className={styles.sectionLabel}>Chuyển bàn / Gộp bàn ăn</span>
                  <div className={styles.transferSelectRow}>
                    <select
                      value={selectedTargetTableId}
                      onChange={(e) => {
                        setSelectedTargetTableId(e.target.value);
                        setTransferError('');
                      }}
                      className={styles.transferSelect}
                    >
                      <option value="">-- Chọn bàn nhận --</option>
                      {tables
                        .filter((t) => t.id !== activeTableId)
                        .map((t) => {
                          const isOccupied = getTableStatus ? getTableStatus(t.id).isOccupied : false;
                          return (
                            <option key={t.id} value={t.id}>
                              {t.name} {isOccupied ? '(Đang có khách)' : '(Trống)'}
                            </option>
                          );
                        })}
                    </select>
                  </div>

                  <div className={styles.actionButtonsRow}>
                    {/* Nút Chuyển bàn (Sang bàn trống) */}
                    <button
                      type="button"
                      className={styles.transferBtn}
                      onClick={handleTransferTable}
                      title="Chuyển toàn bộ hóa đơn sang bàn trống"
                    >
                      <ArrowLeftRight size={13} />
                      <span>Chuyển bàn</span>
                    </button>

                    {/* Nút Gộp bàn (Sang bàn bận) */}
                    <button
                      type="button"
                      className={styles.mergeBtn}
                      onClick={handleMergeTable}
                      title="Gộp giỏ hàng của 2 bàn đang có khách"
                    >
                      <Combine size={13} />
                      <span>Gộp bàn</span>
                    </button>
                  </div>

                  {transferError && <div className={styles.errorAlert}>{transferError}</div>}
                  {transferSuccess && <div className={styles.successAlert}>{transferSuccess}</div>}
                </div>

                <hr className={styles.divider} />

                {/* 4. Hủy bàn ăn */}
                <div className={styles.popoverSection}>
                  <button
                    type="button"
                    className={styles.cancelTableBtn}
                    onClick={() => {
                      if (window.confirm(`Bạn có chắc chắn muốn HỦY BÀN phục vụ của ${activeTableName}? Toàn bộ món ăn trong giỏ hàng sẽ bị xóa sạch!`)) {
                        clearCart();
                        setIsSettingsOpen(false);
                      }
                    }}
                    title="Xóa toàn bộ giỏ hàng và trả về trạng thái bàn trống"
                  >
                    <Trash size={14} />
                    <span>Hủy bàn ăn</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Danh sách món ăn trong giỏ */}
      <div className={styles.itemsList}>
        {cartItems.length > 0 ? (
          cartItems.map((item) => (
            <div 
              key={item.cartItemId} 
              className={`${styles.cartItem} ${item.served ? styles.servedItem : ''} ${item.submitted ? styles.submittedItem : ''}`}
            >
              {/* Nút đánh dấu đã lên món (Tick) */}
              <button
                type="button"
                className={`${styles.serveTickBtn} ${item.served ? styles.activeServeTick : ''} ${item.submitted ? styles.disabledServeTick : ''}`}
                onClick={() => !item.submitted && toggleItemServed(item.cartItemId)}
                title={item.submitted ? "Đã gửi bếp chế biến" : (item.served ? "Đánh dấu là CHƯA lên món" : "Đánh dấu ĐÃ lên món")}
                disabled={item.submitted}
              >
                {item.served ? <CheckCircle2 size={18} /> : <Circle size={18} />}
               </button>
 
               {/* Ảnh thu nhỏ của món ăn */}
               <img src={item.product.image} alt={item.product.name} className={styles.itemImg} />
               
               {/* Tên & Giá bán */}
               <div className={styles.itemDetails}>
                 <div className={styles.itemNameRow}>
                   <span className={styles.itemName} title={item.product.name}>
                     {item.product.name}
                   </span>
                   {item.submitted && <span className={styles.submittedBadge}>Đã đặt</span>}
                   {item.served && <span className={styles.servedBadge}>Đã lên</span>}
                 </div>
                 <span className={styles.itemPrice}>
                   {formatCurrency(item.product.sellingPrice)}
                 </span>
               </div>
 
               {/* Điều khiển tăng giảm số lượng */}
               <div className={styles.qtyControl}>
                 <button
                   className={styles.qtyBtn}
                   onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                   aria-label="Decrease quantity"
                   disabled={item.served || item.submitted}
                 >
                   <Minus size={12} />
                 </button>
                 <input
                   type="number"
                   min="0"
                   className={styles.qtyInput}
                   value={item.quantity}
                   onChange={(e) => {
                     const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                     if (!isNaN(val)) {
                       updateQuantity(item.cartItemId, val);
                     }
                   }}
                   disabled={item.served || item.submitted}
                   title={item.submitted ? "Món đã gọi không thể sửa" : "Nhấp vào đây để nhập số lượng bằng tay"}
                 />
                 <button
                   className={styles.qtyBtn}
                   onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                   aria-label="Increase quantity"
                   disabled={item.served || item.submitted}
                 >
                   <Plus size={12} />
                 </button>
               </div>
 
               {/* Tính tổng dòng tiền */}
               <div className={styles.lineTotal}>
                 {formatCurrency(item.product.sellingPrice * item.quantity)}
               </div>
 
               {/* Nút xóa nhanh */}
               <button
                 className={styles.deleteBtn}
                 onClick={() => removeFromCart(item.cartItemId)}
                 title={item.submitted ? "Món đã đặt không thể xóa" : "Xóa món ăn này"}
                 disabled={item.served || item.submitted}
               >
                 <Trash2 size={14} />
               </button>
             </div>
          ))

        ) : (
          <div className={styles.emptyCart}>
            <div className={styles.emptyCartIconWrapper}>
              <Receipt size={32} className={styles.emptyIcon} />
            </div>
            <span>Giỏ hàng đang trống</span>
            <p>Chọn các món ăn bên trái để thêm vào hóa đơn</p>
          </div>
        )}
      </div>

      {/* Tóm tắt tiền và biểu mẫu giảm giá/thuế */}
      <div className={styles.summarySection}>
        {/* Tạm tính tiền hàng */}
        <div className={styles.summaryRow}>
          <span className={styles.rowLabel}>{isQRMode ? 'Tổng cộng hóa đơn' : 'Tạm tính tiền hàng'}</span>
          <span className={`${styles.rowVal} ${styles.numeric}`}>{formatCurrency(subTotal)}</span>
        </div>

        {/* Cấu hình Giảm giá (Ẩn đi nếu là khách quét QR tại bàn) */}
        {!isQRMode && (
          <div className={styles.adjustmentRow}>
            <div className={styles.adjustmentLabel}>
              <Percent size={14} className={styles.adjIcon} />
              <span>Giảm giá (%)</span>
            </div>
            <div className={styles.adjInputWrapper}>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercentage || ''}
                onChange={(e) => {
                  const val = Math.min(100, Math.max(0, Number(e.target.value)));
                  setDiscountPercentage(val);
                }}
                placeholder="0"
                className={styles.adjInput}
              />
            </div>
            <span className={`${styles.adjAmountValue} ${styles.numeric}`}>
              -{formatCurrency(discountAmount)}
            </span>
          </div>
        )}

        {/* Cấu hình Thuế VAT (Ẩn đi nếu là khách quét QR tại bàn) */}
        {!isQRMode && (
          <div className={styles.adjustmentRow}>
            <div className={styles.adjustmentLabel}>
              <Receipt size={14} className={styles.adjIcon} />
              <span>Thuế VAT (%)</span>
            </div>
            <div className={styles.adjInputWrapper}>
              <input
                type="number"
                min="0"
                max="50"
                value={taxPercentage || ''}
                onChange={(e) => {
                  const val = Math.min(50, Math.max(0, Number(e.target.value)));
                  setTaxPercentage(val);
                }}
                placeholder="0"
                className={styles.adjInput}
              />
            </div>
            <span className={`${styles.adjAmountValue} ${styles.numeric}`}>
              +{formatCurrency(taxAmount)}
            </span>
          </div>
        )}

        {/* Tổng cộng thanh toán cuối cùng (Ẩn đi nếu là khách quét QR tại bàn) */}
        {!isQRMode && (
          <div className={styles.totalPaymentRow}>
            <span className={styles.totalLabel}>Khách phải trả</span>
            <span className={`${styles.totalVal} ${styles.numeric}`}>{formatCurrency(totalAmount)}</span>
          </div>
        )}

        {/* Nút thanh toán hoặc Nút gọi món của Khách quét QR */}
        {isQRMode ? (
          !isOrderedConfirmed ? (
            <Button
              variant="primary"
              size="large"
              fullWidth
              icon={ShoppingBag}
              disabled={!cartItems.some(item => !item.submitted)}
              onClick={handleQROrderSubmit}
              className={styles.qrOrderSubmitBtn}
            >
              Order đồ ăn
            </Button>
          ) : (
            <div className={styles.qrOrderConfirmedCard}>
              <div className={styles.confirmedActiveBadge}>
                <span className={styles.activeDot} />
                <span>Bàn đang hoạt động</span>
              </div>
              <CheckCircle2 size={28} className={styles.successIcon} />
              <div className={styles.confirmedTextWrapper}>
                <span className={styles.confirmedTitle}>Đã gọi món thành công!</span>
                <p className={styles.confirmedDesc}>
                  Yêu cầu đã gửi đến bếp. Vui lòng đợi nhân viên mang món ra.
                </p>
              </div>
              <button
                className={styles.orderMoreBtn}
                onClick={() => setIsOrderedConfirmed(false)}
              >
                + Gọi thêm món
              </button>
            </div>

          )
        ) : (
          <div className={styles.checkoutActionsRow}>
            <Button
              variant="primary"
              size="large"
              icon={CreditCard}
              disabled={cartItems.length === 0}
              onClick={handleCheckout}
              className={styles.checkoutBtnWithPrint}
            >
              Thanh toán (F9)
            </Button>
            <Button
              variant="outline"
              size="large"
              icon={Printer}
              disabled={cartItems.length === 0}
              onClick={handlePrintBill}
              className={styles.printBtnInline}
              title="In hóa đơn tạm tính"
            >
              In
            </Button>
          </div>
        )}
      </div>

      {/* Modal VietQR Code */}
      <Modal
        isOpen={isPayOpen}
        onClose={() => setIsPayOpen(false)}
        title="Quét mã QR chuyển khoản Napas 24/7"
        size="xsmall"
      >
        <QRModal
          amount={totalAmount}
          orderId={currentOrderId}
          onConfirm={handlePaymentSuccess}
          onClose={() => setIsPayOpen(false)}
          cartItems={cartItems}
          subTotal={subTotal}
          discountAmount={discountAmount}
          taxAmount={taxAmount}
          activeTableName={activeTableName}
          tenantName={tenantName}
        />
      </Modal>
    </div>
  );
};
