import express from 'express';
import { getRestaurantInfoByTableId, updateFinancialConfig } from '../controllers/restaurantController.js';

const router = express.Router();

// Tuyến đường API lấy thông tin quán và thực đơn bằng mã QR Bàn ăn
router.get('/info', getRestaurantInfoByTableId);

// Tuyến đường API cập nhật thông số tài chính cho quán
router.post('/config', updateFinancialConfig);

export default router;
