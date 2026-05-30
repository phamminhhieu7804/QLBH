import { v4 as uuidv4 } from 'uuid';

// 1. Thực đơn mẫu truyền thống (Quán phở truyền thống - mặc định)
export const TRADITIONAL_MENU = [
  {
    name: 'Phở Bò Tái Lăn Hà Nội',
    price: 65000,
    costPrice: 28000,
    category: 'Món chính',
    image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Phở bò tái lăn đậm vị truyền thống, thịt bò xào xèo thơm phức tỏi gừng và nhiều hành lá.'
  },
  {
    name: 'Cơm Tấm Sườn Bì Chả',
    price: 59000,
    costPrice: 25000,
    category: 'Món chính',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Cơm tấm dẻo thơm ăn kèm sườn heo nướng mật ong vàng ruộm, bì dai giòn và chả trứng chưng.'
  },
  {
    name: 'Bún Chả Nem Cua Bể',
    price: 75000,
    costPrice: 32000,
    category: 'Món chính',
    image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Bún chả Hà Nội nướng than hoa thơm lừng kết hợp nem cua bể giòn rụm nhiều thịt cua.'
  },
  {
    name: 'Cà Phê Muối Huế',
    price: 35000,
    costPrice: 12000,
    category: 'Nước uống',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Cà phê phin đậm đà hòa quyện cùng lớp kem muối béo ngậy mằn mặn đặc trưng.'
  },
  {
    name: 'Trà Đào Hồng Đài Các',
    price: 42000,
    costPrice: 15000,
    category: 'Nước uống',
    image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Trà đào thanh mát nấu cùng đào miếng giòn ngọt, sả thơm giải nhiệt cực tốt.'
  },
  {
    name: 'Bánh Mì Nướng Muối Ớt',
    price: 30000,
    costPrice: 12000,
    category: 'Ăn vặt',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Bánh mì nướng giòn quét bơ mật ong, muối ớt tôm, mỡ hành phi, chà bông ruốc béo ngậy.'
  },
  {
    name: 'Chè Khúc Bạch Trân Châu',
    price: 45000,
    costPrice: 18000,
    category: 'Tráng miệng',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Thạch khúc bạch phô mai dẻo béo, nước đường phèn nhãn nhục ngọt thanh kèm hạnh nhân rang vàng.'
  }
];

// 2. Thực đơn mẫu Trà sữa & Ăn vặt (Tiệm trà sữa)
export const MILKTEA_MENU = [
  {
    name: 'Trà Sữa Trân Châu Hoàng Kim',
    price: 45000,
    costPrice: 18000,
    category: 'Nước uống',
    image: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Trà sữa đen truyền thống béo ngậy, đi kèm lớp trân châu hoàng kim dai giòn sần sật ngọt lịm.'
  },
  {
    name: 'Trà Sữa Matcha Thạch Phô Mai',
    price: 49000,
    costPrice: 20000,
    category: 'Nước uống',
    image: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Matcha Uji Nhật Bản thơm đậm đà hòa cùng sữa tươi béo ngậy và thạch phô mai handmade siêu béo.'
  },
  {
    name: 'Trà Đào Hồng Đài Các',
    price: 42000,
    costPrice: 15000,
    category: 'Nước uống',
    image: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Trà trà đào thanh ngọt dịu nấu cùng đào miếng giòn ngọt, sả chanh thơm giải nhiệt cực tốt.'
  },
  {
    name: 'Khoai Tây Lắc Trứng Muối',
    price: 38000,
    costPrice: 14000,
    category: 'Ăn vặt',
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Khoai tây cắt lát chiên giòn rụm bọc lớp bột trứng muối kim sa bùi béo mằn mặn.'
  },
  {
    name: 'Bánh Tráng Cuộn Bơ Sốt Trứng',
    price: 28000,
    costPrice: 10000,
    category: 'Ăn vặt',
    image: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Bánh tráng Tây Ninh cuộn ruốc tép, trứng cút luộc, hành phi giòn và rưới sốt bơ trứng vàng béo ngậy.'
  },
  {
    name: 'Nem Chua Rán Giòn Hà Nội',
    price: 35000,
    costPrice: 15000,
    category: 'Ăn vặt',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Nem chua rán bọc bột chiên xù sần sật nóng hổi, chấm kèm tương ớt cay nồng cực sướng.'
  },
  {
    name: 'Chè Khúc Bạch Phô Mai Hạnh Nhân',
    price: 45000,
    costPrice: 18000,
    category: 'Tráng miệng',
    image: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    description: 'Thạch khúc bạch kem tươi béo ngậy, nước vải thiều ngọt mát kèm hạnh nhân rang thơm lừng.'
  }
];

// Hàm tự động seed dữ liệu cho cơ sở dữ liệu File JSON cục bộ
export const seedTenantData = async (db, tenantCode) => {
  try {
    let changed = false;

    // 1. Seed 12 bàn mặc định nếu chưa có bàn nào
    if (db.data.tables.length === 0) {
      console.log(`[Lowdb Seeder] Khởi tạo 12 bàn mặc định cho quán: ${tenantCode}`);
      
      const tablesList = Array.from({ length: 12 }, (_, i) => {
        const id = uuidv4();
        return {
          _id: id,
          tableName: `Bàn ${String(i + 1).padStart(2, '0')}`,
          status: 'trong',
          qrCodeUrl: `https://order-quản lý bán hàng by Sinh Viên Bonnie.com/order?tenant=${tenantCode}&table=${id}`
        };
      });

      db.data.tables.push(...tablesList);
      changed = true;
    }

    // 2. Seed thực đơn mẫu
    if (db.data.products.length === 0) {
      console.log(`[Lowdb Seeder] Khởi tạo thực đơn mẫu cho quán: ${tenantCode}`);
      const isMilktea = tenantCode.toLowerCase().includes('tra') || tenantCode.toLowerCase().includes('chill');
      const menuSource = isMilktea ? MILKTEA_MENU : TRADITIONAL_MENU;

      const productsToInsert = menuSource.map(item => ({
        _id: uuidv4(),
        ...item,
        isAvailable: true
      }));

      db.data.products.push(...productsToInsert);
      changed = true;
    }

    if (changed) {
      await db.write();
    }
  } catch (error) {
    console.error(`[Lowdb Seeder] Lỗi khởi tạo dữ liệu mặc định cho quán ${tenantCode}:`, error.message);
  }
};
