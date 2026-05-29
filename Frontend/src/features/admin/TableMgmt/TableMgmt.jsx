import React, { useState, useContext } from 'react';
import { Plus, Trash2, Coffee, HelpCircle, AlertTriangle, AlertCircle, QrCode, X, CheckCircle2, Circle, Clock } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { CartContext } from '../../../context/CartContext';
import { TenantContext } from '../../../context/TenantContext';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import styles from './TableMgmt.module.css';

// Component Quản lý Bàn ăn tại Trang Quản trị (Admin Table Management)
export const TableMgmt = () => {
  const { tables, addTable, deleteTable, getTableStatus, tableCarts } = useCart();
  const { tableOrderMetadata } = useContext(CartContext);
  const { tenant } = useContext(TenantContext);

  const [newTableName, setNewTableName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedQRTable, setSelectedQRTable] = useState(null);
  // Modal xem order của bàn
  const [selectedOrderTable, setSelectedOrderTable] = useState(null);

  // Xử lý nộp biểu mẫu thêm bàn mới
  const handleAddTable = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newTableName.trim()) {
      setError('Vui lòng nhập tên bàn ăn!');
      return;
    }

    const result = addTable(newTableName);
    if (result.success) {
      setSuccess(`Thêm thành công "${newTableName.trim()}" vào sơ đồ!`);
      setNewTableName('');
    } else {
      setError(result.message || 'Thêm bàn thất bại.');
    }
  };

  return (
    <div className={styles.container}>
      {/* Tiêu đề trang quản lý bàn ăn */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Cấu hình sơ đồ Bàn ăn</h2>
          <span className={styles.subtitle}>
            Tùy biến sơ đồ vị trí, thêm mới hoặc bớt bàn ăn phục vụ theo nhu cầu thực tế
          </span>
        </div>
      </div>

      {/* Biểu mẫu Thêm bàn mới */}
      <div className={`${styles.addTableCard} glass-panel`}>
        <h4>Thêm bàn ăn mới vào sơ đồ</h4>
        <form onSubmit={handleAddTable} className={styles.form}>
          <div className={styles.inputRow}>
            <Input
              placeholder="Nhập tên bàn mới (Ví dụ: Bàn 13, Phòng VIP 01)"
              value={newTableName}
              onChange={(e) => setNewTableName(e.target.value)}
              className={styles.tableNameInput}
            />
            <Button type="submit" variant="primary" icon={Plus} className={styles.addBtn}>
              Thêm bàn mới
            </Button>
          </div>
          {error && (
            <div className={styles.errorText}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className={styles.successText}>
              <CheckCircleIcon size={14} />
              <span>{success}</span>
            </div>
          )}
        </form>
      </div>

      {/* Danh sách lưới các bàn ăn hiện tại */}
      <div className={styles.tablesListWrapper}>
        <div className={styles.gridHeader}>
          <h4>Sơ đồ bàn hiện có ({tables.length} bàn)</h4>
          <div className={styles.legend}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.greenDot}`} />
              <span>Bàn trống</span>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendDot} ${styles.orangeDot}`} />
              <span>Bàn có khách</span>
            </div>
          </div>
        </div>

        {tables.length > 0 ? (
          <div className={styles.tablesGrid}>
            {tables.map((table) => {
              const { isOccupied, itemsCount } = getTableStatus(table.id);

              return (
                <div
                  key={table.id}
                  className={`${styles.tableCard} glass-panel ${
                    isOccupied ? styles.occupiedCard : ''
                  } ${isOccupied ? styles.clickableCard : ''}`}
                  onClick={() => {
                    if (isOccupied) setSelectedOrderTable(table);
                  }}
                  title={isOccupied ? `Xem chi tiết order của ${table.name}` : ''}
                >
                  {/* Icon trang trí và tiêu đề */}
                  <div className={styles.cardMainInfo}>
                    <div className={`${styles.tableIconWrapper} ${isOccupied ? styles.iconBgOrange : styles.iconBgGreen}`}>
                      <Coffee size={20} />
                    </div>
                    <div className={styles.tableText}>
                      <span className={styles.tableName}>{table.name}</span>
                      <span className={styles.tableStatusText}>
                        {isOccupied ? `Đang có khách (${itemsCount} món)` : 'Bàn đang trống'}
                      </span>
                    </div>
                  </div>

                  {/* Nút Xóa hoặc Cảnh báo */}
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.qrBtn}
                      onClick={() => setSelectedQRTable(table)}
                      title={`Xem Mã QR Gọi Món của ${table.name}`}
                    >
                      <QrCode size={15} />
                    </button>

                    {isOccupied ? (
                      /* Nếu bàn có khách -> KHÓA XÓA AN TOÀN */
                      <div 
                        className={styles.disabledDeleteWrapper}
                        title="Không thể xóa bàn ăn đang có khách gọi món!"
                      >
                        <AlertTriangle size={16} className={styles.warningIcon} />
                        <span className={styles.warningTooltip}>đang hoạt động</span>
                      </div>
                    ) : (
                      /* Nếu bàn trống -> CHO PHÉP XÓA */
                      <button
                        className={styles.deleteBtn}
                        onClick={() => deleteTable(table.id)}
                        title={`Xóa ${table.name} khỏi sơ đồ`}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* Dải trạng thái màu trên đầu card */}
                  <div className={`${styles.cardBorderTop} ${isOccupied ? styles.borderOrange : styles.borderGreen}`} />
                </div>
              );
            })}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <span>Chưa có bàn ăn nào trong sơ đồ của quán. Vui lòng thêm bàn mới ở trên!</span>
          </div>
        )}
      </div>

      {/* Modal xem Order chi tiết của bàn */}
      {selectedOrderTable && (() => {
        const cart = tableCarts[selectedOrderTable.id] || [];
        const meta = tableOrderMetadata?.[selectedOrderTable.id];
        const pendingItems = cart.filter(i => !i.served);
        const servedItems = cart.filter(i => i.served);
        const totalQty = cart.reduce((acc, i) => acc + i.quantity, 0);
        return (
          <div className={styles.qrModalOverlay} onClick={() => setSelectedOrderTable(null)}>
            <div className={`${styles.orderModalContent} glass-panel`} onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className={styles.qrModalHeader}>
                <div className={styles.orderModalTitleGroup}>
                  <Coffee size={18} className={styles.orderModalIcon} />
                  <div>
                    <h4>{selectedOrderTable.name}</h4>
                    {meta?.startTime && (
                      <span className={styles.orderModalTime}>
                        <Clock size={11} /> Order lúc {meta.startTime}
                      </span>
                    )}
                  </div>
                </div>
                <button className={styles.closeBtn} onClick={() => setSelectedOrderTable(null)}>×</button>
              </div>

              {/* Summary */}
              <div className={styles.orderModalSummary}>
                <span className={styles.summaryChip}>{totalQty} món</span>
                <span className={styles.summaryChipDone}>{servedItems.reduce((a,i)=>a+i.quantity,0)} đã lên</span>
                <span className={styles.summaryChipPending}>{pendingItems.reduce((a,i)=>a+i.quantity,0)} đang chờ</span>
              </div>

              {/* Body */}
              <div className={styles.orderModalBody}>
                {cart.length === 0 ? (
                  <p className={styles.orderEmpty}>Chưa có món nào.</p>
                ) : (
                  <ul className={styles.orderItemList}>
                    {cart.map((item) => (
                      <li
                        key={item.cartItemId || item.product.id}
                        className={`${styles.orderItem} ${item.served ? styles.orderItemServed : styles.orderItemPending}`}
                      >
                        <span className={styles.orderItemIcon}>
                          {item.served
                            ? <CheckCircle2 size={16} className={styles.iconServed} />
                            : <Circle size={16} className={styles.iconPending} />}
                        </span>
                        <span className={`${styles.orderItemName} ${item.served ? styles.strikethrough : ''}`}>
                          {item.product.name}
                        </span>
                        <span className={styles.orderItemQty}>×{item.quantity}</span>
                        <span className={styles.orderItemPrice}>
                          {(item.product.sellingPrice * item.quantity).toLocaleString('vi-VN')}đ
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer: tổng tiền */}
              <div className={styles.orderModalFooter}>
                <div className={styles.orderTotal}>
                  <span>Tổng tiền tạm tính:</span>
                  <strong>
                    {cart.reduce((acc, i) => acc + i.product.sellingPrice * i.quantity, 0).toLocaleString('vi-VN')}đ
                  </strong>
                </div>
                <Button variant="outline" onClick={() => setSelectedOrderTable(null)}>Dóng</Button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal hiển thị mã QR Bàn ăn */}
      {selectedQRTable && (
        <div className={styles.qrModalOverlay} onClick={() => setSelectedQRTable(null)}>
          <div className={`${styles.qrModalContent} glass-panel`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.qrModalHeader}>
              <h4>Mã QR Gọi Món - {selectedQRTable.name}</h4>
              <button className={styles.closeBtn} onClick={() => setSelectedQRTable(null)}>&times;</button>
            </div>
            
            <div className={styles.qrModalBody}>
              <div className={styles.qrImageWrapper}>
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
                    `${window.location.origin}${window.location.pathname}?table=${selectedQRTable.id}&tenant=${tenant}`
                  )}`} 
                  alt={`QR Code ${selectedQRTable.name}`} 
                  className={styles.qrImage}
                />
              </div>
              
              <div className={styles.qrInstructions}>
                <p><strong>Dán mã này tại {selectedQRTable.name}:</strong></p>
                <p>Khách hàng chỉ cần quét mã bằng điện thoại để xem thực đơn và tự đặt món trực tiếp tại bàn.</p>
              </div>

              <div className={styles.urlCopyGroup}>
                <label>Đường dẫn gọi món của bàn:</label>
                <div className={styles.urlInputRow}>
                  <input 
                    type="text" 
                    readOnly 
                    value={`${window.location.origin}${window.location.pathname}?table=${selectedQRTable.id}&tenant=${tenant}`}
                    className={styles.urlInput}
                  />
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?table=${selectedQRTable.id}&tenant=${tenant}`);
                      alert('Đã sao chép liên kết gọi món thành công!');
                    }}
                    className={styles.copyBtn}
                  >
                    Sao chép
                  </button>
                </div>
              </div>
            </div>
            
            <div className={styles.qrModalFooter}>
              <Button variant="outline" onClick={() => setSelectedQRTable(null)}>
                Đóng
              </Button>
              <Button 
                variant="primary" 
                onClick={() => window.print()}
              >
                In Mã QR
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Icon nhỏ phụ trợ
const CheckCircleIcon = ({ size }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check-circle-2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
);
