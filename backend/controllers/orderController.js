import { v4 as uuidv4 } from 'uuid';
import { runBackgroundBackup } from '../services/googleDriveBackup.js';

// Hàm tính toán lại tổng tiền của Order (Helper)
const recalculateOrderTotals = (order) => {
  const total = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  order.totalAmount = total;
  order.finalAmount = Math.max(0, total - (order.discount || 0) + (order.tax || 0));
  return order;
};

// [GET] /api/orders/table/:tableId
// Lấy đơn hàng hiện tại đang hoạt động
export const getActiveOrderByTableId = async (req, res) => {
  try {
    const { tableId } = req.params;
    const db = req.tenantDb;

    const order = db.data.orders.find(o => o.tableId === tableId && o.paymentStatus === 'pending');

    if (!order) {
      return res.status(200).json({
        success: true,
        message: 'Bàn ăn hiện đang trống, chưa có giỏ hàng hoạt động',
        data: { items: [] }
      });
    }

    // Gắn (populate) thêm dữ liệu chi tiết của productId vào items để Frontend đọc được image
    const populatedOrder = JSON.parse(JSON.stringify(order));
    populatedOrder.items.forEach(item => {
      const productInfo = db.data.products.find(p => p._id === item.productId);
      if (productInfo) {
        item.productId = productInfo;
      }
    });

    return res.status(200).json({
      success: true,
      data: populatedOrder
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// [POST] /api/orders/add-item
// Thêm món từ Khách hoặc Thu ngân vào giỏ hàng
export const addItemToOrder = async (req, res) => {
  try {
    const { tableId, productId, quantity = 1 } = req.body;

    if (!tableId || !productId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tableId và productId' });
    }

    const db = req.tenantDb;

    const product = db.data.products.find(p => p._id === productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Món ăn không tồn tại trong thực đơn' });
    }

    let order = db.data.orders.find(o => o.tableId === tableId && o.paymentStatus === 'pending');

    if (!order) {
      order = {
        _id: uuidv4(),
        tableId,
        paymentStatus: 'pending',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.orders.push(order);
    } else {
      order.updatedAt = new Date().toISOString();
    }

    // Logic gộp trùng món
    const existingItem = order.items.find(
      (item) => item.productId === productId && item.status === 'pending'
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      order.items.push({
        orderItemId: uuidv4(),
        productId,
        name: product.name,
        price: product.price,
        quantity: Number(quantity),
        status: 'pending'
      });
    }

    recalculateOrderTotals(order);
    await db.write();

    // Đồng bộ thời gian thực WebSockets (Socket.io)
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { tableId, orderId: order._id, items: order.items, tenant: req.tenantCode });
    }

    return res.status(200).json({ success: true, message: 'Đã thêm món ăn vào hóa đơn thành công!', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi thêm món ăn', error: error.message });
  }
};

// [PUT] /api/orders/update-item-status
// API cập nhật trạng thái Bếp (Đánh dấu đã xong / Hoàn tác)
export const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderItemId, status } = req.body;

    if (!orderItemId || !status || !['pending', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
    }

    const db = req.tenantDb;
    const order = db.data.orders.find(o => o.items.some(i => i.orderItemId === orderItemId));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dòng món ăn nào khớp' });
    }

    const targetItem = order.items.find((item) => item.orderItemId === orderItemId);
    if (targetItem) {
      targetItem.status = status;
    }
    
    order.updatedAt = new Date().toISOString();
    await db.write();

    const io = req.app.get('io');
    if (io) {
      io.emit('kitchen-item-status-updated', { orderItemId, status, tableId: order.tableId, tenant: req.tenantCode });
    }

    return res.status(200).json({ success: true, message: `Đã cập nhật trạng thái`, data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái món', error: error.message });
  }
};

// [POST] /api/orders/customer-submit
// Khách quét QR bấm "Gửi yêu cầu gọi món" từ điện thoại
export const customerSubmitQROrder = async (req, res) => {
  try {
    const { tableId, items } = req.body;

    if (!tableId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách món ăn gửi đi không hợp lệ' });
    }

    const db = req.tenantDb;

    let order = db.data.orders.find(o => o.tableId === tableId && o.paymentStatus === 'pending');
    if (!order) {
      order = {
        _id: uuidv4(),
        tableId,
        paymentStatus: 'pending',
        items: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.orders.push(order);
    } else {
      order.updatedAt = new Date().toISOString();
    }

    for (const row of items) {
      const { productId, quantity } = row;
      const product = db.data.products.find(p => p._id === productId);
      if (!product) continue;

      const existingItem = order.items.find(
        (item) => item.productId === productId && item.status === 'pending'
      );

      if (existingItem) {
        existingItem.quantity += Number(quantity);
      } else {
        order.items.push({
          orderItemId: uuidv4(),
          productId,
          name: product.name,
          price: product.price,
          quantity: Number(quantity),
          status: 'pending'
        });
      }
    }

    recalculateOrderTotals(order);
    
    const table = db.data.tables.find(t => t._id === tableId);
    if (table) table.status = 'active';

    await db.write();

    const io = req.app.get('io');
    if (io) {
      io.emit('customer-order', { tableId, orderId: order._id, items: order.items, tenant: req.tenantCode });
      io.emit('table-status-updated', { tableId, status: 'active', tenant: req.tenantCode });
    }

    return res.status(200).json({ success: true, message: 'Gửi yêu cầu gọi món thành công!', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi gửi đơn gọi món', error: error.message });
  }
};

// [POST] /api/payments/verify-vietqr
// Thanh toán thành công -> Giải phóng bàn -> TỰ ĐỘNG XUẤT EXCEL GỬI LÊN DRIVE
export const verifyPaymentAndReleaseTable = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã hóa đơn' });
    }

    const db = req.tenantDb;
    
    const order = db.data.orders.find(o => o._id === orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn cần thanh toán' });
    }

    // Đổi trạng thái hoá đơn
    order.paymentStatus = 'paid';
    order.updatedAt = new Date().toISOString();

    // Dọn dẹp bàn
    const table = db.data.tables.find(t => t._id === order.tableId);
    if (table) {
      table.status = 'trong';
    }

    await db.write();

    // 🔥 GỌI BACKUP GOOGLE DRIVE NHƯ YÊU CẦU 🔥
    // Trích xuất cấu hình quán ăn và kích hoạt chạy ngầm
    const restaurant = db.data.restaurant;
    if (restaurant) {
      runBackgroundBackup(req.tenantCode, restaurant);
    }

    const io = req.app.get('io');
    if (io) {
      io.emit('payment-success', { orderId, tableId: order.tableId, tenant: req.tenantCode });
      io.emit('table-status-updated', { tableId: order.tableId, status: 'trong', tenant: req.tenantCode });
    }

    return res.status(200).json({ success: true, message: 'Thanh toán hoàn tất!', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xử lý thanh toán', error: error.message });
  }
};

// [GET] /api/dashboard/report
// Báo cáo Doanh thu cho Dashboard (Tính trực tiếp từ JSON RAM)
export const getDashboardReport = async (req, res) => {
  try {
    const db = req.tenantDb;
    
    const restaurant = db.data.restaurant;
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quán ăn hợp lệ' });
    }

    const config = restaurant.config || {};
    const initialInvestment = config.initialInvestment || null;
    const targetProfitMargin = config.targetProfitMargin || null;

    const paidOrders = db.data.orders.filter(o => o.paymentStatus === 'paid');

    let totalRevenue = 0;
    let totalCost = 0;
    const totalOrdersCount = paidOrders.length;
    const productSalesMap = {};

    paidOrders.forEach((order) => {
      totalRevenue += order.finalAmount || 0;

      order.items.forEach((item) => {
        const qty = item.quantity;
        const price = item.price;
        const productInfo = db.data.products.find(p => p._id === item.productId);
        const cost = productInfo ? productInfo.costPrice : 0;

        totalCost += (cost * qty);

        const prodId = item.productId || 'unknown';
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesMap[prodId].quantity += qty;
        productSalesMap[prodId].revenue += (price * qty);
      });
    });

    const actualProfit = totalRevenue - totalCost;
    const actualProfitMargin = totalRevenue > 0 ? Math.round((actualProfit / totalRevenue) * 100) : 0;
    const topSellingProducts = Object.values(productSalesMap).sort((a, b) => b.quantity - a.quantity).slice(0, 5);
    const breakEvenProgress = (initialInvestment && initialInvestment > 0) ? Math.round((actualProfit / initialInvestment) * 100) : null;

    return res.status(200).json({
      success: true,
      data: {
        financials: {
          totalRevenue,
          totalCost,
          actualProfit,
          actualProfitMargin: `${actualProfitMargin}%`,
          initialInvestment,
          targetProfitMargin: targetProfitMargin ? `${targetProfitMargin}%` : null,
          breakEvenProgress: breakEvenProgress !== null ? `${breakEvenProgress}%` : 'Chưa cấu hình vốn đầu tư'
        },
        totalOrdersCount,
        topSellingProducts
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi trích xuất báo cáo doanh số', error: error.message });
  }
};

// [PUT] /api/orders/update-item-qty
export const updateOrderItemQuantity = async (req, res) => {
  try {
    const { orderItemId, quantity } = req.body;

    if (!orderItemId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderItemId và số lượng mới' });
    }

    const db = req.tenantDb;
    const order = db.data.orders.find(o => o.items.some(i => i.orderItemId === orderItemId));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng chứa món này' });
    }

    const item = order.items.find(i => i.orderItemId === orderItemId);
    if (item) {
      const parsedQty = Math.max(0, Number(quantity));
      if (parsedQty === 0) {
        order.items = order.items.filter(i => i.orderItemId !== orderItemId);
      } else {
        item.quantity = parsedQty;
      }
    }

    recalculateOrderTotals(order);
    order.updatedAt = new Date().toISOString();
    await db.write();

    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { tableId: order.tableId, orderId: order._id, items: order.items, tenant: req.tenantCode });
    }

    return res.status(200).json({ success: true, message: 'Cập nhật thành công', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật số lượng món ăn', error: error.message });
  }
};

// [POST] /api/orders/remove-item
export const removeOrderItem = async (req, res) => {
  try {
    const { orderItemId } = req.body;

    if (!orderItemId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderItemId' });
    }

    const db = req.tenantDb;
    const order = db.data.orders.find(o => o.items.some(i => i.orderItemId === orderItemId));

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }

    order.items = order.items.filter(i => i.orderItemId !== orderItemId);
    recalculateOrderTotals(order);
    order.updatedAt = new Date().toISOString();
    
    await db.write();

    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', { tableId: order.tableId, orderId: order._id, items: order.items, tenant: req.tenantCode });
    }

    return res.status(200).json({ success: true, message: 'Đã xóa', data: order });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi', error: error.message });
  }
};

// [GET] /api/orders/history
export const getPaidOrdersHistory = async (req, res) => {
  try {
    const db = req.tenantDb;
    const history = db.data.orders
      .filter(o => o.paymentStatus === 'paid')
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 50);
      
    // Populate
    const populatedHistory = JSON.parse(JSON.stringify(history));
    populatedHistory.forEach(order => {
      order.items.forEach(item => {
        const productInfo = db.data.products.find(p => p._id === item.productId);
        if (productInfo) item.productId = productInfo;
      });
    });

    return res.status(200).json({ success: true, data: populatedHistory });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi', error: error.message });
  }
};
