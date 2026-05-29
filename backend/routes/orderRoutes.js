import express from 'express';
import { 
  getActiveOrderByTableId, 
  addItemToOrder, 
  updateOrderItemStatus, 
  customerSubmitQROrder 
} from '../controllers/orderController.js';

const router = express.Router();

// Khách hàng lấy thông tin giỏ hàng hiện tại của bàn
router.get('/table/:tableId', getActiveOrderByTableId);

// Khách / Thu ngân thêm món vào hóa đơn (gộp trùng món tự động)
router.post('/add-item', addItemToOrder);

// Cập nhật trạng thái chế biến của Bếp dựa trên orderItemId
router.put('/update-item-status', updateOrderItemStatus);

// Khách hàng nhấn "Gửi yêu cầu gọi món" từ màn hình QR
router.post('/customer-submit', customerSubmitQROrder);

export default router;
