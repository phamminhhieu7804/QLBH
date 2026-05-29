import express from 'express';
import { verifyPaymentAndReleaseTable } from '../controllers/orderController.js';

const router = express.Router();

// Xác nhận thanh toán thành công (VietQR hoặc Click xác nhận thủ công)
router.post('/verify-vietqr', verifyPaymentAndReleaseTable);

export default router;
