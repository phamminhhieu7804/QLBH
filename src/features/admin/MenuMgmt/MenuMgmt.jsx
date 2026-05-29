import React, { useState } from 'react';
import { Search, Plus, Edit, Trash2, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { useMenu } from '../../../hooks/useMenu';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import { Modal } from '../../../components/Modal/Modal';
import { MenuForm } from '../MenuForm/MenuForm';
import styles from './MenuMgmt.module.css';

// Trang quản lý thực đơn (Admin Menu Management)
export const MenuMgmt = () => {
  const {
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemStatus,
    getFilteredItems,
    getCategories
  } = useMenu();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tất cả');
  
  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  
  // Xử lý xác nhận xóa
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Lọc món ăn dựa trên tìm kiếm và category
  const items = getFilteredItems(searchTerm, selectedCategory);
  const categories = getCategories();

  // Mở form thêm món mới
  const handleAddNew = () => {
    setEditingItem(null);
    setIsFormOpen(true);
  };

  // Mở form sửa món cũ
  const handleEdit = (item) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  // Lưu món ăn (cả thêm lẫn sửa)
  const handleSaveItem = (itemData) => {
    if (editingItem) {
      updateMenuItem(itemData);
    } else {
      addMenuItem(itemData);
    }
    setIsFormOpen(false);
  };

  // Trigger modal xóa
  const triggerDelete = (id) => {
    setDeletingId(id);
    setIsDeleteOpen(true);
  };

  // Thực hiện xóa thực tế
  const confirmDelete = () => {
    if (deletingId) {
      deleteMenuItem(deletingId);
      setIsDeleteOpen(false);
      setDeletingId(null);
    }
  };

  // Định dạng số tiền VND
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className={styles.container}>
      {/* Header trang quản lý */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Danh sách thực đơn</h2>
          <span className={styles.subtitle}>Quản lý món ăn, giá vốn, giá bán và trạng thái phục vụ</span>
        </div>
        <Button variant="primary" icon={Plus} onClick={handleAddNew}>
          Thêm món mới
        </Button>
      </div>

      {/* Bộ lọc & Tìm kiếm */}
      <div className={`${styles.filterBar} glass-panel`}>
        <div className={styles.searchWrapper}>
          <Input
            placeholder="Tìm tên món ăn hoặc mô tả..."
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

      {/* Bảng danh sách món ăn */}
      <div className={`${styles.tableWrapper} glass-panel`}>
        {items.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hình ảnh</th>
                <th>Tên món ăn</th>
                <th>Danh mục</th>
                <th className={styles.textRight}>Giá vốn</th>
                <th className={styles.textRight}>Giá bán</th>
                <th className={styles.textCenter}>Trạng thái</th>
                <th className={styles.textCenter}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className={item.status === 'inactive' ? styles.inactiveRow : ''}>
                  <td>
                    <div className={styles.imageCell}>
                      <img src={item.image} alt={item.name} className={styles.productImg} />
                    </div>
                  </td>
                  <td>
                    <div className={styles.nameCell}>
                      <span className={styles.itemName}>{item.name}</span>
                      {item.description && (
                        <span className={styles.itemDesc} title={item.description}>
                          {item.description}
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={styles.catBadge}>{item.category}</span>
                  </td>
                  <td className={`${styles.textRight} ${styles.fontNumeric}`}>
                    {formatCurrency(item.costPrice)}
                  </td>
                  <td className={`${styles.textRight} ${styles.fontNumeric} ${styles.fontWeightBold} ${styles.colorPrimary}`}>
                    {formatCurrency(item.sellingPrice)}
                  </td>
                  <td className={styles.textCenter}>
                    <button
                      className={`${styles.statusBadge} ${
                        item.status === 'active' ? styles.activeBadge : styles.inactiveBadge
                      }`}
                      onClick={() => toggleMenuItemStatus(item.id)}
                      title="Click để đổi trạng thái"
                    >
                      {item.status === 'active' ? (
                        <>
                          <Eye size={12} />
                          <span>Đang bán</span>
                        </>
                      ) : (
                        <>
                          <EyeOff size={12} />
                          <span>Ngừng bán</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className={styles.textCenter}>
                    <div className={styles.actionsCell}>
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleEdit(item)}
                        title="Chỉnh sửa món"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => triggerDelete(item.id)}
                        title="Xóa món"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className={styles.emptyState}>
            <span>Không tìm thấy món ăn nào phù hợp với bộ lọc.</span>
          </div>
        )}
      </div>

      {/* Modal Thêm/Sửa */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingItem ? 'Chỉnh sửa thông tin thực đơn' : 'Thêm món ăn mới vào thực đơn'}
        size="large"
      >
        <MenuForm
          item={editingItem}
          onSave={handleSaveItem}
          onClose={() => setIsFormOpen(false)}
        />
      </Modal>

      {/* Modal xác nhận xóa */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Xác nhận xóa món"
        size="small"
      >
        <div className={styles.deleteConfirmBody}>
          <AlertTriangle size={48} className={styles.warningIcon} />
          <p className={styles.warningText}>
            Bạn có chắc chắn muốn xóa món ăn này khỏi thực đơn không? Thao tác này không thể hoàn tác.
          </p>
          <div className={styles.deleteActions}>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Hủy bỏ
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
