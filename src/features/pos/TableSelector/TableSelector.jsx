import React, { useState, useRef, useEffect } from 'react';
import { Coffee, User, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import styles from './TableSelector.module.css';

// Component Chọn Bàn ăn trong phân hệ bán hàng POS với cơ chế sổ xuống (Dropdown)
export const TableSelector = () => {
  const { tables, activeTableId, setActiveTableId, getTableStatus } = useCart();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className={styles.wrapper} ref={dropdownRef}>
      <div className={`${styles.container} glass-panel`}>
        {/* Tiêu đề sơ đồ bàn ăn - click để mở sơ đồ lưới dạng sổ xuống (Dropdown) */}
        <div 
          className={`${styles.titleWrapper} ${isDropdownOpen ? styles.titleActive : ''}`}
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          title="Click để sổ xuống xem bản đồ bàn ăn dạng lưới chi tiết"
        >
          <Coffee size={16} className={styles.titleIcon} />
          <h5>Sơ đồ bàn ăn</h5>
          <div className={styles.chevronBtn}>
            {isDropdownOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </div>
        </div>

        <div className={styles.tablesList}>
          {tables.map((table) => {
            const { isOccupied, itemsCount } = getTableStatus(table.id);
            const isSelected = activeTableId === table.id;

            return (
              <button
                key={table.id}
                className={[
                  styles.tableCard,
                  isSelected ? styles.selectedCard : '',
                  isOccupied ? styles.occupiedCard : ''
                ].filter(Boolean).join(' ')}
                onClick={() => {
                  setActiveTableId(table.id);
                  setIsDropdownOpen(false);
                }}
                title={isOccupied ? `Bàn đang có ${itemsCount} món` : 'Bàn trống'}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.tableName}>{table.name}</span>
                  {isOccupied && <User size={12} className={styles.userIcon} />}
                </div>
                <div className={styles.cardStatus}>
                  <div className={`${styles.statusDot} ${isOccupied ? styles.orangeDot : styles.greenDot}`} />
                  <span className={styles.statusText}>
                    {isOccupied ? `Đang có khách (${itemsCount})` : 'Bàn trống'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sơ đồ bàn ăn dạng sổ xuống giống y chang trang quản trị */}
      {isDropdownOpen && (
        <div className={`${styles.dropdownPanel} glass-panel`}>
          {/* Chú thích trạng thái và tổng số bàn */}
          <div className={styles.modalGridHeader}>
            <span className={styles.modalSubtitle}>
              Bản đồ bàn dạng lưới chi tiết ({tables.length} bàn)
            </span>
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

          {/* Lưới các bàn ăn giống y chang trang quản trị */}
          {tables.length > 0 ? (
            <div className={styles.tablesGrid}>
              {tables.map((table) => {
                const { isOccupied, itemsCount } = getTableStatus(table.id);
                const isSelected = activeTableId === table.id;

                return (
                  <div
                    key={table.id}
                    className={`${styles.gridTableCard} glass-panel ${
                      isOccupied ? styles.occupiedGridCard : ''
                    } ${isSelected ? styles.selectedGridCard : ''}`}
                    onClick={() => {
                      setActiveTableId(table.id);
                      setIsDropdownOpen(false);
                    }}
                    title={`Click để chọn nhanh ${table.name}`}
                  >
                    {/* Icon trang trí và tiêu đề giống y chang quản trị */}
                    <div className={styles.cardMainInfo}>
                      <div className={`${styles.tableIconWrapper} ${isOccupied ? styles.iconBgOrange : styles.iconBgGreen}`}>
                        <Coffee size={20} />
                      </div>
                      <div className={styles.tableText}>
                        <span className={styles.gridTableName}>{table.name}</span>
                        <span className={styles.tableStatusText}>
                          {isOccupied ? `Đang có khách (${itemsCount} món)` : 'Bàn trống'}
                        </span>
                      </div>
                    </div>

                    {/* Dải trạng thái màu trên đầu card giống y chang quản trị */}
                    <div className={`${styles.cardBorderTop} ${isOccupied ? styles.borderOrange : styles.borderGreen}`} />

                    {/* Cảnh báo hoạt động giống y chang quản trị */}
                    <div className={styles.cardActions}>
                      {isOccupied && (
                        <div 
                          className={styles.disabledDeleteWrapper}
                          title="Bàn đang hoạt động phục vụ khách"
                        >
                          <AlertTriangle size={15} className={styles.warningIcon} />
                          <span className={styles.warningTooltip}>đang hoạt động</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span>Chưa có bàn ăn nào được tạo. Vui lòng liên hệ Quản trị viên để cấu hình!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
