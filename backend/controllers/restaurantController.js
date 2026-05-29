import { RestaurantSchema, TableSchema, ProductSchema } from '../config/db.js';

// [GET] /api/restaurant/info?tableId=...
// Khách hàng quét mã QR tại bàn -> Trả về thông tin Quán và toàn bộ Menu từ DB riêng của quán
export const getRestaurantInfoByTableId = async (req, res) => {
  try {
    const { tableId } = req.query;

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tham số tableId' });
    }

    // Khởi tạo model động trên kết nối riêng biệt của request này
    const Table = req.tenantDb.model('Table', TableSchema);
    const Restaurant = req.tenantDb.model('Restaurant', RestaurantSchema);
    const Product = req.tenantDb.model('Product', ProductSchema);

    // 1. Tìm thông tin Bàn
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(204).json({ 
        success: true, 
        message: 'Bàn ăn trống chưa được đăng ký trong quán này',
        data: null 
      });
    }

    // 2. Tìm thông tin Quán ăn thuộc Bàn đó
    const restaurant = await Restaurant.findById(table.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin Quán ăn liên kết với Bàn này' });
    }

    // 3. Lấy toàn bộ Menu sản phẩm của Quán đang hoạt động
    const products = await Product.find({ restaurantId: restaurant._id, isAvailable: true });

    return res.status(200).json({
      success: true,
      data: {
        restaurant: {
          id: restaurant._id,
          name: restaurant.name,
          ownerName: restaurant.ownerName,
          phone: restaurant.phone,
          address: restaurant.address,
          config: restaurant.config
        },
        tableName: table.tableName,
        menu: products
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
};

// [POST] /api/restaurant/config
// Thiết lập Vốn đầu tư & Tỷ suất lợi nhuận mong muốn (An toàn với giá trị trống)
export const updateFinancialConfig = async (req, res) => {
  try {
    const { restaurantId, initialInvestment, targetProfitMargin } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã restaurantId' });
    }

    // Khởi tạo model động
    const Restaurant = req.tenantDb.model('Restaurant', RestaurantSchema);

    // Kiểm tra xem Quán có tồn tại hay không
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Quán ăn cần cấu hình' });
    }

    // Logic xử lý giá trị trống/null (khi người dùng xóa sạch ô nhập liệu trên FE gửi chuỗi rỗng "")
    const parsedInvestment = (initialInvestment === '' || initialInvestment === undefined || initialInvestment === null) 
      ? null 
      : Number(initialInvestment);

    const parsedMargin = (targetProfitMargin === '' || targetProfitMargin === undefined || targetProfitMargin === null) 
      ? null 
      : Number(targetProfitMargin);

    // Cập nhật cấu hình
    restaurant.config = {
      initialInvestment: parsedInvestment,
      targetProfitMargin: parsedMargin
    };

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cấu hình tài chính thành công!',
      data: restaurant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cấu hình hệ thống', error: error.message });
  }
};
