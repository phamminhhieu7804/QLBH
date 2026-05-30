import { getTenantConnection, getRestaurantModel, getTableModel, getProductModel } from '../config/db.js';
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

    // 2. Lấy đối tượng kết nối động dành riêng cho quán này (Sử dụng await để bắt lỗi kết nối hoặc timeout)
    const dbConnection = await getTenantConnection(tenantCode);

    if (!dbConnection) {
      return res.status(400).json({
        success: false,
        message: `Không thể kết nối tới Cơ sở dữ liệu của quán: ${tenantCode}`
      });
    }

    // 3. Khởi tạo hoặc tái sử dụng Models động thông qua Helper an toàn chống OverwriteModelError
    const Restaurant = getRestaurantModel(dbConnection);
    const Table = getTableModel(dbConnection);
    const Product = getProductModel(dbConnection);

    // 4. Tìm hoặc tự động tạo cấu hình Quán ăn (Restaurant) trong MongoDB
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      // Tự sinh tên đẹp cho Quán từ slug
      let readableName = tenantCode
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      if (tenantCode === 'pho-gia-truyen') readableName = 'Phở Gia Truyền';
      if (tenantCode === 'tra-sua-chill') readableName = 'Trà Sữa Chill';

      restaurant = new Restaurant({
        name: readableName,
        ownerName: 'Chủ Quán',
        phone: '',
        address: '',
        config: {
          initialInvestment: null,
          targetProfitMargin: null
        }
      });
      await restaurant.save();
    }

    // 5. Tự động seed bàn ăn và thực đơn mẫu nếu quán chưa có dữ liệu
    await seedTenantData(dbConnection, tenantCode, restaurant._id);

    // 6. Đính kèm Connection động, mã Quán và thông tin Restaurant vào đối tượng Request
    req.tenantDb = dbConnection;
    req.tenantCode = tenantCode;
    req.restaurantId = restaurant._id.toString();
    req.restaurant = restaurant;

    next(); // Cho phép request đi tiếp tới Controller
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi phân tuyến cơ sở dữ liệu động',
      error: error.message
    });
  }
};
