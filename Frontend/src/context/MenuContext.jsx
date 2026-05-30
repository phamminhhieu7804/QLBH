import React, { createContext, useState, useEffect, useContext } from 'react';
import { TenantContext, getApiBaseUrl } from './TenantContext';
import { logActivity } from './CartContext';

// Tạo Context cho Thực đơn (Menu)
export const MenuContext = createContext();

// 1. Thực đơn mẫu truyền thống (Quán phở truyền thống - mặc định)
const TRADITIONAL_MENU = [
  {
    id: 'food-1',
    name: 'Phở Bò Tái Lăn Hà Nội',
    sellingPrice: 65000,
    costPrice: 28000,
    category: 'Món chính',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Phở bò tái lăn đậm vị truyền thống, thịt bò xào xèo thơm phức tỏi gừng và nhiều hành lá.'
  },
  {
    id: 'food-2',
    name: 'Cơm Tấm Sườn Bì Chả',
    sellingPrice: 59000,
    costPrice: 25000,
    category: 'Món chính',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Cơm tấm dẻo thơm ăn kèm sườn heo nướng mật ong vàng ruộm, bì dai giòn và chả trứng chưng.'
  },
  {
    id: 'food-3',
    name: 'Bún Chả Nem Cua Bể',
    sellingPrice: 75000,
    costPrice: 32000,
    category: 'Món chính',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Bún chả Hà Nội nướng than hoa thơm lừng kết hợp nem cua bể giòn rụm nhiều thịt cua.'
  },
  {
    id: 'drink-1',
    name: 'Cà Phê Muối Huế',
    sellingPrice: 35000,
    costPrice: 12000,
    category: 'Nước uống',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Cà phê phin đậm đà hòa quyện cùng lớp kem muối béo ngậy mằn mặn đặc trưng.'
  },
  {
    id: 'drink-2',
    name: 'Trà Đào Hồng Đài Các',
    sellingPrice: 42000,
    costPrice: 15000,
    category: 'Nước uống',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Trà đào thanh mát nấu cùng đào miếng giòn ngọt, sả thơm giải nhiệt cực tốt.'
  },
  {
    id: 'snack-1',
    name: 'Bánh Mì Nướng Muối Ớt',
    sellingPrice: 30000,
    costPrice: 12000,
    category: 'Ăn vặt',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Bánh mì nướng giòn quét bơ mật ong, muối ớt tôm, mỡ hành phi, chà bông ruốc béo ngậy.'
  },
  {
    id: 'dessert-1',
    name: 'Chè Khúc Bạch Trân Châu',
    sellingPrice: 45000,
    costPrice: 18000,
    category: 'Tráng miệng',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Thạch khúc bạch phô mai dẻo béo, nước đường phèn nhãn nhục ngọt thanh kèm hạnh nhân rang vàng.'
  }
];

// 2. Thực đơn mẫu Trà sữa & Ăn vặt (Tiệm trà sữa - khi Tên quán chứa 'tra' hoặc 'chill')
const MILKTEA_MENU = [
  {
    id: 'tea-1',
    name: 'Trà Sữa Trân Châu Hoàng Kim',
    sellingPrice: 45000,
    costPrice: 18000,
    category: 'Nước uống',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Trà sữa đen truyền thống béo ngậy, đi kèm lớp trân châu hoàng kim dai giòn sần sật ngọt lịm.'
  },
  {
    id: 'tea-2',
    name: 'Trà Sữa Matcha Thạch Phô Mai',
    sellingPrice: 49000,
    costPrice: 20000,
    category: 'Nước uống',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Matcha Uji Nhật Bản thơm đậm đà hòa cùng sữa tươi béo ngậy và thạch phô mai handmade siêu béo.'
  },
  {
    id: 'tea-3',
    name: 'Trà Đào Hồng Đài Các',
    sellingPrice: 42000,
    costPrice: 15000,
    category: 'Nước uống',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Trà trà đào thanh ngọt dịu nấu cùng đào miếng giòn ngọt, sả chanh thơm giải nhiệt cực tốt.'
  },
  {
    id: 'snack-1',
    name: 'Khoai Tây Lắc Trứng Muối',
    sellingPrice: 38000,
    costPrice: 14000,
    category: 'Ăn vặt',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Khoai tây cắt lát chiên giòn rụm bọc lớp bột trứng muối kim sa bùi béo mằn mặn.'
  },
  {
    id: 'snack-2',
    name: 'Bánh Tráng Cuộn Bơ Sốt Trứng',
    sellingPrice: 28000,
    costPrice: 10000,
    category: 'Ăn vặt',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Bánh tráng Tây Ninh cuộn ruốc tép, trứng cút luộc, hành phi giòn và rưới sốt bơ trứng vàng béo ngậy.'
  },
  {
    id: 'snack-3',
    name: 'Nem Chua Rán Giòn Hà Nội',
    sellingPrice: 35000,
    costPrice: 15000,
    category: 'Ăn vặt',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Nem chua rán bọc bột chiên xù sần sật nóng hổi, chấm kèm tương ớt cay nồng cực sướng.'
  },
  {
    id: 'dessert-1',
    name: 'Chè Khúc Bạch Phô Mai Hạnh Nhân',
    sellingPrice: 45000,
    costPrice: 18000,
    category: 'Tráng miệng',
    status: 'active',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Thạch khúc bạch kem tươi béo ngậy, nước vải thiều ngọt mát kèm hạnh nhân rang thơm lừng.'
  }
];

export const MenuProvider = ({ children }) => {
  const { tenant, restaurantId } = useContext(TenantContext);
  const [menuItems, setMenuItems] = useState([]);

  // Hàm tải thực đơn món ăn từ database MongoDB Render
  const fetchMenu = async () => {
    if (!tenant || !restaurantId) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/products?restaurantId=${restaurantId}&tenant=${tenant}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const formatted = data.data.map(item => ({
          id: item._id,
          name: item.name,
          sellingPrice: item.price,
          costPrice: item.costPrice,
          category: item.category,
          status: item.isAvailable ? 'active' : 'inactive',
          image: item.image,
          description: item.description || ''
        }));
        setMenuItems(formatted);
      }
    } catch (err) {
      console.error('Error fetching menu items:', err.message);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, [tenant, restaurantId]);

  // Thêm món ăn mới qua API
  const addMenuItem = async (item) => {
    if (!restaurantId) return;
    try {
      const payload = {
        name: item.name,
        image: item.image || '',
        price: Number(item.sellingPrice),
        costPrice: Number(item.costPrice),
        category: item.category,
        description: item.description || '',
        restaurantId
      };

      const res = await fetch(`${getApiBaseUrl()}/api/products?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu(); // Load lại thực đơn mới từ DB
        logActivity(tenant, 'Thực đơn', `Thêm món ăn mới: ${item.name} (Giá bán: ${Number(item.sellingPrice).toLocaleString('vi-VN')}đ)`);
      }
    } catch (err) {
      console.error('Error adding menu item:', err.message);
    }
  };

  // Cập nhật món ăn qua API
  const updateMenuItem = async (updatedItem) => {
    try {
      const payload = {
        name: updatedItem.name,
        image: updatedItem.image || '',
        price: Number(updatedItem.sellingPrice),
        costPrice: Number(updatedItem.costPrice),
        category: updatedItem.category,
        description: updatedItem.description || '',
        isAvailable: updatedItem.status === 'active'
      };

      const res = await fetch(`${getApiBaseUrl()}/api/products/${updatedItem.id}?tenant=${tenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu(); // Tải lại DB
        logActivity(tenant, 'Thực đơn', `Cập nhật thông tin món: ${updatedItem.name}`);
      }
    } catch (err) {
      console.error('Error updating menu item:', err.message);
    }
  };

  // Xóa món ăn qua API
  const deleteMenuItem = async (id) => {
    const targetItem = menuItems.find((item) => item.id === id);
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/products/${id}?tenant=${tenant}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        }
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu(); // Tải lại DB
        if (targetItem) {
          logActivity(tenant, 'Thực đơn', `Xóa món khỏi thực đơn: ${targetItem.name}`);
        }
      }
    } catch (err) {
      console.error('Error deleting menu item:', err.message);
    }
  };

  // Đổi nhanh trạng thái món ăn qua API
  const toggleMenuItemStatus = async (id) => {
    const targetItem = menuItems.find((item) => item.id === id);
    if (!targetItem) return;
    try {
      const nextAvailable = targetItem.status !== 'active';
      const payload = {
        isAvailable: nextAvailable
      };

      const res = await fetch(`${getApiBaseUrl()}/api/products/${id}?tenant=${tenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchMenu(); // Tải lại DB
        const nextStatus = nextAvailable ? 'ĐANG KINH DOANH' : 'NGỪNG KINH DOANH';
        logActivity(tenant, 'Thực đơn', `Thay đổi kinh doanh món ${targetItem.name} thành [${nextStatus}]`);
      }
    } catch (err) {
      console.error('Error toggling menu item status:', err.message);
    }
  };

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        addMenuItem,
        updateMenuItem,
        deleteMenuItem,
        toggleMenuItemStatus
      }}
    >
      {children}
    </MenuContext.Provider>
  );
};
