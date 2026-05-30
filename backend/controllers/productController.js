import { v4 as uuidv4 } from 'uuid';

// [GET] /api/products
// Lấy danh sách thực đơn của quán từ DB riêng
export const getProducts = async (req, res) => {
  try {
    const db = req.tenantDb;
    
    // Lọc mảng và sắp xếp theo danh mục, tên
    const products = [...db.data.products].sort((a, b) => {
      if (a.category < b.category) return -1;
      if (a.category > b.category) return 1;
      return a.name.localeCompare(b.name);
    });

    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi lấy thực đơn', error: error.message });
  }
};

// [POST] /api/products
// Thêm món ăn mới vào thực đơn của quán
export const createProduct = async (req, res) => {
  try {
    const { name, image, price, costPrice, category } = req.body;

    if (!name || price === undefined || costPrice === undefined || !category) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    const db = req.tenantDb;

    const newProduct = {
      _id: uuidv4(),
      name,
      image: image || '',
      price: Number(price),
      costPrice: Number(costPrice),
      category,
      isAvailable: true
    };

    db.data.products.push(newProduct);
    await db.write();

    return res.status(201).json({
      success: true,
      message: 'Thêm món ăn mới thành công!',
      data: newProduct
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi khi tạo món ăn', error: error.message });
  }
};

// [PUT] /api/products/:id
// Sửa đổi thông tin món ăn trong thực đơn
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, price, costPrice, category, isAvailable } = req.body;

    const db = req.tenantDb;
    const product = db.data.products.find(p => p._id === id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn cần chỉnh sửa' });
    }

    if (name !== undefined) product.name = name;
    if (image !== undefined) product.image = image;
    if (price !== undefined) product.price = Number(price);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (category !== undefined) product.category = category;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await db.write();

    return res.status(200).json({
      success: true,
      message: 'Cập nhật món ăn thành công!',
      data: product
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi chỉnh sửa món ăn', error: error.message });
  }
};

// [DELETE] /api/products/:id
// Xóa món ăn khỏi thực đơn của quán
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.tenantDb;

    const productIndex = db.data.products.findIndex(p => p._id === id);
    if (productIndex === -1) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn cần xóa' });
    }

    const deletedProduct = db.data.products.splice(productIndex, 1)[0];
    await db.write();

    return res.status(200).json({
      success: true,
      message: `Đã xóa thành công món ăn: ${deletedProduct.name}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa món ăn', error: error.message });
  }
};
