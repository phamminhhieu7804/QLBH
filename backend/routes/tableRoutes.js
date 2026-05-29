import express from 'express';
import { getAllTables, createTable, deleteTable } from '../controllers/tableController.js';

const router = express.Router();

// Lấy danh sách sơ đồ bàn kèm trạng thái động
router.get('/', getAllTables);

// Tạo bàn ăn mới (tự động sinh mã QR của bàn)
router.post('/', createTable);

// Xóa bàn ăn khỏi danh sách
router.delete('/:id', deleteTable);

export default router;
