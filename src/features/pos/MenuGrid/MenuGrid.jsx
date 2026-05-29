import React, { useState } from 'react';
import { Search, Info, Plus } from 'lucide-react';
import { useMenu } from '../../../hooks/useMenu';
import { useCart } from '../../../hooks/useCart';
import { Input } from '../../../components/Input/Input';
import styles from './MenuGrid.module.css';

// Lưới danh sách món ăn & Lọc thực đơn (POS Menu Grid & Category Filter)
export const MenuGrid = () => {
  const { getFilteredItems, getCategories } = useMenu();
  const { addToCart, cartItems } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');

  // Lấy danh sách món và danh mục
  const items = getFilteredItems(searchTerm, selectedCategory);
  const categories = getCategories();

  // Đếm nhanh số lượng món đó đang có trong giỏ để hiển thị huy hiệu (badge) nhỏ
  const getItemQtyInCart = (itemId) => {
    const existing = cartItems.find((item) => item.product.id === itemId);
    return existing ? existing.quantity : 0;
  };

  // Định dạng VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className={styles.container}>
      {/* Thanh tìm kiếm nhanh & Bộ lọc ngang */}
      <div className={`${styles.filterBar} glass-panel`}>
        <div className={styles.searchWrapper}>
          <Input
            placeholder="Nhập tên món ăn cần tìm nhanh..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={Search}
            className={styles.searchInput}
          />
        </div>
        
        <div className={styles.categoriesWrapper}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.catTab} ${selectedCategory === cat ? styles.activeTab : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid danh sách món ăn */}
      <div className={styles.gridWrapper}>
        {items.length > 0 ? (
          <div className={styles.grid}>
            {items.map((item) => {
              const qtyInCart = getItemQtyInCart(item.id);
              const isActive = item.status === 'active';

              return (
                <div
                  key={item.id}
                  className={`${styles.foodCard} ${!isActive ? styles.outOfStockCard : ''}`}
                  onClick={() => isActive && addToCart(item)}
                  title={isActive ? 'Click để thêm vào giỏ hàng' : 'Món này đã hết hàng'}
                >
                  {/* Ảnh sản phẩm + Tag số lượng trong giỏ */}
                  <div className={styles.cardImageArea}>
                    <img src={item.image} alt={item.name} className={styles.foodImg} />
                    {!isActive && (
                      <div className={styles.outOfStockOverlay}>
                        <span>Hết món</span>
                      </div>
                    )}
                    {qtyInCart > 0 && (
                      <div className={styles.cartQtyBadge}>
                        <span>{qtyInCart}</span>
                      </div>
                    )}
                    {isActive && (
                      <div className={styles.quickAddIcon}>
                        <Plus size={16} />
                      </div>
                    )}
                  </div>

                  {/* Thông tin món ăn */}
                  <div className={styles.cardInfo}>
                    <h5 className={styles.foodName}>{item.name}</h5>
                    {item.description && (
                      <p className={styles.foodDesc} title={item.description}>
                        {item.description}
                      </p>
                    )}
                    <div className={styles.cardFooter}>
                      <span className={styles.foodPrice}>
                        {formatCurrency(item.sellingPrice)}
                      </span>
                      <span className={styles.categoryLabel}>{item.category}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className={`${styles.emptyState} glass-panel`}>
            <Info size={40} className={styles.emptyIcon} />
            <h4>Không tìm thấy kết quả</h4>
            <p>Vui lòng thử tìm kiếm bằng từ khóa khác hoặc thay đổi bộ lọc danh mục.</p>
          </div>
        )}
      </div>
    </div>
  );
};
