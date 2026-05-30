import { runBackgroundBackup } from '../services/googleDriveBackup.js';

// [GET] /api/restaurant/info?tableId=...
// Khách hàng quét mã QR tại bàn -> Trả về thông tin Quán và toàn bộ Menu từ DB riêng của quán
export const getRestaurantInfoByTableId = async (req, res) => {
  try {
    const { tableId } = req.query;

    if (!tableId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp tham số tableId' });
    }

    const db = req.tenantDb;

    // 1. Tìm thông tin Bàn trong file JSON
    const table = db.data.tables.find(t => t._id === tableId);
    if (!table) {
      return res.status(204).json({ 
        success: true, 
        message: 'Bàn ăn trống chưa được đăng ký trong quán này',
        data: null 
      });
    }

    // 2. Tìm thông tin Quán ăn
    const restaurant = db.data.restaurant;
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin Quán ăn liên kết với Bàn này' });
    }

    // 3. Lấy toàn bộ Menu sản phẩm đang hoạt động của Quán
    const products = db.data.products.filter(p => p.isAvailable === true);

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
      initialInvestment, 
      targetProfitMargin,
      bankId,
      customBank,
      bankAccountNo,
      bankAccountName,
      bankFullName,
      backupEmail
    } = req.body;

    const db = req.tenantDb;
    const restaurant = db.data.restaurant;

    // Kiểm tra xem Quán có tồn tại hay không
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
        ...restaurant.config,
        initialInvestment: parsedInvestment,
        targetProfitMargin: parsedMargin
      };
    }

    // Cập nhật Gmail sao lưu
    if (backupEmail !== undefined) {
      if (!restaurant.config) restaurant.config = {};
      
      const emailList = restaurant.config.backupEmails || [];
      const trimmedEmail = backupEmail.trim().toLowerCase();
      
      if (trimmedEmail && !emailList.includes(trimmedEmail)) {
        emailList.push(trimmedEmail);
        restaurant.config.backupEmails = emailList;
      }
    }

    // Cập nhật cấu hình ngân hàng khi được truyền lên
    if (bankId !== undefined) restaurant.bankId = bankId;
    if (customBank !== undefined) restaurant.customBank = customBank;
    if (bankAccountNo !== undefined) restaurant.bankAccountNo = bankAccountNo;
    if (bankAccountName !== undefined) restaurant.bankAccountName = bankAccountName;
    if (bankFullName !== undefined) restaurant.bankFullName = bankFullName;

    // Lệnh này lưu toàn bộ object đã thay đổi xuống file .json trên ổ cứng
    await db.write();

    // Chạy ngầm tiến trình tạo file Excel và upload lên Google Drive
    runBackgroundBackup(req.tenantCode, restaurant);

    return res.status(200).json({
      success: true,
      message: 'Cập nhật cấu hình thành công!',
      data: restaurant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi cấu hình hệ thống', error: error.message });
  }
};

// [GET] /api/restaurant
// Lấy thông tin cấu hình Quán ăn. Nếu chưa tồn tại, tự chèn dữ liệu mặc định để tự vá dữ liệu cho quán mới.
export const getRestaurant = async (req, res) => {
  try {
    const tenantCode = req.tenantCode;
    const db = req.tenantDb;

    let restaurant = db.data.restaurant;

    // Tự động tạo cấu hình mặc định mẫu nếu chưa có dữ liệu cấu hình trong DB riêng biệt của Tenant mới
    if (!restaurant) {
      let readableName = tenantCode
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      if (tenantCode === 'pho-gia-truyen') readableName = 'Phở Gia Truyền';
      if (tenantCode === 'tra-sua-chill') readableName = 'Trà Sữa Chill';

      restaurant = {
        _id: tenantCode,
        name: readableName,
        ownerName: 'Chủ Quán',
        phone: '',
        address: '',
        config: {
          initialInvestment: null,
          targetProfitMargin: null,
          backupEmails: []
        }
      };
      
      db.data.restaurant = restaurant;
      await db.write();

      // Chạy ngầm tiến trình sao lưu cho Tenant vừa khởi tạo
      runBackgroundBackup(tenantCode, restaurant);

      return res.status(201).json({
        success: true,
        message: 'Khởi tạo cấu hình mặc định quán ăn thành công!',
        data: restaurant
      });
    }

    return res.status(200).json({
      success: true,
      data: restaurant
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi tải hoặc khởi tạo cấu hình quán ăn', error: error.message });
  }
};
