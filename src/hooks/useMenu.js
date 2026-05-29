import { useContext } from 'react';
import { MenuContext } from '../context/MenuContext';

// Custom Hook quản lý logic thực đơn
export const useMenu = () => {
  const context = useContext(MenuContext);
  
  if (!context) {
    throw new Error('useMenu phải được sử dụng bên trong MenuProvider');
  }

  const {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemStatus
  } = context;

  // Hàm lọc món ăn theo từ khóa tìm kiếm và danh mục (Không phân biệt chữ hoa/thường)
  const getFilteredItems = (searchTerm = '', categoryFilter = 'Tất cả') => {
    return menuItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = categoryFilter === 'Tất cả' || item.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  // Trích xuất toàn bộ danh sách danh mục hiện có (để render các tab lọc động)
  const getCategories = () => {
    const categories = menuItems.map(item => item.category);
    // Trả về danh sách độc nhất
    return ['Tất cả', ...new Set(categories)];
  };

  return {
    menuItems,
    addMenuItem,
    updateMenuItem,
    deleteMenuItem,
    toggleMenuItemStatus,
    getFilteredItems,
    getCategories
  };
};
