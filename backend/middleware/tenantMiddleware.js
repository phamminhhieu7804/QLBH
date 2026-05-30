import { getTenantDb } from '../config/db.js';
import { seedTenantData } from '../config/seeder.js';

// Middleware phân tuyến cơ sở dữ liệu động dành cho từng Quán (Multi-Tenant Routing)
export const tenantMiddleware = async (req, res, next) => {
  try {
    // 1. Trích xuất mã Quán (Tenant Code) từ Headers, Query parameters hoặc Body
    const tenantHeader = req.headers['x-tenant'];
    const tenantQuery = req.query.tenant;
    const tenantBody = req.body.tenant;
    
    // Ưu tiên: Header -> Query -> Body. Nếu không có thì dùng 'default' để tránh crash
    const tenantCode = tenantHeader || tenantQuery || tenantBody || 'default';

    // 2. Lấy đối tượng kết nối động (Lowdb Instance) dành riêng cho quán này
    const db = await getTenantDb(tenantCode);

    if (!db) {
      return res.status(400).json({
        success: false,
        message: `Không thể tạo Database cục bộ cho quán: ${tenantCode}`
      });
    }

    // Gắn DB object vào request để các Controller có thể thao tác
    req.tenantDb = db;
    req.tenantCode = tenantCode;

    // Tự động gọi Seeder nạp dữ liệu mẫu nếu file JSON vừa được tạo mới và chưa có thông tin
    await seedTenantData(db, tenantCode);

    next();
  } catch (error) {
    console.error(`[Middleware Error] Lỗi phân tuyến dữ liệu cho quán:`, error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ',
      error: error.message
    });
  }
};
