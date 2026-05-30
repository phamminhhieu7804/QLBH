import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { initSocketHandler } from './socket/socketHandler.js';
import { tenantMiddleware } from './middleware/tenantMiddleware.js';

// Import các định tuyến Routes
import restaurantRoutes from './routes/restaurantRoutes.js';
import tableRoutes from './routes/tableRoutes.js';
import productRoutes from './routes/productRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';

// Import Controller phục vụ tuyến đường báo cáo Dashboard và thông tin Quán
import { getDashboardReport } from './controllers/orderController.js';
import { getRestaurant } from './controllers/restaurantController.js';

// 2. Khởi tạo Express App và Server HTTP
const app = express();
const server = http.createServer(app);

// 3. Khởi tạo WebSockets Socket.io Server
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Lưu trữ đối tượng io vào trong app Express để sử dụng trong các Controllers
app.set('io', io);

// 4. Áp dụng các Middleware tiêu chuẩn
app.use(cors({
  origin: true, // Tự động phản hồi khớp với origin gửi request (xử lý triệt để CORS Vercel)
  credentials: true
}));
app.use(express.json());

// 5. ÁP DỤNG TENANT ROUTER MIDDLEWARE CHO TẤT CẢ ĐƯỜNG DẪN /api
// Mỗi request tới /api sẽ tự động liên kết tới 1 database độc lập của Quán tương ứng
app.use('/api', tenantMiddleware);

// API lấy cấu hình Quán ăn (tự chèn dữ liệu mẫu nếu đây là tenant mới chưa có cấu hình)
app.get('/api/restaurant', getRestaurant);

// 6. Gắn kết các đầu tuyến API (Mounting Routes)
app.use('/api/restaurant', restaurantRoutes);
app.use('/api/tables', tableRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);

// Tuyến đường API báo cáo thống kê độc lập
app.get('/api/dashboard/report', getDashboardReport);

// 7. Khởi tạo Trình xử lý sự kiện WebSockets
initSocketHandler(io);

// 8. Trang chủ chào đón thiết kế Premium Glassmorphic tuyệt đẹp cho Backend
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>quản lý bán hàng by Sinh Viên Bonnie SaaS - Multi-Database API Engine</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
      <style>
        :root {
          --bg-color: #080b11;
          --panel-bg: rgba(15, 23, 42, 0.75);
          --accent-color: #10b981;
          --accent-glow: rgba(16, 185, 129, 0.45);
          --text-primary: #f3f4f6;
          --text-secondary: #9ca3af;
          --border-color: rgba(255, 255, 255, 0.08);
        }

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        body {
          font-family: 'Outfit', sans-serif;
          background-color: var(--bg-color);
          color: var(--text-primary);
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
          position: relative;
        }

        /* Hiệu ứng nền phát sáng */
        body::before {
          content: '';
          position: absolute;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, rgba(16, 185, 129, 0.18) 0%, transparent 70%);
          top: 10%;
          left: 10%;
          z-index: 0;
        }

        body::after {
          content: '';
          position: absolute;
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, transparent 70%);
          bottom: 10%;
          right: 10%;
          z-index: 0;
        }

        .container {
          position: relative;
          z-index: 10;
          width: 90%;
          max-width: 650px;
          background: var(--panel-bg);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color);
          border-radius: 28px;
          padding: 45px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.4);
          text-align: center;
        }

        .pulse-circle {
          width: 85px;
          height: 85px;
          border-radius: 50%;
          background: rgba(16, 185, 129, 0.1);
          border: 2px solid var(--accent-color);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          position: relative;
          box-shadow: 0 0 25px var(--accent-glow);
          animation: pulse 2.2s infinite;
        }

        .pulse-inner {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background-color: var(--accent-color);
          box-shadow: 0 0 12px var(--accent-color);
        }

        h1 {
          font-size: 2.3rem;
          font-weight: 800;
          letter-spacing: -0.5px;
          background: linear-gradient(135deg, #ffffff 0%, #34d399 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 12px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
          padding: 6px 18px;
          border-radius: 50px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 24px;
          border: 1px solid rgba(16, 185, 129, 0.2);
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: var(--accent-color);
          box-shadow: 0 0 8px var(--accent-color);
          animation: blink 1.2s infinite;
        }

        p.desc {
          font-size: 1.05rem;
          color: var(--text-secondary);
          line-height: 1.6;
          margin-bottom: 35px;
        }

        .grid-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 35px;
        }

        .stat-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border-color);
          border-radius: 18px;
          padding: 18px;
          transition: all 0.3s ease;
        }

        .stat-card:hover {
          background: rgba(255, 255, 255, 0.05);
          border-color: rgba(16, 185, 129, 0.35);
          transform: translateY(-3px);
        }

        .stat-val {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
          margin-bottom: 4px;
        }

        .stat-label {
          font-size: 0.8rem;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .footer {
          font-size: 0.85rem;
          color: #4b5563;
          border-top: 1px solid var(--border-color);
          padding-top: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .footer a {
          color: var(--accent-color);
          text-decoration: none;
          font-weight: 600;
          transition: opacity 0.2s;
        }

        .footer a:hover {
          opacity: 0.8;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.45);
          }
          70% {
            box-shadow: 0 0 0 18px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="pulse-circle">
          <div class="pulse-inner"></div>
        </div>
        <h1>Quản lý bán hàng by Bonnie </h1>
        <div class="status-badge">
          <div class="status-dot"></div>
          <span>MÁY CHỦ DATABASE HOẠT ĐỘNG ONLINE</span>
        </div>
        <p class="desc">
          Lõi máy chủ SaaS hoạt động theo mô hình Phân tách Vật lý Cơ sở dữ liệu động. 
          Mỗi Quán ăn (Tenant) sở hữu riêng một MongoDB hoàn toàn độc lập, bảo mật tối đa và trống dữ liệu 100% khi khởi tạo.
        </p>

        <div class="grid-stats">
          <div class="stat-card">
            <div class="stat-val" style="color: #34d399;">Dynamic</div>
            <div class="stat-label">Database Pool</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #60a5fa;">Isolated</div>
            <div class="stat-label">Tenant DBs</div>
          </div>
          <div class="stat-card">
            <div class="stat-val" style="color: #a7f3d0;">Socket.io</div>
            <div class="stat-label">Sync Status</div>
          </div>
        </div>

        <div class="footer">
          <span>phiên bản 1.0.0 và by Bonnie</span>
          <span>Truy cập nhanh: <a href="/api/tables?tenant=tra-sua-chill&restaurantId=demo" target="_blank">Khám phá API</a></span>
        </div>
      </div>
    </body>
    </html>
  `);
});

// 9. Khởi chạy máy chủ HTTP lắng nghe cổng được thiết lập
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`========================================================================`);
  console.log(` Máy chủ quản lý bán hàng by Sinh Viên Bonnie SaaS Multi-Database Engine đang chạy thành công!`);
  console.log(` Cổng cổng kết nối (PORT) = ${PORT}`);
  console.log(` Đường dẫn sảnh chính = http://localhost:${PORT}`);
  console.log(`========================================================================`);
});
