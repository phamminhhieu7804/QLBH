import React from 'react';
import { useCart } from '../../../hooks/useCart';
import { TableSelector } from '../TableSelector/TableSelector';
import { MenuGrid } from '../MenuGrid/MenuGrid';
import { Cart } from '../Cart/Cart';
import styles from './POSLayout.module.css';

// Component Bố cục chính màn hình bán hàng POS (Sơ đồ bàn + Split Screen)
export const POSLayout = () => {
  const { isQRMode } = useCart();

  return (
    <div className={styles.posWorkspace}>
      {/* Sơ đồ chọn bàn ăn nằm trên cùng trải dài 100% */}
      {!isQRMode && (
        <div className={styles.tableSelectorArea}>
          <TableSelector />
        </div>
      )}

      {/* Phân hệ gọi món bên dưới (Split Screen) */}
      <div className={styles.container}>
        {/* Phân hệ bên trái: Lưới thực đơn & Lọc món */}
        <div className={styles.leftSection}>
          <MenuGrid />
        </div>

        {/* Phân hệ bên phải: Hóa đơn giỏ hàng & Thanh toán */}
        <div className={styles.rightSection}>
          <Cart />
        </div>
      </div>
    </div>
  );
};
export default POSLayout;
