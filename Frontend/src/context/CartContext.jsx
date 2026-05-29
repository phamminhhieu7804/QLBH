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
  const { tenant } = useContext(TenantContext);
  
  const urlParams = new URLSearchParams(window.location.search);
  const isQRMode = (urlParams.has('table') && urlParams.has('tenant')) || localStorage.getItem('saas_current_role') === 'customer';
  
  // State quản lý danh sách bàn ăn động của quán
  const [tables, setTables] = useState([]);
  
  // Trạng thái bàn đang chọn
  const [activeTableId, setActiveTableId] = useState('table-1');
  
  // Đối tượng giỏ hàng chứa giỏ hàng của từng bàn độc lập: { 'table-1': [], 'table-2': [] }
  const [tableCarts, setTableCarts] = useState({});
  const [qrDraftCarts, setQrDraftCarts] = useState({}); // State quản lý danh sách bàn ăn nháp cho QR
  const [tableDiningModes, setTableDiningModes] = useState({}); // Lưu trữ hình thức phục vụ: dine-in (ngồi ăn) / take-away (mang đi)
  const [tableOrderMetadata, setTableOrderMetadata] = useState({}); // Lưu trữ thời gian bắt đầu, ngày, người phục vụ: { 'table-1': { startTime, date, waiter } }
  
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [taxPercentage, setTaxPercentage] = useState(0);
  const [ordersHistory, setOrdersHistory] = useState([]);

  // Lắng nghe sự thay đổi của Tenant để load bàn ăn, giỏ hàng các bàn & lịch sử giao dịch của quán đó
  useEffect(() => {
    if (!tenant) {
      setTables([]);
      setTableCarts({});
      setQrDraftCarts({});
      setTableDiningModes({});
      setTableOrderMetadata({});
      setOrdersHistory([]);
      setActiveTableId('table-1');
      return;
    }

    const urlParams = new URLSearchParams(window.location.search);
    const qrTableId = urlParams.get('table');
    if (qrTableId) {
      setActiveTableId(qrTableId);
    } else {
      setActiveTableId('table-1');
    }
    setDiscountPercentage(0);

    // 0. Tải danh sách bàn ăn động của quán
    const tablesStorageKey = `restaurant_tables_${tenant}`;
    const savedTables = localStorage.getItem(tablesStorageKey);
    let activeTablesList = [];
    
    if (savedTables) {
      activeTablesList = JSON.parse(savedTables);
      setTables(activeTablesList);
    } else {
      // Mặc định khởi tạo 12 bàn ăn ban đầu
      const defaultTables = Array.from({ length: 12 }, (_, i) => ({
        id: `table-${i + 1}`,
        name: `Bàn ${String(i + 1).padStart(2, '0')}`
      }));
      activeTablesList = defaultTables;
      setTables(defaultTables);
      localStorage.setItem(tablesStorageKey, JSON.stringify(defaultTables));
    }

    // 1. Tải giỏ hàng của các bàn ăn (Tự động nâng cấp thêm cartItemId nếu chưa có)
    const cartStorageKey = `restaurant_table_carts_${tenant}`;
    const savedCarts = localStorage.getItem(cartStorageKey);
    if (savedCarts) {
      const parsedCarts = JSON.parse(savedCarts);
      let needsMigration = false;
      const migratedCarts = {};
      Object.keys(parsedCarts).forEach((tableId) => {
        migratedCarts[tableId] = (parsedCarts[tableId] || []).map((item) => {
          if (!item.cartItemId) {
            needsMigration = true;
            return {
              ...item,
              cartItemId: `cart-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
            };
          }
          return item;
        });
      });
      setTableCarts(migratedCarts);
      if (needsMigration) {
        localStorage.setItem(cartStorageKey, JSON.stringify(migratedCarts));
      }
    } else {
      // Khởi tạo đối tượng rỗng cho các bàn ăn
      const initialCarts = {};
      activeTablesList.forEach((t) => {
        initialCarts[t.id] = [];
      });
      setTableCarts(initialCarts);
      localStorage.setItem(cartStorageKey, JSON.stringify(initialCarts));
    }

    // 2. Tải lịch sử đơn hàng
    const orderStorageKey = `restaurant_orders_${tenant}`;
    const savedOrders = localStorage.getItem(orderStorageKey);
    if (savedOrders) {
      setOrdersHistory(JSON.parse(savedOrders));
    } else {
      // Khởi tạo lịch sử đơn hàng trống cho quán mới
      setOrdersHistory([]);
      localStorage.setItem(orderStorageKey, JSON.stringify([]));
    }

    // 3. Tải trạng thái hình thức phục vụ (Dine-in / Takeaway) của từng bàn
    const modesStorageKey = `restaurant_table_dining_modes_${tenant}`;
    const savedModes = localStorage.getItem(modesStorageKey);
    if (savedModes) {
      setTableDiningModes(JSON.parse(savedModes));
    } else {
      setTableDiningModes({});
    }

    // 4. Tải thông tin đơn hàng (Metadata: thời gian bắt đầu, ngày, người phục vụ)
    const metadataStorageKey = `restaurant_table_metadata_${tenant}`;
    const savedMetadata = localStorage.getItem(metadataStorageKey);
    if (savedMetadata) {
      setTableOrderMetadata(JSON.parse(savedMetadata));
    } else {
      setTableOrderMetadata({});
    }

    // 5. Tải giỏ hàng nháp QR
    const qrDraftStorageKey = `restaurant_qr_draft_carts_${tenant}`;
    const savedQrDrafts = localStorage.getItem(qrDraftStorageKey);
    if (savedQrDrafts) {
      setQrDraftCarts(JSON.parse(savedQrDrafts));
    } else {
      setQrDraftCarts({});
    }
  }, [tenant]);

  // Lắng nghe sự kiện storage để đồng bộ thời gian thực giữa các tab (POS, Admin, Kitchen, QR)
  useEffect(() => {
    if (!tenant) return;

    const handleStorageChange = (e) => {
      if (!e.key) return;

      const tablesKey = `restaurant_tables_${tenant}`;
      const cartsKey = `restaurant_table_carts_${tenant}`;
      const ordersKey = `restaurant_orders_${tenant}`;
      const modesKey = `restaurant_table_dining_modes_${tenant}`;
      const metadataKey = `restaurant_table_metadata_${tenant}`;
      const qrDraftKey = `restaurant_qr_draft_carts_${tenant}`;

      if (e.key === tablesKey && e.newValue) {
        setTables(JSON.parse(e.newValue));
      } else if (e.key === cartsKey && e.newValue) {
        setTableCarts(JSON.parse(e.newValue));
      } else if (e.key === ordersKey && e.newValue) {
        setOrdersHistory(JSON.parse(e.newValue));
      } else if (e.key === modesKey && e.newValue) {
        setTableDiningModes(JSON.parse(e.newValue));
      } else if (e.key === metadataKey && e.newValue) {
        setTableOrderMetadata(JSON.parse(e.newValue));
      } else if (e.key === qrDraftKey && e.newValue) {
        setQrDraftCarts(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [tenant]);

  // Lưu giỏ hàng bàn ăn của quán hiện tại
  const saveTableCartsToStorage = (updatedCarts) => {
    if (tenant) {
      localStorage.setItem(`restaurant_table_carts_${tenant}`, JSON.stringify(updatedCarts));
    }
  };

  // Lưu lịch sử đơn hàng của quán hiện tại
  const saveOrdersToStorage = (updatedOrders) => {
    if (tenant) {
      localStorage.setItem(`restaurant_orders_${tenant}`, JSON.stringify(updatedOrders));
    }
  };

  // Lấy giỏ hàng của bàn đang chọn hiện tại (Trong chế độ QR thì lấy giỏ nháp kết hợp giỏ chính thức)
  const currentCartItems = isQRMode 
    ? [
        ...(tableCarts[activeTableId] || []).map(item => ({ ...item, submitted: true })),
        ...(qrDraftCarts[activeTableId] || []).map(item => ({ ...item, submitted: false }))
      ]
    : (tableCarts[activeTableId] || []);

  // Thêm món vào bàn hiện tại
  const addToCart = (product) => {
    if (product.status !== 'active') return;
    
    const currentItems = isQRMode 
      ? (qrDraftCarts[activeTableId] || [])
      : (tableCarts[activeTableId] || []);
      
    // Chỉ tìm món CHƯA được phục vụ (served: false) để tăng số lượng
    const existing = currentItems.find((item) => item.product.id === product.id && !item.served);
    let updatedItems;

    if (existing) {
      // Tăng số lượng của món chưa lên, giữ nguyên cartItemId
      updatedItems = currentItems.map((item) =>
        item.product.id === product.id && !item.served
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      if (!isQRMode) {
        logActivity(tenant, 'Gọi món', `Bàn ${getActiveTableName()} gọi thêm số lượng: +1 ${product.name}`);
      }
    } else {
      // Tạo entry mới (kể cả khi đã có món cùng loại nhưng đã tick served) với cartItemId độc nhất
      const newItemId = `cart-item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      updatedItems = [...currentItems, { product, quantity: 1, served: false, cartItemId: newItemId }];
      if (!isQRMode) {
        logActivity(tenant, 'Gọi món', `Bàn ${getActiveTableName()} gọi món mới: ${product.name} (Số lượng: 1)`);
      }
    }

    if (isQRMode) {
      const updatedDrafts = {
        ...qrDraftCarts,
        [activeTableId]: updatedItems
      };
      setQrDraftCarts(updatedDrafts);
      if (tenant) {
        localStorage.setItem(`restaurant_qr_draft_carts_${tenant}`, JSON.stringify(updatedDrafts));
      }
    } else {
      const updatedCarts = {
        ...tableCarts,
        [activeTableId]: updatedItems
      };
      setTableCarts(updatedCarts);
      saveTableCartsToStorage(updatedCarts);

      // Ghi nhận thông tin đơn hàng (Metadata) khi bắt đầu order món ăn đầu tiên
      if (currentItems.length === 0) {
        const userStorage = localStorage.getItem('saas_current_user') || 'Nhân viên thu ngân';
        const dateStr = new Date().toLocaleDateString('vi-VN');
        const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const newMetadata = {
          ...tableOrderMetadata,
          [activeTableId]: {
            startTime: timeStr,
            date: dateStr,
            waiter: userStorage
          }
        };
        setTableOrderMetadata(newMetadata);
        if (tenant) {
          localStorage.setItem(`restaurant_table_metadata_${tenant}`, JSON.stringify(newMetadata));
        }
      }
    }
  };

  const updateQuantity = (cartItemId, quantity) => {
    const currentItems = isQRMode
      ? (qrDraftCarts[activeTableId] || [])
      : (tableCarts[activeTableId] || []);
      
    const val = isNaN(quantity) ? 0 : Math.max(0, Number(quantity));
    
    // Tìm item cần update để lấy tên ghi nhận log
    const targetItem = currentItems.find((item) => item.cartItemId === cartItemId);
    
    const updatedItems = currentItems.map((item) => {
      if (item.cartItemId === cartItemId) {
        return { ...item, quantity: val };
      }
      return item;
    });

    if (isQRMode) {
      const updatedDrafts = {
        ...qrDraftCarts,
        [activeTableId]: updatedItems
      };
      setQrDraftCarts(updatedDrafts);
      if (tenant) {
        localStorage.setItem(`restaurant_qr_draft_carts_${tenant}`, JSON.stringify(updatedDrafts));
      }
    } else {
      const updatedCarts = {
        ...tableCarts,
        [activeTableId]: updatedItems
      };
      setTableCarts(updatedCarts);
      saveTableCartsToStorage(updatedCarts);

      if (targetItem) {
        logActivity(tenant, 'Thay đổi số lượng', `Bàn ${getActiveTableName()} cập nhật số lượng món ${targetItem.product.name} thành: ${val}`);
      }
    }
  };

  // Xóa món khỏi bàn hiện tại dựa trên cartItemId
  const removeFromCart = (cartItemId) => {
    const currentItems = isQRMode
      ? (qrDraftCarts[activeTableId] || [])
      : (tableCarts[activeTableId] || []);
      
    const targetItem = currentItems.find((item) => item.cartItemId === cartItemId);
    const updatedItems = currentItems.filter((item) => item.cartItemId !== cartItemId);

    if (isQRMode) {
      const updatedDrafts = {
        ...qrDraftCarts,
        [activeTableId]: updatedItems
      };
      setQrDraftCarts(updatedDrafts);
      if (tenant) {
        localStorage.setItem(`restaurant_qr_draft_carts_${tenant}`, JSON.stringify(updatedDrafts));
      }
    } else {
      const updatedCarts = {
        ...tableCarts,
        [activeTableId]: updatedItems
      };
      setTableCarts(updatedCarts);
      saveTableCartsToStorage(updatedCarts);

      if (targetItem) {
        logActivity(tenant, 'Xóa món ăn', `Bàn ${getActiveTableName()} xóa khỏi giỏ hàng món: ${targetItem.product.name}`);
      }
    }
  };

  // Đảo ngược trạng thái đã phục vụ món ăn (Tick lên món) - cho bàn đang chọn dựa trên cartItemId
  const toggleItemServed = (cartItemId) => {
    if (isQRMode) return; // Khách quét QR không được tự tiện tick món!
    
    const currentItems = tableCarts[activeTableId] || [];
    const targetItem = currentItems.find((item) => item.cartItemId === cartItemId);
    
    const updatedItems = currentItems.map((item) => {
      if (item.cartItemId === cartItemId) {
        return { ...item, served: !item.served };
      }
      return item;
    });

    const updatedCarts = {
      ...tableCarts,
      [activeTableId]: updatedItems
    };

    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    if (targetItem) {
      logActivity(tenant, 'Tick phục vụ', `Bàn ${getActiveTableName()} đánh dấu món ${targetItem.product.name} là [${!targetItem.served ? 'ĐÃ LÊN' : 'CHƯA LÊN'}]`);
    }
  };

  // Đảo ngược trạng thái đã phục vụ món ăn theo tableId cụ thể (Dùng cho KDS ở Hub) dựa trên cartItemId
  const toggleItemServedByTableId = (tableId, cartItemId) => {
    const currentItems = tableCarts[tableId] || [];
    const targetItem = currentItems.find((item) => item.cartItemId === cartItemId);
    const tableObj = tables.find((t) => t.id === tableId);
    const tableName = tableObj ? tableObj.name : `Bàn ${tableId}`;

    const updatedItems = currentItems.map((item) => {
      if (item.cartItemId === cartItemId) {
        return { ...item, served: !item.served };
      }
      return item;
    });

    const updatedCarts = {
      ...tableCarts,
      [tableId]: updatedItems
    };

    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    if (targetItem) {
      logActivity(tenant, 'Bếp làm món', `Bếp đã cập nhật trạng thái món ${targetItem.product.name} tại ${tableName} thành [${!targetItem.served ? 'ĐÃ HOÀN THÀNH' : 'ĐANG CHỜ LÀM'}]`);
    }
  };

  // Thêm bàn ăn mới vào sơ đồ
  const addTable = (tableName) => {
    if (!tableName.trim()) {
      return { success: false, message: 'Tên bàn ăn không được để trống!' };
    }

    const isExisted = tables.some(
      (t) => t.name.toLowerCase() === tableName.trim().toLowerCase()
    );

    if (isExisted) {
      return { success: false, message: `Tên bàn ăn "${tableName.trim()}" đã tồn tại!` };
    }

    const newTableId = `table-${Date.now()}`;
    const newTable = {
      id: newTableId,
      name: tableName.trim()
    };

    const updatedTables = [...tables, newTable];
    setTables(updatedTables);
    if (tenant) {
      localStorage.setItem(`restaurant_tables_${tenant}`, JSON.stringify(updatedTables));
    }

    // Thêm giỏ hàng rỗng cho bàn mới
    const updatedCarts = {
      ...tableCarts,
      [newTableId]: []
    };
    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    return { success: true };
  };

  // Xóa bàn ăn khỏi sơ đồ (Chỉ cho xóa bàn trống)
  const deleteTable = (tableId) => {
    const currentItems = tableCarts[tableId] || [];
    if (currentItems.length > 0) {
      return { success: false, message: 'Bàn ăn đang có khách phục vụ, không thể xóa!' };
    }

    const updatedTables = tables.filter((t) => t.id !== tableId);
    setTables(updatedTables);
    if (tenant) {
      localStorage.setItem(`restaurant_tables_${tenant}`, JSON.stringify(updatedTables));
    }

    // Xóa giỏ hàng của bàn
    const updatedCarts = { ...tableCarts };
    delete updatedCarts[tableId];
    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    // Nếu bàn ăn bị xóa là bàn đang chọn ở POS, đổi sang bàn khác
    if (activeTableId === tableId) {
      const remainingTable = updatedTables[0];
      setActiveTableId(remainingTable ? remainingTable.id : '');
    }

    return { success: true };
  };

  // Xóa sạch giỏ hàng của bàn hiện tại
  const clearCart = () => {
    if (isQRMode) {
      const updatedDrafts = {
        ...qrDraftCarts,
        [activeTableId]: []
      };
      setQrDraftCarts(updatedDrafts);
      if (tenant) {
        localStorage.setItem(`restaurant_qr_draft_carts_${tenant}`, JSON.stringify(updatedDrafts));
      }
    } else {
      const updatedCarts = {
        ...tableCarts,
        [activeTableId]: []
      };

      setTableCarts(updatedCarts);
      saveTableCartsToStorage(updatedCarts);
      setDiscountPercentage(0);

      // Xóa thông tin đơn hàng (Metadata) tương ứng
      const updatedMetadata = { ...tableOrderMetadata };
      delete updatedMetadata[activeTableId];
      setTableOrderMetadata(updatedMetadata);
      if (tenant) {
        localStorage.setItem(`restaurant_table_metadata_${tenant}`, JSON.stringify(updatedMetadata));
      }
    }
  };

  // Hoàn tất đơn hàng cho bàn hiện tại (Thanh toán)
  const completeOrder = (amount) => {
    const currentItems = tableCarts[activeTableId] || [];
    const activeTable = tables.find((t) => t.id === activeTableId);
    const tableName = activeTable ? activeTable.name : 'Bàn ẩn';

    const newOrder = {
      orderId: `ORD-${Date.now().toString().slice(-4)}`,
      amount,
      itemsCount: currentItems.reduce((acc, curr) => acc + curr.quantity, 0),
      items: currentItems.map((item) => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.sellingPrice,
        quantity: item.quantity
      })),
      tableName: tableName, // Ghi nhận số bàn vào hóa đơn!
      timestamp: new Date().toISOString()
    };
    
    // 1. Lưu vào lịch sử đơn hàng
    const updatedOrders = [newOrder, ...ordersHistory];
    setOrdersHistory(updatedOrders);
    saveOrdersToStorage(updatedOrders);

    // 2. Làm sạch giỏ hàng của bàn hiện tại
    const updatedCarts = {
      ...tableCarts,
      [activeTableId]: []
    };
    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    // Xóa thông tin đơn hàng (Metadata) tương ứng
    const updatedMetadata = { ...tableOrderMetadata };
    delete updatedMetadata[activeTableId];
    setTableOrderMetadata(updatedMetadata);
    if (tenant) {
      localStorage.setItem(`restaurant_table_metadata_${tenant}`, JSON.stringify(updatedMetadata));
    }

    // Ghi nhận nhật ký hoạt động
    logActivity(tenant, 'Thanh toán', `Thanh toán hóa đơn ${newOrder.orderId} tại ${tableName} số tiền ${amount.toLocaleString('vi-VN')}đ`);


    setDiscountPercentage(0);
    return newOrder;
  };

  // Đặt trạng thái hình thức phục vụ (Ngồi ăn / Mang đi) cho bàn ăn
  const setDiningMode = (tableId, mode) => {
    const updatedModes = {
      ...tableDiningModes,
      [tableId]: mode
    };
    setTableDiningModes(updatedModes);
    if (tenant) {
      localStorage.setItem(`restaurant_table_dining_modes_${tenant}`, JSON.stringify(updatedModes));
    }
  };

  // Chuyển đổi toàn bộ bàn ăn (giỏ hàng và hình thức phục vụ) sang bàn mới
  const transferTable = (fromTableId, toTableId) => {
    if (fromTableId === toTableId) {
      return { success: false, message: 'Bàn cũ và bàn mới trùng nhau!' };
    }

    const fromCart = tableCarts[fromTableId] || [];
    const toCart = tableCarts[toTableId] || [];

    // Gộp giỏ hàng của bàn cũ vào bàn mới
    const mergedCart = [...toCart];
    fromCart.forEach((fromItem) => {
      const existing = mergedCart.find((toItem) => toItem.product.id === fromItem.product.id);
      if (existing) {
        existing.quantity += fromItem.quantity;
        existing.served = existing.served || fromItem.served;
      } else {
        mergedCart.push({ ...fromItem });
      }
    });

    const updatedCarts = {
      ...tableCarts,
      [toTableId]: mergedCart,
      [fromTableId]: []
    };

    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    // Chuyển hình thức phục vụ sang bàn mới
    const updatedModes = {
      ...tableDiningModes,
      [toTableId]: tableDiningModes[fromTableId] || 'dine-in',
      [fromTableId]: 'dine-in'
    };
    setTableDiningModes(updatedModes);
    if (tenant) {
      localStorage.setItem(`restaurant_table_dining_modes_${tenant}`, JSON.stringify(updatedModes));
    }

    // Chuyển thông tin đơn hàng (Metadata) sang bàn mới
    const updatedMetadata = { ...tableOrderMetadata };
    if (updatedMetadata[fromTableId]) {
      updatedMetadata[toTableId] = updatedMetadata[fromTableId];
    }
    delete updatedMetadata[fromTableId];
    setTableOrderMetadata(updatedMetadata);
    if (tenant) {
      localStorage.setItem(`restaurant_table_metadata_${tenant}`, JSON.stringify(updatedMetadata));
    }

    // Đổi bàn đang chọn ở POS sang bàn mới
    setActiveTableId(toTableId);

    return { success: true };
  };

  // Gộp bàn ăn (gộp giỏ hàng và gộp thông tin đơn hàng)
  const mergeTables = (fromTableId, toTableId) => {
    if (fromTableId === toTableId) {
      return { success: false, message: 'Bàn cũ và bàn mới trùng nhau!' };
    }

    const fromCart = tableCarts[fromTableId] || [];
    const toCart = tableCarts[toTableId] || [];

    if (fromCart.length === 0) {
      return { success: false, message: 'Bàn hiện tại không có món ăn để gộp!' };
    }

    // Gộp giỏ hàng của bàn cũ vào bàn mới
    const mergedCart = [...toCart];
    fromCart.forEach((fromItem) => {
      const existing = mergedCart.find((toItem) => toItem.product.id === fromItem.product.id);
      if (existing) {
        existing.quantity += fromItem.quantity;
        existing.served = existing.served || fromItem.served;
      } else {
        mergedCart.push({ ...fromItem });
      }
    });

    const updatedCarts = {
      ...tableCarts,
      [toTableId]: mergedCart,
      [fromTableId]: []
    };

    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    // Gộp hình thức phục vụ: Bàn nhận kế thừa hình thức bàn cũ nếu bàn nhận chưa được thiết lập
    const updatedModes = {
      ...tableDiningModes,
      [toTableId]: tableDiningModes[toTableId] || tableDiningModes[fromTableId] || 'dine-in',
      [fromTableId]: 'dine-in'
    };
    setTableDiningModes(updatedModes);
    if (tenant) {
      localStorage.setItem(`restaurant_table_dining_modes_${tenant}`, JSON.stringify(updatedModes));
    }

    // Gộp thông tin đơn hàng (Metadata)
    const updatedMetadata = { ...tableOrderMetadata };
    if (!updatedMetadata[toTableId] && updatedMetadata[fromTableId]) {
      updatedMetadata[toTableId] = updatedMetadata[fromTableId];
    }
    delete updatedMetadata[fromTableId];
    setTableOrderMetadata(updatedMetadata);
    if (tenant) {
      localStorage.setItem(`restaurant_table_metadata_${tenant}`, JSON.stringify(updatedMetadata));
    }

    // Đổi bàn đang chọn ở POS sang bàn mới
    setActiveTableId(toTableId);

    return { success: true };
  };

  // Xác nhận gọi món từ QR, cập nhật trạng thái bàn và ghi log hoạt động
  const submitQROrder = (tableId) => {
    const draftItems = qrDraftCarts[tableId] || [];
    if (draftItems.length === 0) return;

    // Lấy giỏ hàng chính thức hiện tại của bàn
    const currentOfficialItems = tableCarts[tableId] || [];

    // Gộp trùng món từ draft vào giỏ hàng chính thức
    const mergedOfficialItems = [...currentOfficialItems];
    draftItems.forEach((draftItem) => {
      const existing = mergedOfficialItems.find(
        (item) => item.product.id === draftItem.product.id && !item.served
      );
      if (existing) {
        existing.quantity += draftItem.quantity;
      } else {
        mergedOfficialItems.push({ ...draftItem });
      }
    });

    const updatedCarts = {
      ...tableCarts,
      [tableId]: mergedOfficialItems
    };

    setTableCarts(updatedCarts);
    saveTableCartsToStorage(updatedCarts);

    // Xóa giỏ hàng nháp sau khi đã gửi đi thành công
    const updatedDrafts = {
      ...qrDraftCarts,
      [tableId]: []
    };
    setQrDraftCarts(updatedDrafts);
    if (tenant) {
      localStorage.setItem(`restaurant_qr_draft_carts_${tenant}`, JSON.stringify(updatedDrafts));
    }

    // Ghi nhận thông tin đơn hàng (Metadata)
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateStr = new Date().toLocaleDateString('vi-VN');
    
    const existingMeta = tableOrderMetadata[tableId] || {};
    const newMetadata = {
      ...tableOrderMetadata,
      [tableId]: {
        startTime: existingMeta.startTime || timeStr,
        date: dateStr,
        waiter: 'Khách tự gọi (QR)',
        status: 'active'
      }
    };
    
    setTableOrderMetadata(newMetadata);
    if (tenant) {
      localStorage.setItem(`restaurant_table_metadata_${tenant}`, JSON.stringify(newMetadata));
    }
    
    const tableName = tables.find((t) => t.id === tableId)?.name || tableId;
    const itemsSummary = draftItems.map(i => `${i.product.name} (x${i.quantity})`).join(', ');
    logActivity(tenant, 'Gọi món', `Khách quét QR tại ${tableName} đã gửi đơn xuống bếp: ${itemsSummary}`);
  };

  // Lấy tên bàn hiện tại đang chọn
  const getActiveTableName = () => {
    const found = tables.find((t) => t.id === activeTableId);
    return found ? found.name : 'Bàn 01';
  };

  return (
    <div style={{ display: 'contents' }}>
      <CartContext.Provider
        value={{
          isQRMode,
          tables: tables, // Sử dụng state động
          activeTableId,
          setActiveTableId,
          activeTableName: getActiveTableName(),
          tableCarts,
          cartItems: currentCartItems, // Tự động trả về giỏ của bàn đang chọn
          discountPercentage,
          setDiscountPercentage,
          taxPercentage,
          setTaxPercentage,
          ordersHistory,
          addToCart,
          updateQuantity,
          removeFromCart,
          toggleItemServed,
          addTable, // Xuất bản hàm thêm bàn
          deleteTable, // Xuất bản hàm xóa bàn
          clearCart,
          completeOrder,
          tableDiningModes,
          activeDiningMode: tableDiningModes[activeTableId] || 'dine-in',
          setDiningMode,
          transferTable,
          mergeTables,
          tableOrderMetadata,
          activeOrderMetadata: tableOrderMetadata[activeTableId],
          toggleItemServedByTableId, // KDS: Tick món theo tableId bất kỳ
          submitQROrder // Gửi đơn QR & Cập nhật trạng thái
        }}
      >
        {children}
      </CartContext.Provider>
    </div>
  );
};
