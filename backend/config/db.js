import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSONFilePreset } from 'lowdb/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, '../data');

// Đảm bảo thư mục lưu trữ cục bộ luôn tồn tại
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Bộ đệm (Cache) chứa các đối tượng DB để không phải đọc file nhiều lần
const dbInstances = {};

// Hàm lấy hoặc khởi tạo File DB cho một Quán ăn
export const getTenantDb = async (tenantCode) => {
    if (!tenantCode || tenantCode === 'default') {
        tenantCode = 'default_tenant'; // Tránh crash
    }

    // Nếu đã nạp file này vào RAM rồi thì trả về luôn cho nhanh
    if (dbInstances[tenantCode]) {
        return dbInstances[tenantCode];
    }

    const filePath = path.join(dataDir, `${tenantCode}.json`);
    
    // Cấu trúc xương sống (Schema) của một Quán ăn
    const defaultData = { 
        restaurant: null,
        tables: [], 
        products: [], 
        orders: [] 
    };

    // Khởi tạo Lowdb với cấu trúc mặc định
    const db = await JSONFilePreset(filePath, defaultData);
    
    dbInstances[tenantCode] = db;
    console.log(`[Lowdb Local] Đã nạp Database siêu nhẹ cho quán: ${tenantCode}`);
    
    return db;
};
