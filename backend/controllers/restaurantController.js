import { RestaurantSchema, TableSchema, ProductSchema } from '../config/db.js';

// [GET] /api/restaurant/info?tableId=...
// Khách hàng quét mã QR tại bàn -> Trả về thông tin Quán và toàn bộ Menu từ DB riêng của quán
export const getRestaurantInfoByTableId = async (req, res) => {
  try {
    const { tableId } = req.query;

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tham số tableId' });
    }

    // Khởi tạo hoặc tái sử dụng model động trên kết nối riêng biệt của request này
    const Table = req.tenantDb.models.Table || req.tenantDb.model('Table', TableSchema);
    const Restaurant = req.tenantDb.models.Restaurant || req.tenantDb.model('Restaurant', RestaurantSchema);
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);

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
    const { 
      restaurantId, 
      initialInvestment, 
      targetProfitMargin,
      bankId,
      customBank,
      bankAccountNo,
      bankAccountName,
      bankFullName
    } = req.body;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã restaurantId' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Restaurant = req.tenantDb.models.Restaurant || req.tenantDb.model('Restaurant', RestaurantSchema);

    // Kiểm tra xem Quán có tồn tại hay không
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy Quán ăn cần cấu hình' });
    }

    // Cập nhật cấu hình tài chính nếu có truyền lên
    if (initialInvestment !== undefined || targetProfitMargin !== undefined) {
      const parsedInvestment = (initialInvestment === '' || initialInvestment === undefined || initialInvestment === null) 
        ? null 
        : Number(initialInvestment);

      const parsedMargin = (targetProfitMargin === '' || targetProfitMargin === undefined || targetProfitMargin === null) 
        ? null 
        : Number(targetProfitMargin);

      restaurant.config = {
        initialInvestment: parsedInvestment,
        targetProfitMargin: parsedMargin
      };
    }

    // Cập nhật cấu hình ngân hàng khi được truyền lên
    if (bankId !== undefined) restaurant.bankId = bankId;
    if (customBank !== undefined) restaurant.customBank = customBank;
    if (bankAccountNo !== undefined) restaurant.bankAccountNo = bankAccountNo;
    if (bankAccountName !== undefined) restaurant.bankAccountName = bankAccountName;
    if (bankFullName !== undefined) restaurant.bankFullName = bankFullName;

    await restaurant.save();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cấu hình thành công!',
      data: restaurant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cấu hình hệ thống', error: error.message });
  }
};
