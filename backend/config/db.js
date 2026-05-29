import mongoose from 'mongoose';

// Map lưu trữ các kết nối DB của các quán để tránh mở kết nối mới liên tục (Connection Pool Cache)
const connections = {};

// Hàm kết nối động lấy Connection riêng của Quán (Tenant)
export const getTenantConnection = (tenantCode) => {
  if (!tenantCode) return null;
  
  // Chuẩn hóa mã Quán thành tên Database viết thường không khoảng trắng
  const dbName = `order-quản lý bán hàng by Sinh Viên Bonnie-${tenantCode.toLowerCase().trim()}`;
  
  // Nếu đã có sẵn kết nối hoạt động trong Pool Cache, trả về ngay
  if (connections[dbName]) {
    return connections[dbName];
  }
  
  // Khởi tạo kết nối mới độc lập vật lý tới MongoDB của quán này
  const uri = process.env.MONGODB_URI_PREFIX || 'mongodb://127.0.0.1:27017/';
  const connectionString = `${uri}${dbName}`;
  
  console.log(`[Multi-Tenant] Đang khởi tạo kết nối mới tới Database: ${dbName}...`);
  
  const connection = mongoose.createConnection(connectionString, {
    serverSelectionTimeoutMS: 5000 // Chờ tối đa 5 giây
  });
  
  connection.on('connected', () => {
    console.log(`[Multi-Tenant] Đã kết nối thành công tới Database riêng: ${dbName}`);
  });
  
  connection.on('error', (err) => {
    console.error(`[Multi-Tenant] Lỗi kết nối Database ${dbName}: ${err.message}`);
  });
  
  // Lưu vào Pool Cache để tái sử dụng
  connections[dbName] = connection;
  return connection;
};

// Dummy log kết nối khi khởi động hệ thống
export const connectDB = async () => {
  console.log(`=======================================================`);
  console.log(`[Multi-Tenant] Connection Pool Manager khởi động ONLINE!`);
  console.log(`[Multi-Tenant] Hệ thống kết nối động Multi-Database sẵn sàng.`);
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
