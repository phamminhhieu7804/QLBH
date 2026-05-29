import express from 'express';
import { 
  getActiveOrderByTableId, 
  addItemToOrder, 
  updateOrderItemStatus, 
  customerSubmitQROrder,
  updateOrderItemQuantity,
  removeOrderItem,
  getPaidOrdersHistory
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

// Cập nhật số lượng của món ăn trong đơn hàng
router.put('/update-item-qty', updateOrderItemQuantity);

// Xóa món ăn khỏi hóa đơn
router.post('/remove-item', removeOrderItem); // Dùng POST để chuyển thông tin an toàn qua proxy

// Lấy lịch sử hóa đơn đã thanh toán phục vụ báo cáo doanh thu
router.get('/history', getPaidOrdersHistory);

export default router;
