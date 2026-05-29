import { OrderSchema, TableSchema, ProductSchema, RestaurantSchema } from '../config/db.js';

// Hàm tính toán lại tổng tiền của Order (Helper)
const recalculateOrderTotals = (order) => {
  const total = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  order.totalAmount = total;
  order.finalAmount = Math.max(0, total - order.discount + order.tax);
  return order;
};

// [GET] /api/orders/table/:tableId
// Lấy đơn hàng hiện tại đang hoạt động (chưa thanh toán) của bàn ăn từ DB riêng của quán
export const getActiveOrderByTableId = async (req, res) => {
  try {
    const { tableId } = req.params;

    // Khởi tạo hoặc tái sử dụng model động
    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema); // Đăng ký Product model để populate hoạt động

    const order = await Order.findOne({ tableId, paymentStatus: 'pending' }).populate('items.productId');

    if (!order) {
      return res.status(200).json({
        success: true,
        message: 'Bàn ăn hiện đang trống, chưa có giỏ hàng hoạt động',
        data: {
          items: []
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// [POST] /api/orders/add-item
// Logic gộp trùng món: Thêm món từ Khách hoặc Thu ngân vào giỏ hàng của quán
export const addItemToOrder = async (req, res) => {
  try {
    const { tableId, restaurantId, productId, quantity = 1 } = req.body;

    if (!tableId || !restaurantId || !productId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ tableId, restaurantId, và productId' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);
    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);

    // 1. Tìm thông tin sản phẩm gốc
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Món ăn không tồn tại trong thực đơn' });
    }

    // 2. Tìm đơn hàng hiện tại của bàn (chưa thanh toán)
    let order = await Order.findOne({ tableId, paymentStatus: 'pending' });

    if (!order) {
      // Khởi tạo hóa đơn mới
      order = new Order({
        tableId,
        restaurantId,
        items: []
      });
    }

    // 3. Logic gộp trùng món: Kiểm tra xem món ăn đã tồn tại ở trạng thái ĐANG CHỜ LÀM ('pending') chưa
    const existingItem = order.items.find(
      (item) => item.productId.toString() === productId && item.status === 'pending'
    );

    if (existingItem) {
      // ĐÃ CÓ: Chỉ cập nhật tăng số lượng quantity
      existingItem.quantity += Number(quantity);
    } else {
      // CHƯA CÓ: Tạo mới một dòng món với orderItemId tự sinh ngẫu nhiên
      order.items.push({
        productId,
        name: product.name,
        price: product.price,
        quantity: Number(quantity),
        status: 'pending'
      });
    }

    // 4. Tính toán lại tổng số tiền
    recalculateOrderTotals(order);
    await order.save();

    // 5. Đồng bộ thời gian thực WebSockets (Socket.io)
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', {
        tableId,
        orderId: order._id,
        items: order.items,
        tenant: req.tenantCode
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Đã thêm món ăn vào hóa đơn thành công!',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi thêm món ăn', error: error.message });
  }
};

// [PUT] /api/orders/update-item-status
// API cập nhật trạng thái Bếp (Đánh dấu đã xong / Hoàn tác) dựa vào orderItemId duy nhất
export const updateOrderItemStatus = async (req, res) => {
  try {
    const { orderItemId, status } = req.body;

    if (!orderItemId || !status) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền orderItemId và trạng thái mới (pending/completed)' });
    }

    if (!['pending', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ. Phải là pending hoặc completed' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);

    // Tìm hóa đơn chứa dòng món ăn duy nhất này
    const order = await Order.findOne({ 'items.orderItemId': orderItemId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy dòng món ăn nào khớp với mã ID này' });
    }

    // Sửa trạng thái của item khớp
    const targetItem = order.items.find((item) => item.orderItemId === orderItemId);
    if (targetItem) {
      targetItem.status = status;
    }

    await order.save();

    // Đồng bộ thời gian thực WebSockets (Socket.io)
    const io = req.app.get('io');
    if (io) {
      io.emit('kitchen-item-status-updated', {
        orderItemId,
        status,
        tableId: order.tableId,
        tenant: req.tenantCode
      });
    }

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái dòng món sang [${status === 'completed' ? 'ĐÃ LÊN MÓN' : 'ĐANG CHỜ LÀM'}]`,
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật trạng thái món', error: error.message });
  }
};

// [POST] /api/orders/customer-submit
// Khách quét QR bấm "Gửi yêu cầu gọi món" từ điện thoại -> Đẩy xuống KDS bếp & Đổi trạng thái bàn ăn
export const customerSubmitQROrder = async (req, res) => {
  try {
    const { tableId, restaurantId, items } = req.body;

    if (!tableId || !restaurantId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách món ăn gửi đi không hợp lệ' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);
    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    const Table = req.tenantDb.models.Table || req.tenantDb.model('Table', TableSchema);

    // Tìm hoặc tạo mới Order chưa thanh toán cho bàn
    let order = await Order.findOne({ tableId, paymentStatus: 'pending' });
    if (!order) {
      order = new Order({
        tableId,
        restaurantId,
        items: []
      });
    }

    // Duyệt qua danh sách món gửi lên
    for (const row of items) {
      const { productId, quantity } = row;
      const product = await Product.findById(productId);
      if (!product) continue;

      // Check gộp món trùng trong trạng thái đang chờ bếp
      const existingItem = order.items.find(
        (item) => item.productId.toString() === productId && item.status === 'pending'
      );

      if (existingItem) {
        existingItem.quantity += Number(quantity);
      } else {
        order.items.push({
          productId,
          name: product.name,
          price: product.price,
          quantity: Number(quantity),
          status: 'pending'
        });
      }
    }

    // Tính toán tiền hàng và lưu hóa đơn
    recalculateOrderTotals(order);
    await order.save();

    // Đổi trạng thái bàn tương ứng sang 'active' (Đang hoạt động)
    await Table.findByIdAndUpdate(tableId, { status: 'active' });

    // Đồng bộ thời gian thực WebSockets (Socket.io)
    const io = req.app.get('io');
    if (io) {
      io.emit('customer-order', {
        tableId,
        orderId: order._id,
        items: order.items,
        tenant: req.tenantCode
      });
      io.emit('table-status-updated', {
        tableId,
        status: 'active',
        tenant: req.tenantCode
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Gửi yêu cầu gọi món thành công! Đã gửi thông tin tới bếp.',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi gửi đơn gọi món', error: error.message });
  }
};

// [POST] /api/payments/verify-vietqr
// Xác nhận chuyển khoản VietQR thành công -> Giải phóng bàn ăn trống
export const verifyPaymentAndReleaseTable = async (req, res) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã hóa đơn orderId' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    const Table = req.tenantDb.models.Table || req.tenantDb.model('Table', TableSchema);

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy hóa đơn cần thanh toán' });
    }

    // Đổi trạng thái thanh toán hóa đơn
    order.paymentStatus = 'paid';
    await order.save();

    // Cập nhật trạng thái bàn ăn về 'trong' (Trống) giải phóng bàn
    await Table.findByIdAndUpdate(order.tableId, { status: 'trong' });

    // Đồng bộ thời gian thực WebSockets (Socket.io)
    const io = req.app.get('io');
    if (io) {
      io.emit('payment-success', {
        orderId,
        tableId: order.tableId,
        tenant: req.tenantCode
      });
      io.emit('table-status-updated', {
        tableId: order.tableId,
        status: 'trong',
        tenant: req.tenantCode
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Thanh toán hóa đơn hoàn tất và giải phóng bàn ăn trống thành công!',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xử lý thanh toán', error: error.message });
  }
};

// [GET] /api/dashboard/report
// Báo cáo Doanh thu, số đơn, món chạy nhất, hiệu suất lợi nhuận đối chiếu vốn đầu tư
export const getDashboardReport = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã restaurantId' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Restaurant = req.tenantDb.models.Restaurant || req.tenantDb.model('Restaurant', RestaurantSchema);
    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema); // Đăng ký Product model để populate hoạt động

    // 1. Tìm thông tin quán & Cấu hình tài chính đối chiếu
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy quán ăn hợp lệ' });
    }

    const config = restaurant.config || {};
    const initialInvestment = config.initialInvestment || null;
    const targetProfitMargin = config.targetProfitMargin || null;

    // 2. Tìm toàn bộ các đơn hàng đã thanh toán của quán
    const paidOrders = await Order.find({ restaurantId, paymentStatus: 'paid' }).populate('items.productId');

    let totalRevenue = 0;
    let totalCost = 0;
    const totalOrdersCount = paidOrders.length;
    const productSalesMap = {};

    paidOrders.forEach((order) => {
      totalRevenue += order.finalAmount;

      order.items.forEach((item) => {
        const qty = item.quantity;
        const price = item.price;
        const cost = item.productId ? item.productId.costPrice : 0; // Giá vốn nhập hàng

        totalCost += (cost * qty);

        const prodId = item.productId ? item.productId._id.toString() : 'unknown';
        if (!productSalesMap[prodId]) {
          productSalesMap[prodId] = {
            name: item.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSalesMap[prodId].quantity += qty;
        productSalesMap[prodId].revenue += (price * qty);
      });
    });

    // Tính lợi nhuận thực tế thu về
    const actualProfit = totalRevenue - totalCost;

    // Tính tỷ suất lợi nhuận thực tế %: (Lợi nhuận / Doanh thu) * 100
    const actualProfitMargin = totalRevenue > 0 
      ? Math.round((actualProfit / totalRevenue) * 100) 
      : 0;

    // Sắp xếp tìm 5 món bán chạy nhất
    const topSellingProducts = Object.values(productSalesMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Tính toán tỷ lệ hoàn vốn nếu có cấu hình Vốn ban đầu
    const breakEvenProgress = (initialInvestment && initialInvestment > 0)
      ? Math.round((actualProfit / initialInvestment) * 100)
      : null;

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
// Cập nhật số lượng món ăn trong đơn hàng
export const updateOrderItemQuantity = async (req, res) => {
  try {
    const { orderItemId, quantity } = req.body;

    if (!orderItemId || quantity === undefined) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderItemId và số lượng mới' });
    }

    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    const order = await Order.findOne({ 'items.orderItemId': orderItemId });

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
    await order.save();

    // Phát sự kiện đồng bộ socket
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', {
        tableId: order.tableId,
        orderId: order._id,
        items: order.items,
        tenant: req.tenantCode
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Cập nhật số lượng món ăn thành công',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật số lượng món ăn', error: error.message });
  }
};

// [POST] /api/orders/remove-item
// Xóa món ăn khỏi đơn hàng
export const removeOrderItem = async (req, res) => {
  try {
    const { orderItemId } = req.body;

    if (!orderItemId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp orderItemId' });
    }

    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    const order = await Order.findOne({ 'items.orderItemId': orderItemId });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng chứa món này' });
    }

    order.items = order.items.filter(i => i.orderItemId !== orderItemId);

    recalculateOrderTotals(order);
    await order.save();

    // Phát sự kiện đồng bộ socket
    const io = req.app.get('io');
    if (io) {
      io.emit('order-updated', {
        tableId: order.tableId,
        orderId: order._id,
        items: order.items,
        tenant: req.tenantCode
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Xóa món khỏi đơn hàng thành công',
      data: order
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa món khỏi đơn hàng', error: error.message });
  }
};

// [GET] /api/orders/history
// Lấy danh sách các hóa đơn đã hoàn tất thanh toán (paid) phục vụ Dashboard thống kê doanh thu
export const getPaidOrdersHistory = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã restaurantId' });
    }

    const Order = req.tenantDb.models.Order || req.tenantDb.model('Order', OrderSchema);
    req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema); // Đăng ký Product model để populate hoạt động

    // Lấy 50 hóa đơn đã thanh toán gần đây nhất, sắp xếp mới nhất lên đầu
    const history = await Order.find({ restaurantId, paymentStatus: 'paid' })
      .populate('items.productId')
      .sort({ updatedAt: -1 })
      .limit(50);

    return res.status(200).json({
      success: true,
      data: history
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi trích xuất lịch sử đơn hàng', error: error.message });
  }
};
