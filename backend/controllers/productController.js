import { ProductSchema } from '../config/db.js';

// [GET] /api/products
// Lấy danh sách thực đơn của quán từ DB riêng
export const getProducts = async (req, res) => {
  try {
    const { restaurantId } = req.query;

    if (!restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã restaurantId' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);
    const products = await Product.find({ restaurantId }).sort({ category: 1, name: 1 });

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
    const { name, image, price, costPrice, category, restaurantId } = req.body;

    if (!name || price === undefined || costPrice === undefined || !category || !restaurantId) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ các thông tin bắt buộc' });
    }

    // Khởi tạo hoặc tái sử dụng model động
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);

    const product = new Product({
      name,
      image: image || '',
      price: Number(price),
      costPrice: Number(costPrice),
      category,
      restaurantId,
      isAvailable: true
    });

    await product.save();

    return res.status(201).json({
      success: true,
      message: 'Thêm món ăn mới thành công!',
      data: product
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

    // Khởi tạo hoặc tái sử dụng model động
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn cần chỉnh sửa' });
    }

    if (name !== undefined) product.name = name;
    if (image !== undefined) product.image = image;
    if (price !== undefined) product.price = Number(price);
    if (costPrice !== undefined) product.costPrice = Number(costPrice);
    if (category !== undefined) product.category = category;
    if (isAvailable !== undefined) product.isAvailable = isAvailable;

    await product.save();

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

    // Khởi tạo hoặc tái sử dụng model động
    const Product = req.tenantDb.models.Product || req.tenantDb.model('Product', ProductSchema);

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy món ăn cần xóa' });
    }

    return res.status(200).json({
      success: true,
      message: `Đã xóa thành công món ăn: ${product.name}`
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Lỗi xóa món ăn', error: error.message });
  }
};
