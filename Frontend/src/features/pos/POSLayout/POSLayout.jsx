import React, { useState, useEffect } from 'react';
import { useCart } from '../../../hooks/useCart';
import { TableSelector } from '../TableSelector/TableSelector';
import { MenuGrid } from '../MenuGrid/MenuGrid';
import { Cart } from '../Cart/Cart';
import { ShoppingBag, Utensils } from 'lucide-react';
import styles from './POSLayout.module.css';

// Component Bố cục chính màn hình bán hàng POS (Sơ đồ bàn + Split Screen)
export const POSLayout = () => {
  const { isQRMode, cartItemsCount } = useCart();
  const [activeMobileTab, setActiveMobileTab] = useState('menu'); // 'menu' | 'cart'
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Theo dõi kích thước cửa sổ trình duyệt để bật tắt linh hoạt
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={styles.posWorkspace}>
      {/* Sơ đồ chọn bàn ăn nằm trên cùng trải dài 100% */}
      {!isQRMode && (!isMobile || activeMobileTab === 'menu') && (
        <div className={styles.tableSelectorArea}>
          <TableSelector />
        </div>
      )}

      {/* Phân hệ gọi món bên dưới */}
      <div className={styles.container}>
        {/* Lưới thực đơn bên trái */}
        {(!isMobile || activeMobileTab === 'menu') && (
          <div className={styles.leftSection}>
            <MenuGrid />
          </div>
        )}

        {/* Giỏ hàng thanh toán bên phải */}
        {(!isMobile || activeMobileTab === 'cart') && (
          <div className={`${styles.rightSection} ${isMobile ? styles.mobileCartActive : ''}`}>
            <Cart />
          </div>
        )}
      </div>

      {/* Thanh Bottom Tab Bar điều hướng tiện lợi trên Điện thoại */}
      {isMobile && (
        <div className={styles.mobileTabBar}>
          <button
            className={`${styles.tabBtn} ${activeMobileTab === 'menu' ? styles.activeTab : ''}`}
            onClick={() => setActiveMobileTab('menu')}
          >
            <Utensils size={20} />
            <span>Thực đơn</span>
          </button>
          
          <button
            className={`${styles.tabBtn} ${activeMobileTab === 'cart' ? styles.activeTab : ''}`}
            onClick={() => setActiveMobileTab('cart')}
          >
            <div className={styles.cartIconWrapper}>
              <ShoppingBag size={20} />
              {cartItemsCount > 0 && (
                <span className={styles.mobileCartBadge}>{cartItemsCount}</span>
              )}
            </div>
            <span>Giỏ hàng</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default POSLayout;
