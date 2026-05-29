import React, { createContext, useState, useEffect, useContext } from 'react';
import { TenantContext } from './TenantContext';

// Tạo Context cho Giỏ hàng (Cart) và Lịch sử đơn hàng
export const CartContext = createContext();

// Hàm ghi nhận lịch sử hoạt động toàn cục (SaaS Activity Logger)
export const logActivity = (tenant, action, details) => {
  if (!tenant) return;
  const currentUser = localStorage.getItem('saas_current_user') || 'Hệ thống';
  const logStorageKey = `restaurant_activity_log_${tenant}`;
  const savedLogs = localStorage.getItem(logStorageKey);
  const currentLogs = savedLogs ? JSON.parse(savedLogs) : [];
  
  const newLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user: currentUser,
    action: action,
    details: details,
    timestamp: new Date().toISOString()
  };
  
  const updatedLogs = [newLog, ...currentLogs].slice(0, 500); // Giới hạn tối đa 500 nhật ký
  localStorage.setItem(logStorageKey, JSON.stringify(updatedLogs));
};

// Danh sách 12 bàn ăn mặc định cho nhà hàng
export const TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `table-${i + 1}`,
  name: `Bàn ${String(i + 1).padStart(2, '0')}`
}));


// Đơn hàng mẫu cho Quán ăn truyền thống
const TRADITIONAL_ORDERS = [
  {
    orderId: 'ORD-2001',
    amount: 198000,
    itemsCount: 4,
    items: [
      { id: 'food-1', name: 'Phở Bò Tái Lăn Hà Nội', price: 65000, quantity: 2 },
      { id: 'drink-1', name: 'Cà Phê Muối Huế', price: 35000, quantity: 1 },
      { id: 'snack-1', name: 'Bánh Mì Nướng Muối Ớt', price: 30000, quantity: 1 }
    ],
    timestamp: new Date(new Date().setHours(8, 30, 0)).toISOString()
  },
  {
    orderId: 'ORD-2002',
    amount: 117000,
    itemsCount: 2,
    items: [
      { id: 'food-3', name: 'Bún Chả Nem Cua Bể', price: 75000, quantity: 1 },
      { id: 'drink-2', name: 'Trà Đào Hồng Đài Các', price: 42000, quantity: 1 }
    ],
    timestamp: new Date(new Date().setHours(11, 15, 0)).toISOString()
  },
  {
    orderId: 'ORD-2003',
    amount: 282000,
    itemsCount: 5,
    items: [
      { id: 'food-2', name: 'Cơm Tấm Sườn Bì Chả', price: 59000, quantity: 3 },
      { id: 'drink-1', name: 'Cà Phê Muối Huế', price: 35000, quantity: 3 }
    ],
    timestamp: new Date(new Date().setHours(12, 45, 0)).toISOString()
  }
];

// Đơn hàng mẫu cho Tiệm Trà Sữa
const MILKTEA_ORDERS = [
  {
    orderId: 'ORD-3001',
    amount: 118000,
    itemsCount: 3,
    items: [
      { id: 'tea-1', name: 'Trà Sữa Trân Châu Hoàng Kim', price: 45000, quantity: 2 },
      { id: 'snack-2', name: 'Bánh Tráng Cuộn Bơ Sốt Trứng', price: 28000, quantity: 1 }
    ],
    timestamp: new Date(new Date().setHours(9, 15, 0)).toISOString()
  },
  {
    orderId: 'ORD-3002',
    amount: 170000,
    itemsCount: 4,
    items: [
      { id: 'tea-2', name: 'Trà Sữa Matcha Thạch Phô Mai', price: 49000, quantity: 2 },
      { id: 'snack-1', name: 'Khoai Tây Lắc Trứng Muối', price: 38000, quantity: 1 },
      { id: 'snack-3', name: 'Nem Chua Rán Giòn Hà Nội', price: 35000, quantity: 1 }
    ],
    timestamp: new Date(new Date().setHours(14, 30, 0)).toISOString()
  },
  {
    orderId: 'ORD-3003',
    amount: 236000,
    itemsCount: 6,
    items: [
      { id: 'tea-3', name: 'Trà Đào Hồng Đài Các', price: 42000, quantity: 3 },
      { id: 'snack-2', name: 'Bánh Tráng Cuộn Bơ Sốt Trứng', price: 28000, quantity: 2 },
      { id: 'dessert-1', name: 'Chè Khúc Bạch Phô Mai Hạnh Nhân', price: 45000, quantity: 1 }
    ],
    timestamp: new Date(new Date().setHours(16, 20, 0)).toISOString()
  }
];

export const CartProvider = ({ children }) => {
  const { tenant, restaurantId } = useContext(TenantContext);
  
  const urlParams = new URLSearchParams(window.location.search);
  const isQRMode = (urlParams.has('table') && urlParams.has('tenant')) || localStorage.getItem('saas_current_role') === 'customer';
  
  const [tables, setTables] = useState([]);
  const [activeTableId, setActiveTableId] = useState('');
  
  // States local để giữ tương thích giao diện
  const [tableCarts, setTableCarts] = useState({});
  const [qrDraftCarts, setQrDraftCarts] = useState({}); 
  const [tableDiningModes, setTableDiningModes] = useState({}); 
  const [tableOrderMetadata, setTableOrderMetadata] = useState({}); 
  
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [ordersHistory, setOrdersHistory] = useState([]);

  // 1. Tải danh sách bàn ăn từ MongoDB qua Render API
  const fetchTables = async () => {
    if (!tenant || !restaurantId) return;
    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/tables?restaurantId=${restaurantId}&tenant=${tenant}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const formatted = data.data.map(t => ({
          id: t._id,
          name: t.tableName,
          status: t.status
        }));
        setTables(formatted);
        
        // Mặc định chọn bàn đầu tiên
        const urlParams = new URLSearchParams(window.location.search);
        const qrTableId = urlParams.get('table');
        if (qrTableId) {
          setActiveTableId(qrTableId);
        } else if (formatted.length > 0 && !activeTableId) {
          setActiveTableId(formatted[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching tables:', err.message);
    }
  };

  // 2. Tải hóa đơn pending của bàn được chọn hiện tại
  const fetchActiveOrder = async (tableId) => {
    if (!tenant || !tableId) return;
    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/table/${tableId}?tenant=${tenant}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const order = data.data;
        if (order._id && order.items) {
          // Bàn đang có khách
          const cartItems = order.items.map(item => ({
            cartItemId: item.orderItemId,
            product: {
              id: item.productId?._id || item.productId || '',
              name: item.name,
              sellingPrice: item.price,
              costPrice: item.productId?.costPrice || 0,
              category: item.productId?.category || 'Món chính',
              image: item.productId?.image || '',
              status: 'active'
            },
            quantity: item.quantity,
            served: item.status === 'completed',
            dbOrderId: order._id
          }));

          setTableCarts(prev => ({ ...prev, [tableId]: cartItems }));
          setTableOrderMetadata(prev => ({
            ...prev,
            [tableId]: {
              startTime: new Date(order.createdAt).toLocaleTimeString('vi-VN'),
              date: new Date(order.createdAt).toLocaleDateString('vi-VN'),
              waiter: order.waiter || 'Thu ngân (DB)',
              dbOrderId: order._id
            }
          }));
          return;
        }
      }
      
      // Nếu không có order nào hoặc trống khách
      setTableCarts(prev => ({ ...prev, [tableId]: [] }));
      setTableOrderMetadata(prev => {
        const copy = { ...prev };
        delete copy[tableId];
        return copy;
      });
    } catch (err) {
      console.error('Error fetching active order:', err.message);
    }
  };

  // 3. Tải lịch sử đơn hàng đã thanh toán từ MongoDB phục vụ Dashboard
  const fetchOrdersHistory = async () => {
    if (!tenant || !restaurantId) return;
    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/history?restaurantId=${restaurantId}&tenant=${tenant}`, {
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        }
      });
      const data = await res.json();
      if (data.success && data.data) {
        const formatted = data.data.map(order => ({
          orderId: order._id.toString().slice(-6).toUpperCase(), // 6 ký tự cuối làm mã ngắn gọn đẹp mắt
          amount: order.finalAmount,
          itemsCount: order.items.reduce((acc, item) => acc + item.quantity, 0),
          items: order.items.map(item => ({
            id: item.productId?._id || item.productId || '',
            name: item.name,
            price: item.price,
            quantity: item.quantity
          })),
          timestamp: order.updatedAt
        }));
        setOrdersHistory(formatted);
      }
    } catch (err) {
      console.error('Error fetching orders history:', err.message);
    }
  };

  // Kích hoạt đồng bộ hóa khi chuyển đổi Bàn hoặc Quán
  useEffect(() => {
    fetchTables();
    fetchOrdersHistory();
  }, [tenant, restaurantId]);

  useEffect(() => {
    if (activeTableId) {
      fetchActiveOrder(activeTableId);
    }
  }, [activeTableId, tenant]);

  // Lấy giỏ hàng của bàn đang chọn hiện tại
  const currentCartItems = isQRMode 
    ? [
        ...(tableCarts[activeTableId] || []).map(item => ({ ...item, submitted: true })),
        ...(qrDraftCarts[activeTableId] || []).map(item => ({ ...item, submitted: false }))
      ]
    : (tableCarts[activeTableId] || []);

  // Thêm bàn ăn mới qua API
  const addTable = async (tableName) => {
    if (!tableName.trim() || !restaurantId) {
      return { success: false, message: 'Vui lòng cung cấp đầy đủ thông tin' };
    }
    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/tables?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({ tableName, restaurantId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchTables();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Xóa bàn ăn qua API
  const deleteTable = async (tableId) => {
    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/tables/${tableId}?tenant=${tenant}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        }
      });
      const data = await res.json();
      if (data.success) {
        await fetchTables();
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  // Thêm món vào bàn hiện tại qua API
  const addToCart = async (product) => {
    if (!restaurantId || !activeTableId) return;
    try {
      if (isQRMode) {
        const currentItems = qrDraftCarts[activeTableId] || [];
        const existing = currentItems.find((item) => item.product.id === product.id && !item.served);
        let updatedItems;
        if (existing) {
          updatedItems = currentItems.map((item) =>
            item.product.id === product.id && !item.served
              ? { ...item, quantity: item.quantity + 1 }
              : item
          );
        } else {
          const newItemId = `cart-item-${Date.now()}`;
          updatedItems = [...currentItems, { product, quantity: 1, served: false, cartItemId: newItemId }];
        }
        setQrDraftCarts(prev => ({ ...prev, [activeTableId]: updatedItems }));
        return;
      }

      const payload = {
        tableId: activeTableId,
        restaurantId,
        productId: product.id,
        quantity: 1
      };

      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/add-item?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        await fetchActiveOrder(activeTableId);
        logActivity(tenant, 'Gọi món', `Bàn ${getActiveTableName()} gọi thêm món: ${product.name}`);
      }
    } catch (err) {
      console.error('Error adding to cart:', err.message);
    }
  };

  // Cập nhật số lượng của dòng món qua API
  const updateQuantity = async (cartItemId, quantity) => {
    const val = isNaN(quantity) ? 0 : Math.max(0, Number(quantity));
    
    if (isQRMode) {
      const currentItems = qrDraftCarts[activeTableId] || [];
      const updatedItems = currentItems.map((item) => {
        if (item.cartItemId === cartItemId) {
          return { ...item, quantity: val };
        }
        return item;
      });
      setQrDraftCarts(prev => ({ ...prev, [activeTableId]: updatedItems }));
      return;
    }

    try {
      if (val === 0) {
        await removeFromCart(cartItemId);
        return;
      }

      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/update-item-qty?tenant=${tenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({ orderItemId: cartItemId, quantity: val })
      });
      const data = await res.json();
      if (data.success) {
        await fetchActiveOrder(activeTableId);
      }
    } catch (err) {
      console.error('Error updating quantity:', err.message);
    }
  };

  // Xóa dòng món khỏi đơn qua API
  const removeFromCart = async (cartItemId) => {
    if (isQRMode) {
      const currentItems = qrDraftCarts[activeTableId] || [];
      const updatedItems = currentItems.filter((item) => item.cartItemId !== cartItemId);
      setQrDraftCarts(prev => ({ ...prev, [activeTableId]: updatedItems }));
      return;
    }

    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/remove-item?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({ orderItemId: cartItemId })
      });
      const data = await res.json();
      if (data.success) {
        await fetchActiveOrder(activeTableId);
      }
    } catch (err) {
      console.error('Error removing item:', err.message);
    }
  };

  // Đổi trạng thái nấu món của Bếp qua API
  const toggleItemServed = async (cartItemId) => {
    try {
      const currentItems = tableCarts[activeTableId] || [];
      const targetItem = currentItems.find((item) => item.cartItemId === cartItemId);
      if (!targetItem) return;

      const nextStatus = targetItem.served ? 'pending' : 'completed';
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/update-item-status?tenant=${tenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({ orderItemId: cartItemId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        await fetchActiveOrder(activeTableId);
        logActivity(tenant, 'Phục vụ món', `Bàn ${getActiveTableName()} đánh dấu món ${targetItem.product.name} là [${nextStatus === 'completed' ? 'ĐÃ PHỤC VỤ' : 'CHƯA PHỤC VỤ'}]`);
      }
    } catch (err) {
      console.error('Error toggling serve status:', err.message);
    }
  };

  // Đồng bộ cho KDS (Màn hình bếp) theo ID bàn bất kỳ
  const toggleItemServedByTableId = async (tableId, cartItemId) => {
    try {
      const currentItems = tableCarts[tableId] || [];
      const targetItem = currentItems.find((item) => item.cartItemId === cartItemId);
      if (!targetItem) return;

      const nextStatus = targetItem.served ? 'pending' : 'completed';
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/update-item-status?tenant=${tenant}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({ orderItemId: cartItemId, status: nextStatus })
      });
      const data = await res.json();
      if (data.success) {
        await fetchActiveOrder(tableId);
      }
    } catch (err) {
      console.error('Error toggling KDS serve status:', err.message);
    }
  };

  // Gửi yêu cầu gọi món tự quét QR lên Bếp
  const submitQROrder = async (tableId) => {
    const draftItems = qrDraftCarts[tableId] || [];
    if (draftItems.length === 0 || !restaurantId) return;

    try {
      const itemsPayload = draftItems.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/orders/customer-submit?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({
          tableId,
          restaurantId,
          items: itemsPayload
        })
      });
      const data = await res.json();
      if (data.success) {
        setQrDraftCarts(prev => ({ ...prev, [tableId]: [] }));
        await fetchActiveOrder(tableId);
        await fetchTables();
        logActivity(tenant, 'QR Order', `Khách bàn ${getActiveTableName()} đã tự động gửi đơn xuống bếp`);
      }
    } catch (err) {
      console.error('Error submitting QR order:', err.message);
    }
  };

  // Hoàn tất thanh toán VietQR & giải phóng bàn
  const completeOrder = async (amount) => {
    const meta = tableOrderMetadata[activeTableId];
    if (!meta || !meta.dbOrderId) return;

    try {
      const res = await fetch(`https://qlbh-zsvr.onrender.com/api/payments/verify-vietqr?tenant=${tenant}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({ orderId: meta.dbOrderId })
      });
      const data = await res.json();
      if (data.success) {
        logActivity(tenant, 'Thanh toán', `Bàn ${getActiveTableName()} đã thanh toán số tiền ${amount.toLocaleString('vi-VN')}đ`);
        setDiscountPercentage(0);
        await fetchActiveOrder(activeTableId);
        await fetchTables();
        await fetchOrdersHistory();
        return { orderId: meta.dbOrderId.slice(-4) };
      }
    } catch (err) {
      console.error('Error completing order:', err.message);
    }
  };

  const clearCart = () => {
    if (isQRMode) {
      setQrDraftCarts(prev => ({ ...prev, [activeTableId]: [] }));
    } else {
      setTableCarts(prev => ({ ...prev, [activeTableId]: [] }));
    }
  };

  const getActiveTableName = () => {
    const found = tables.find((t) => t.id === activeTableId);
    return found ? found.name : 'Bàn 01';
  };

  const setDiningMode = (tableId, mode) => {
    setTableDiningModes(prev => ({ ...prev, [tableId]: mode }));
  };

  const transferTable = (fromTableId, toTableId) => {
    return { success: false, message: 'Tính năng chuyển gộp bàn trực tiếp trên database đang được cập nhật' };
  };

  const mergeTables = (fromTableId, toTableId) => {
    return { success: false, message: 'Tính năng gộp bàn trực tiếp trên database đang được cập nhật' };
  };

  return (
    <div style={{ display: 'contents' }}>
      <CartContext.Provider
        value={{
          isQRMode,
          tables: tables, 
          activeTableId,
          setActiveTableId,
          activeTableName: getActiveTableName(),
          tableCarts,
          cartItems: currentCartItems, 
          discountPercentage,
          setDiscountPercentage,
          taxPercentage,
          setTaxPercentage,
          ordersHistory,
          addToCart,
          updateQuantity,
          removeFromCart,
          toggleItemServed,
          addTable, 
          deleteTable, 
          clearCart,
          completeOrder,
          tableDiningModes,
          activeDiningMode: tableDiningModes[activeTableId] || 'dine-in',
          setDiningMode,
          transferTable,
          mergeTables,
          tableOrderMetadata,
          activeOrderMetadata: tableOrderMetadata[activeTableId],
          toggleItemServedByTableId, 
          submitQROrder 
        }}
      >
        {children}
      </CartContext.Provider>
    </div>
  );
};
