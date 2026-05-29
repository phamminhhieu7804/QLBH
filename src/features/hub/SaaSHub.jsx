import React, { useContext, useState, useEffect } from 'react';
import { 
  BarChart3, 
  LayoutGrid, 
  LogOut, 
  UtensilsCrossed, 
  Settings, 
  ShoppingBag, 
  ChefHat, 
  Clock, 
  QrCode, 
  Calendar, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import { TenantContext } from '../../context/TenantContext';
import { CartContext, logActivity } from '../../context/CartContext';
import styles from './SaaSHub.module.css';

// Màn hình Cổng điều hành SaaS (SaaS App Selector Hub)
export const SaaSHub = ({ onSelectApp }) => {
  const { tenant, tenantName, user, role, logout, registeredUsers } = useContext(TenantContext);
  const { tables, tableCarts } = useContext(CartContext);

  // States cho modal chấm công nhanh
  const [isAttendanceOpen, setIsAttendanceOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Nhận diện hành động chấm công tự động qua URL nếu có ?action=clockin
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'clockin' && tenant) {
      setIsAttendanceOpen(true);
      // Dọn URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [tenant]);

  // Cập nhật đồng hồ LED động
  useEffect(() => {
    let timer;
    if (isAttendanceOpen) {
      timer = setInterval(() => setCurrentTime(new Date()), 1000);
    }
    return () => clearInterval(timer);
  }, [isAttendanceOpen]);

  // Lấy tên đầy đủ của người dùng hiện tại
  const currentUserObj = (registeredUsers || []).find((u) => u.tenant === tenant && u.username === user);
  const currentFullName = currentUserObj?.fullName || user;

  // Lấy lịch sử chấm công của quán hiện tại
  const attendanceKey = `restaurant_attendance_${tenant}`;
  const getAttendanceLogs = () => {
    const saved = localStorage.getItem(attendanceKey);
    return saved ? JSON.parse(saved) : [];
  };

  // Lấy bản ghi chấm công đang hoạt động (Đang trong ca làm việc, chưa clock-out)
  const getActiveAttendance = () => {
    const logs = getAttendanceLogs();
    const todayStr = new Date().toLocaleDateString('vi-VN');
    return logs.find(log => log.username === user && log.date === todayStr && !log.clockOut);
  };

  const activeRecord = getActiveAttendance();

  // Bắt đầu ca làm việc (Clock In)
  const handleClockIn = () => {
    const logs = getAttendanceLogs();
    const todayStr = new Date().toLocaleDateString('vi-VN');
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Cần kiểm tra xem có ca đang mở chưa
    if (activeRecord) {
      alert('Bạn đang có một ca làm việc hoạt động! Vui lòng Clock Out ca cũ trước.');
      return;
    }

    const newRecord = {
      id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      username: user,
      fullName: currentFullName,
      role: role === 'admin' ? 'Chủ quán' : 'Nhân viên',
      date: todayStr,
      clockIn: timeStr,
      clockOut: null,
      hoursWorked: 0
    };

    const updated = [newRecord, ...logs];
    localStorage.setItem(attendanceKey, JSON.stringify(updated));
    
    // Ghi nhật ký hoạt động
    logActivity(tenant, 'Chấm công', `Bắt đầu ca làm lúc ${timeStr}`);
    alert('🎉 Chấm công vào ca (Clock In) thành công!');
  };

  // Kết thúc ca làm việc (Clock Out)
  const handleClockOut = () => {
    if (!activeRecord) {
      alert('Không tìm thấy ca làm việc hoạt động của bạn hôm nay!');
      return;
    }

    const logs = getAttendanceLogs();
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // Tính toán số giờ
    const parseTimeToDecimal = (tStr) => {
      const [h, m, s] = tStr.split(':').map(Number);
      return h + m / 60 + s / 3600;
    };

    const startDecimal = parseTimeToDecimal(activeRecord.clockIn);
    const endDecimal = parseTimeToDecimal(timeStr);
    let diff = endDecimal - startDecimal;
    if (diff < 0) diff += 24; // Qua đêm
    const hours = Math.round(diff * 100) / 100;

    const updated = logs.map(log => {
      if (log.id === activeRecord.id) {
        return {
          ...log,
          clockOut: timeStr,
          hoursWorked: hours
        };
      }
      return log;
    });

    localStorage.setItem(attendanceKey, JSON.stringify(updated));
    
    // Ghi nhật ký hoạt động
    logActivity(tenant, 'Chấm công', `Kết thúc ca làm lúc ${timeStr} (Tổng thời gian: ${hours} giờ)`);
    alert(`👋 Chấm công hết ca (Clock Out) thành công!\nTổng thời gian làm việc ca này: ${hours} giờ.`);
  };

  // Chỉ Admin mới thấy card Quản trị
  const isAdmin = role === 'admin';

  // Đếm số món đang chờ bếp làm (dùng cho badge trên card Bếp)
  const totalPendingItems = tables.reduce((acc, table) => {
    const cart = tableCarts[table.id] || [];
    return acc + cart.filter((item) => !item.served).length;
  }, 0);

  // Lọc lịch sử chấm công của nhân viên hôm nay
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const myTodayLogs = getAttendanceLogs().filter(log => log.username === user && log.date === todayStr);

  // Sinh liên kết QR chấm công nhanh cho quán
  const attendanceQRUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `${window.location.origin}${window.location.pathname}?action=clockin&tenant=${tenant}`
  )}`;

  return (
    <div className={styles.hubPage}>
      {/* Background Decor */}
      <div className={styles.bgDecorGlow1} />
      <div className={styles.bgDecorGlow2} />

      {/* Header của Hub */}
      <header className={`${styles.header} glass-panel`}>
        <div className={styles.headerLeft}>
          <UtensilsCrossed size={20} className={styles.logoIcon} />
          <h2>Antigravity Hub</h2>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.userInfo}>
            <span className={styles.tenantLabel}>{tenantName}</span>
            <span className={styles.userLabel}>({user})</span>
          </div>
          <button 
            className={styles.logoutBtn} 
            onClick={() => {
              logActivity(tenant, 'Đăng xuất', 'Đăng xuất khỏi hệ thống');
              logout();
            }} 
            title="Đăng xuất quán"
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </header>

      {/* Vùng nội dung chính */}
      <main className={styles.main}>
        <div className={styles.welcomeArea}>
          <h1>Xin chào, {currentFullName}! 👋</h1>
          <p>Chào mừng bạn đến với trung tâm điều hành của <strong>{tenantName}</strong>.</p>
          <p className={styles.subWelcome}>Vui lòng lựa chọn ứng dụng bạn muốn truy cập để bắt đầu làm việc:</p>
        </div>

        {/* Lưới các ứng dụng con */}
        <div className={`${styles.appsGrid} ${!isAdmin ? styles.appsGridCashier : ''}`}>

          {/* Card 1: Trang Quản trị – chỉ Admin */}
          {isAdmin && (
            <div
              className={`${styles.appCard} glass-panel`}
              onClick={() => onSelectApp('admin')}
            >
              <div className={`${styles.iconWrapper} ${styles.iconBgBlue}`}>
                <BarChart3 size={32} />
              </div>
              <h3>Trang Quản trị (Admin)</h3>
              <p>Phân tích chỉ số doanh thu hôm nay, vẽ biểu đồ theo khung giờ, quản lý danh sách thực đơn, điều chỉnh giá bán và giá vốn.</p>
              <div className={styles.cardFooter}>
                <span>Truy cập hệ thống quản lý</span>
                <Settings size={14} className={styles.footerIcon} />
              </div>
              <div className={styles.cardCornerGlow} />
            </div>
          )}

          {/* Card 2: Màn hình Bán hàng POS */}
          <div
            className={`${styles.appCard} glass-panel`}
            onClick={() => onSelectApp('pos')}
          >
            <div className={`${styles.iconWrapper} ${styles.iconBgTeal}`}>
              <LayoutGrid size={32} />
            </div>
            <h3>Màn hình Bán hàng (POS)</h3>
            <p>Thao tác order gọi món nhanh chóng cho nhân viên bồi bàn hoặc thu ngân, cập nhật giỏ hàng và quét thanh toán mã QR VietQR bảo mật.</p>
            <div className={styles.cardFooter}>
              <span>Mở màn hình bán hàng</span>
              <ShoppingBag size={14} className={styles.footerIcon} />
            </div>
            <div className={styles.cardCornerGlow} />
          </div>

          {/* Card 3: Bếp – chỉ nhân viên & chủ quán */}
          <div
            className={`${styles.appCard} glass-panel ${styles.appCardKitchen}`}
            onClick={() => onSelectApp('kitchen')}
          >
            <div className={`${styles.iconWrapper} ${styles.iconBgOrange}`}>
              <ChefHat size={32} />
            </div>
            <div className={styles.kitchenTitleRow}>
              <h3>Màn hình Bếp (KDS)</h3>
              {totalPendingItems > 0 && (
                <span className={styles.kitchenBadge}>{totalPendingItems} món</span>
              )}
            </div>
            <p>Xem danh sách món ăn đang cần làm theo từng bàn. Bếp tick vào từng món khi hoàn thành để cập nhật trạng thái phục vụ theo thời gian thực.</p>
            <div className={styles.cardFooter}>
              <span>Mở màn hình bếp</span>
              <ChefHat size={14} className={styles.footerIcon} />
            </div>
            <div className={`${styles.cardCornerGlow} ${styles.cardCornerGlowOrange}`} />
          </div>

          {/* Card 4: Chấm công – chỉ hiển thị cho nhân viên hoặc admin (không hiển thị cho khách) */}
          {(role === 'admin' || role === 'cashier') && (
            <div
              className={`${styles.appCard} glass-panel ${styles.appCardAttendance}`}
              onClick={() => setIsAttendanceOpen(true)}
            >
              <div className={`${styles.iconWrapper} ${styles.iconBgPurple}`}>
                <Clock size={32} />
              </div>
              <h3>Chấm công Nhân viên</h3>
              <p>Quét mã QR chấm công bằng điện thoại tại cửa hàng hoặc click trực tiếp vào đây để tiến hành Clock In / Clock Out nhanh trong ngày.</p>
              <div className={styles.cardFooter}>
                <span>Chấm công nhanh ca làm</span>
                <Clock size={14} className={styles.footerIcon} />
              </div>
              <div className={`${styles.cardCornerGlow} ${styles.cardCornerGlowPurple}`} />
            </div>
          )}

        </div>
      </main>

      {/* Modal Chấm Công Nhanh */}
      {isAttendanceOpen && (
        <div className={styles.attendanceModalOverlay} onClick={() => setIsAttendanceOpen(false)}>
          <div className={`${styles.attendanceModal} glass-panel`} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Bảng Chấm Công Nhanh</h3>
              <button className={styles.closeBtn} onClick={() => setIsAttendanceOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {/* QR Code chấm công cho điện thoại */}
              <div className={styles.qrContainer}>
                <img src={attendanceQRUrl} alt="Attendance QR Code" />
              </div>
              <p className={styles.qrDesc}>
                Dán mã QR chấm công này tại quầy thu ngân. Nhân viên chỉ cần quét mã bằng camera điện thoại để truy cập chấm công nhanh cực kỳ tiện lợi!
              </p>

              {/* Đồng hồ LED thời gian thực */}
              <div className={styles.clockContainer}>
                <span className={styles.digitalTime}>{currentTime.toLocaleTimeString('vi-VN')}</span>
                <span className={styles.digitalDate}>
                  {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>

              {/* Thẻ trạng thái nhân viên */}
              <div className={styles.staffStatusCard}>
                <div className={styles.staffMeta}>
                  <span className={styles.staffName}>{currentFullName}</span>
                  <span className={styles.staffRole}>{role === 'admin' ? 'Chủ cửa hàng (Admin)' : 'Nhân viên (Cashier)'}</span>
                </div>
                <div className={`${styles.statusBadge} ${activeRecord ? styles.statusActive : styles.statusInactive}`}>
                  <span className={styles.statusDot} />
                  <span>{activeRecord ? 'Đang trong ca' : 'Đang nghỉ ca'}</span>
                </div>
              </div>

              {/* Nút hành động chấm công */}
              {!activeRecord ? (
                <button className={styles.clockInBtn} onClick={handleClockIn}>
                  Bắt đầu ca làm (Clock In)
                </button>
              ) : (
                <button className={styles.clockOutBtn} onClick={handleClockOut}>
                  Kết thúc ca làm (Clock Out)
                </button>
              )}

              {/* Nhật ký làm việc trong ngày */}
              <div className={styles.logsContainer}>
                <span className={styles.logsTitle}>Ca làm việc hôm nay:</span>
                {myTodayLogs.length > 0 ? (
                  myTodayLogs.map((log) => (
                    <div key={log.id} className={styles.logRow}>
                      <span className={styles.logLabel}>
                        {log.clockOut ? 'Ca hoàn thành ✅' : 'Ca đang chạy ⏳'}
                      </span>
                      <span className={styles.logTime}>
                        {log.clockIn} → {log.clockOut || 'hiện tại'} 
                        {log.clockOut && ` (${log.hoursWorked}h)`}
                      </span>
                    </div>
                  ))
                ) : (
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Chưa có lượt chấm công nào hôm nay.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <footer className={styles.footer}>
        <p>Hệ thống SaaS quản lý bán hàng by Sinh Viên Bonnie 2.0 Thương mại hóa - Thiết kế bởi Antigravity Team.</p>
      </footer>
    </div>
  );
};
