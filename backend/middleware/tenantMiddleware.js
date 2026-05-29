import { getTenantConnection } from '../config/db.js';

// Middleware phân tuyến cơ sở dữ liệu động dành cho từng Quán (Multi-Tenant Routing)
export const tenantMiddleware = (req, res, next) => {
  try {
    // 1. Trích xuất mã Quán (Tenant Code) từ Headers, Query parameters hoặc Body
    const tenantHeader = req.headers['x-tenant'];
    const tenantQuery = req.query.tenant;
    const tenantBody = req.body.tenant;
    
    // Ưu tiên: Header -> Query -> Body. Nếu không có thì dùng 'default' để tránh crash
    const tenantCode = tenantHeader || tenantQuery || tenantBody || 'default';

    // 2. Lấy đối tượng kết nối động dành riêng cho quán này
    const dbConnection = getTenantConnection(tenantCode);

    if (!dbConnection) {
      return res.status(400).json({
        success: false,
        message: `Không thể kết nối tới Cơ sở dữ liệu của quán: ${tenantCode}`
      });
    }

    // 3. Đính kèm Connection động và mã Quán vào đối tượng Request
    req.tenantDb = dbConnection;
    req.tenantCode = tenantCode;

    next(); // Cho phép request đi tiếp tới Controller
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi phân tuyến cơ sở dữ liệu động',
      error: error.message
    });
  }
};
