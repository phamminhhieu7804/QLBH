import express from 'express';
import { getProducts, createProduct, updateProduct, deleteProduct } from '../controllers/productController.js';

const router = express.Router();

// Lấy danh sách thực đơn món ăn của quán
router.get('/', getProducts);

// Thêm món ăn mới vào thực đơn
router.post('/', createProduct);

// Chỉnh sửa thông tin món ăn
router.put('/:id', updateProduct);

// Xóa món ăn khỏi thực đơn
router.delete('/:id', deleteProduct);

export default router;
