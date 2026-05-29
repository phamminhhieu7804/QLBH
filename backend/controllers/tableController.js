import { TableSchema, RestaurantSchema } from '../config/db.js';

// [GET] /api/tables
// Lấy danh sách tất cả các bàn kèm trạng thái động
export const getAllTables = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã restaurantId' });
    }

    // Khởi tạo model động
    const Table = req.tenantDb.model('Table', TableSchema);
    const tables = await Table.find({ restaurantId }).sort({ tableName: 1 });

    return res.status(200).json({
      success: true,
      data: tables
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách bàn ăn', error: error.message });
  }
};

// [POST] /api/tables
// Thêm bàn ăn mới và tự động sinh mã URL QR Code của riêng bàn đó
export const createTable = async (req, res) => {
  try {
    const { tableName, restaurantId } = req.body;

    if (!tableName || !restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền tên bàn và mã restaurantId' });
    }

    // Khởi tạo model động
    const Table = req.tenantDb.model('Table', TableSchema);
    const Restaurant = req.tenantDb.model('Restaurant', RestaurantSchema);

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Quán ăn hợp lệ' });
    }

    // Chuyển đổi tên quán thành Slug chuẩn để làm Tenant Code
    const tenantSlug = restaurant.name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]|_)+/g, '')
      .trim()
      .replace(/\s+/g, '-');

    // Tạo bàn ăn mới trong DB riêng của quán
    const table = new Table({
      tableName,
      restaurantId,
      status: 'trong'
    });

    // Sinh mã QR Code URL hướng trực tiếp tới trang order của bàn ăn này
    // Sử dụng tên tenant động truyền trực tiếp từ req.tenantCode của quán
    const qrCodeUrl = `https://order-quản lý bán hàng by Sinh Viên Bonnie.com/order?tenant=${req.tenantCode}&table=${table._id}`;
    table.qrCodeUrl = qrCodeUrl;

    await table.save();

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo bàn ăn và QR Code thành công!',
      data: table
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Tên bàn ăn này đã tồn tại trong quán!' });
    }
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo bàn', error: error.message });
  }
};
