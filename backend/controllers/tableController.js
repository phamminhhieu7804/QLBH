import { v4 as uuidv4 } from 'uuid';

// [GET] /api/tables
// Lấy danh sách tất cả các bàn kèm trạng thái động
export const getAllTables = async (req, res) => {
  try {
    const db = req.tenantDb;

    // Lấy danh sách bàn từ mảng cục bộ và sắp xếp theo tên
    const tables = [...db.data.tables].sort((a, b) => a.tableName.localeCompare(b.tableName));

    return res.status(200).json({
      success: true,
      data: tables
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy danh sách bàn ăn', error: error.message });
  }
};

// [POST] /api/tables
// Thêm bàn ăn mới và tự động sinh mã URL QR Code của riêng bàn đó
export const createTable = async (req, res) => {
  try {
    const { tableName } = req.body;

    if (!tableName) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền tên bàn' });
    }

    const db = req.tenantDb;

    // Chống trùng lặp tên bàn trong mảng
    const isExisted = db.data.tables.some(
      t => t.tableName.toLowerCase().trim() === tableName.toLowerCase().trim()
    );

    if (isExisted) {
      return res.status(400).json({ success: false, message: 'Tên bàn ăn này đã tồn tại trong quán!' });
    }

    const tableId = uuidv4();
    
    // Sinh mã QR Code URL hướng trực tiếp tới trang order của bàn ăn này
    const qrCodeUrl = `https://order-quản lý bán hàng by Sinh Viên Bonnie.com/order?tenant=${req.tenantCode}&table=${tableId}`;

    const newTable = {
      _id: tableId,
      tableName: tableName.trim(),
      status: 'trong',
      qrCodeUrl: qrCodeUrl
    };

    db.data.tables.push(newTable);
    
    // Ghi lưu dữ liệu vào File siêu tốc
    await db.write();

    return res.status(201).json({
      success: true,
      message: 'Khởi tạo bàn ăn và QR Code thành công!',
      data: newTable
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tạo bàn', error: error.message });
  }
};

// [DELETE] /api/tables/:id
// Xóa bàn ăn khỏi danh sách
export const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.tenantDb;

    // Tìm index của bàn trong mảng
    const tableIndex = db.data.tables.findIndex(t => t._id === id);
    if (tableIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy bàn ăn cần xóa' });
    }

    // Cắt phần tử khỏi mảng
    const deletedTable = db.data.tables.splice(tableIndex, 1)[0];
    
    await db.write();

    return res.status(200).json({
      success: true,
      message: `Đã xóa thành công bàn ăn: ${deletedTable.tableName}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa bàn ăn', error: error.message });
  }
};
