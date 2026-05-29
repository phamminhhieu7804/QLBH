import mongoose from 'mongoose';

// Map lưu trữ các kết nối DB của các quán để tránh mở kết nối mới liên tục (Connection Pool Cache)
const connections = {};
let baseConnection = null;

// Hàm kết nối động lấy Connection riêng của Quán (Tenant)
export const getTenantConnection = (tenantCode) => {
  if (!tenantCode) return null;
  
  // Chuẩn hóa mã Quán thành tên Database viết thường không khoảng trắng
  const dbName = `order-quản lý bán hàng by Sinh Viên Bonnie-${tenantCode.toLowerCase().trim()}`;
  
  // Nếu đã có sẵn kết nối hoạt động trong Pool Cache, trả về ngay
  if (connections[dbName]) {
    return connections[dbName];
  }
  
  // 1. Khởi tạo kết nối cơ sở (Base Connection) nếu chưa có
  if (!baseConnection) {
    const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_PREFIX || 'mongodb://127.0.0.1:27017/admin';
    console.log(`[Multi-Tenant] Đang mở kết nối cơ sở tới MongoDB Atlas/Server...`);
    baseConnection = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 8000
    });
    
    baseConnection.on('connected', () => {
      console.log(`[Multi-Tenant] Đã kết nối cơ sở tới MongoDB thành công!`);
    });
    
    baseConnection.on('error', (err) => {
      console.error(`[Multi-Tenant] Lỗi kết nối cơ sở tới MongoDB: ${err.message}`);
    });
  }
  
  // 2. Sử dụng useDb của Mongoose để tạo kết nối riêng ảo trên cùng 1 TCP pool
  // Thiết lập useCache: true để Mongoose tự quản lý cache connection, tránh overload socket
  console.log(`[Multi-Tenant] Đang phân tuyến cơ sở dữ liệu động: ${dbName}...`);
  const connection = baseConnection.useDb(dbName, { useCache: true });
  
  // Lưu vào Pool Cache để tái sử dụng
  connections[dbName] = connection;
  return connection;
};

// Dummy log kết nối khi khởi động hệ thống
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGODB_URI_PREFIX || 'mongodb://127.0.0.1:27017/admin';
  // Giấu mật khẩu trong log để bảo mật
  const maskedUri = uri.replace(/:([^@]+)@/, ':****@');
  
  console.log(`=======================================================`);
  console.log(`[Multi-Tenant] Connection Pool Manager khởi động ONLINE!`);
  console.log(`[Multi-Tenant] Địa chỉ MongoDB: ${maskedUri}`);
  
  if (!baseConnection) {
    baseConnection = mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 8000
    });
    
    baseConnection.on('connected', () => {
      console.log(`[Multi-Tenant] Kết nối cơ sở MongoDB Atlas thành công!`);
    });
    
    baseConnection.on('error', (err) => {
      console.error(`[Multi-Tenant] Lỗi kết nối cơ sở MongoDB Atlas: ${err.message}`);
    });
  }
  console.log(`=======================================================`);
};

// ---------------------------------------------------------------------------
// ĐỊNH NGHĨA TOÀN BỘ SCHEMAS ĐỂ ĐĂNG KÝ ĐỘNG (DYNAMIC REGISTER)
// ---------------------------------------------------------------------------

// 1. Restaurant Schema (Lược đồ Quán ăn)
export const RestaurantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên quán ăn không được để trống'],
      trim: true
    },
    ownerName: {
      type: String,
      trim: true
    },
    phone: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    config: {
      initialInvestment: {
        type: Number,
        default: null
      },
      targetProfitMargin: {
        type: Number,
        default: null
      }
    },
    bankId: {
      type: String,
      default: ''
    },
    customBank: {
      type: String,
      default: ''
    },
    bankAccountNo: {
      type: String,
      default: ''
    },
    bankAccountName: {
      type: String,
      default: ''
    },
    bankFullName: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

// 2. Table Schema (Lược đồ Bàn ăn)
export const TableSchema = new mongoose.Schema(
  {
    tableName: {
      type: String,
      required: [true, 'Tên bàn ăn không được để trống'],
      trim: true
    },
    status: {
      type: String,
      enum: ['trong', 'active'],
      default: 'trong'
    },
    qrCodeUrl: {
      type: String,
      trim: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Mỗi bàn ăn bắt buộc phải liên kết với một Quán ăn']
    }
  },
  { timestamps: true }
);
TableSchema.index({ tableName: 1, restaurantId: 1 }, { unique: true });

// 3. Product Schema (Lược đồ Món ăn)
export const ProductSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Tên món ăn không được để trống'],
      trim: true
    },
    image: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      required: [true, 'Giá bán món ăn không được để trống'],
      min: [0, 'Giá bán không được nhỏ hơn 0']
    },
    costPrice: {
      type: Number,
      required: [true, 'Giá vốn món ăn không được để trống'],
      min: [0, 'Giá vốn không được nhỏ hơn 0']
    },
    category: {
      type: String,
      required: [true, 'Danh mục món ăn không được để trống'],
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Mỗi món ăn phải thuộc về một Quán ăn sở hữu']
    }
  },
  { timestamps: true }
);

// 4. Order Item Schema (Lược đồ chi tiết dòng món)
const OrderItemSchema = new mongoose.Schema({
  orderItemId: {
    type: String,
    default: () => new mongoose.Types.ObjectId().toString()
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Mỗi item bắt buộc phải chứa liên kết tới món ăn gốc (Product)']
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  }
});

// 5. Order Schema (Lược đồ Hóa đơn gọi món)
export const OrderSchema = new mongoose.Schema(
  {
    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Table',
      required: [true, 'Hóa đơn bắt buộc phải có mã số Bàn (tableId)']
    },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurant',
      required: [true, 'Hóa đơn bắt buộc phải thuộc về một Quán ăn (restaurantId)']
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    discount: {
      type: Number,
      default: 0
    },
    tax: {
      type: Number,
      default: 0
    },
    finalAmount: {
      type: Number,
      default: 0
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending'
    },
    items: [OrderItemSchema]
  },
  { timestamps: true }
);
