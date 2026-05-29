import React, { useContext } from 'react';
import { ChefHat, CheckCircle2, Circle, Clock, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';
import { CartContext } from '../../context/CartContext';
import styles from './KitchenDisplay.module.css';

export const KitchenDisplay = ({ onBack }) => {
  const { tables, tableCarts, toggleItemServedByTableId, tableOrderMetadata } = useContext(CartContext);

  // Chỉ lấy bàn đang có món, sắp xếp theo thời gian order (order trước lên đầu)
  const activeTables = tables
    .filter((table) => {
      const cart = tableCarts[table.id] || [];
      return cart.length > 0;
    })
    .sort((a, b) => {
      const metaA = tableOrderMetadata[a.id];
      const metaB = tableOrderMetadata[b.id];
      // Nếu có metadata startTime thì so sánh chuỗi giờ (HH:MM:SS)
      if (metaA?.startTime && metaB?.startTime) {
        return metaA.startTime.localeCompare(metaB.startTime);
      }
      // Bàn có metadata xuất hiện trước bàn không có
      if (metaA?.startTime) return -1;
      if (metaB?.startTime) return 1;
      return 0;
    });

  const totalPending = activeTables.reduce((acc, table) => {
    const cart = tableCarts[table.id] || [];
    return acc + cart.filter((item) => !item.served).length;
  }, 0);

  const totalDone = activeTables.reduce((acc, table) => {
    const cart = tableCarts[table.id] || [];
    return acc + cart.filter((item) => item.served).length;
  }, 0);

  return (
    <div className={styles.kdsPage}>
      {/* Background glows */}
      <div className={styles.bgGlow1} />
      <div className={styles.bgGlow2} />

      {/* Header */}
      <header className={`${styles.kdsHeader} glass-panel`}>
        <div className={styles.headerLeft}>
          <button className={styles.backBtn} onClick={onBack} title="Quay lại Hub">
            <ArrowLeft size={16} />
            <span>Hub</span>
          </button>
          <div className={styles.titleGroup}>
            <ChefHat size={22} className={styles.titleIcon} />
            <h1>Bếp – Màn hình làm món</h1>
          </div>
        </div>

        <div className={styles.headerStats}>
          {totalPending > 0 ? (
            <span className={styles.statPending}>
              <span className={styles.statDot} />
              {totalPending} món đang chờ
            </span>
          ) : (
            <span className={styles.statAllDone}>✅ Tất cả đã xong!</span>
          )}
          {totalDone > 0 && (
            <span className={styles.statDone}>
              <CheckCircle2 size={13} />
              {totalDone} món đã hoàn thành
            </span>
          )}
        </div>
      </header>

      {/* Body */}
      <main className={styles.kdsMain}>
        {activeTables.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle size={48} className={styles.emptyIcon} />
            <h2>Chưa có bàn nào đang hoạt động</h2>
            <p>Khi khách đặt món từ POS hoặc QR, danh sách sẽ tự động hiện ra đây.</p>
          </div>
        ) : (
          <div className={styles.tablesGrid}>
            {activeTables.map((table) => {
              const cart = tableCarts[table.id] || [];
              const pendingItems = cart.filter((item) => !item.served);
              const doneItems = cart.filter((item) => item.served);
              const allDone = pendingItems.length === 0;

              return (
                <div
                  key={table.id}
                  className={`${styles.tableCard} ${allDone ? styles.tableCardDone : styles.tableCardPending}`}
                >
                  {/* Card Header */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardHeaderLeft}>
                      <span className={`${styles.statusDot} ${allDone ? styles.dotDone : styles.dotPending}`} />
                      <span className={styles.tableName}>{table.name}</span>
                      {/* Thứ tự ưu tiên (bàn order trước = số nhỏ) */}
                      {!allDone && (
                        <span className={styles.priorityBadge}>#{activeTables.filter(t => !tableCarts[t.id]?.every(i => i.served)).indexOf(table) + 1}</span>
                      )}
                    </div>
                    <div className={styles.cardHeaderRight}>
                      <Clock size={12} />
                      {tableOrderMetadata[table.id]?.startTime ? (
                        <span className={styles.orderTime}>{tableOrderMetadata[table.id].startTime}</span>
                      ) : (
                        <span>{cart.reduce((acc, i) => acc + i.quantity, 0)} món</span>
                      )}
                      {allDone && <span className={styles.doneBadge}>Xong hết ✅</span>}
                    </div>
                  </div>


                  {/* Món đang chờ */}
                  {pendingItems.length > 0 && (
                    <div className={styles.itemsGroup}>
                      <p className={styles.groupLabel}>🔥 Đang chờ làm ({pendingItems.length})</p>
                      <ul className={styles.itemList}>
                        {pendingItems.map((item) => (
                          <li
                            key={item.cartItemId}
                            className={`${styles.itemRow} ${styles.itemRowPending}`}
                            onClick={() => toggleItemServedByTableId(table.id, item.cartItemId)}
                            title="Click để đánh dấu đã xong"
                          >
                            <Circle size={18} className={styles.iconPending} />
                            <span className={styles.itemName}>{item.product.name}</span>
                            <span className={styles.itemQty}>×{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Món đã xong */}
                  {doneItems.length > 0 && (
                    <div className={`${styles.itemsGroup} ${styles.itemsGroupFaded}`}>
                      <p className={styles.groupLabel}>✅ Đã hoàn thành ({doneItems.length})</p>
                      <ul className={styles.itemList}>
                        {doneItems.map((item) => (
                          <li
                            key={item.cartItemId}
                            className={`${styles.itemRow} ${styles.itemRowDone}`}
                            onClick={() => toggleItemServedByTableId(table.id, item.cartItemId)}
                            title="Click để hoàn tác"
                          >
                            <CheckCircle2 size={18} className={styles.iconDone} />
                            <span className={styles.itemNameDone}>{item.product.name}</span>
                            <span className={styles.itemQty}>×{item.quantity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};
