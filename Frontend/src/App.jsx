import React, { useState, useContext } from 'react';
import { 
  LayoutGrid, 
  BarChart3, 
  Database, 
  Moon, 
  Sun, 
  UtensilsCrossed, 
  ArrowLeft, 
  LogOut, 
  ShieldCheck,
  History,
  UserCheck,
  DollarSign,
  ShoppingBag
} from 'lucide-react';
import { TenantProvider, TenantContext } from './context/TenantContext';
import { MenuProvider } from './context/MenuContext';
import { CartProvider, CartContext } from './context/CartContext';
import { Login } from './features/auth/Login';
import { SaaSHub } from './features/hub/SaaSHub';
import { POSLayout } from './features/pos/POSLayout/POSLayout';
import { Dashboard } from './features/admin/Dashboard/Dashboard';
import { MenuMgmt } from './features/admin/MenuMgmt/MenuMgmt';
import { TableMgmt } from './features/admin/TableMgmt/TableMgmt';
import { KitchenDisplay } from './features/kitchen/KitchenDisplay';
import { ActivityLog } from './features/admin/ActivityLog/ActivityLog';
import { Attendance } from './features/admin/Attendance/Attendance';
import { Salary } from './features/admin/Salary/Salary';
import styles from './App.module.css';

// Component con đăng ký TenantContext để định tuyến động các màn hình chính
const AppContent = () => {
  const { isLoggedIn, tenantName, user, role, logout } = useContext(TenantContext);
  const { activeTableName } = useContext(CartContext);
  
  // Các view khả dụng sau đăng nhập: 'hub' | 'admin' | 'pos'
  const [currentView, setCurrentView] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('table') && urlParams.has('tenant')) {
      return 'pos'; // Khách quét QR → thẳng POS
    }
    return 'hub'; // Tất cả các role khác → vào Hub chọn
  });
  
  // Trực quan hóa menu Admin: 'dashboard' | 'menu_mgmt'
  const [adminTab, setAdminTab] = useState('dashboard');
  
  // Trạng thái tối/sáng của giao diện
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Lắng nghe sự thay đổi của isLoggedIn và vai trò (role) để tự động phân quyền điều hướng
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('table') && urlParams.has('tenant')) {
      setCurrentView('pos'); // Khách quét QR → thẳng POS
      return;
    }

    if (isLoggedIn) {
      if (role === 'customer') {
        setCurrentView('pos'); // Khách quét QR → thẳng POS
      } else {
        // Giữ nguyên view hiện tại nếu đang ở các phân hệ quản lý để tránh tự động reset về hub
        setCurrentView(prev => (prev === 'admin' || prev === 'pos' || prev === 'kitchen') ? prev : 'hub');
      }
    } else {
      setCurrentView('hub');
    }
  }, [isLoggedIn, role]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (!isDarkMode) {
      document.documentElement.classList.add('dark-theme');
    } else {
      document.documentElement.classList.remove('dark-theme');
    }
  };

  // 1. Nếu chưa đăng nhập -> Hiển thị trang đăng nhập đa quán
  if (!isLoggedIn) {
    return <Login />;
  }

  // 2. Nếu đã đăng nhập và đang ở cổng SaaS Hub -> Hiển thị Hub chọn phân hệ
  if (currentView === 'hub') {
    return <SaaSHub onSelectApp={setCurrentView} />;
  }

  // 2b. Phân hệ Bếp KDS – chỉ Admin và Cashier mới được vào
  if (currentView === 'kitchen') {
    if (role === 'customer') {
      // Khách quét QR không được phép vào bếp
      setCurrentView('hub');
      return null;
    }
    return <KitchenDisplay onBack={() => setCurrentView('hub')} />;
  }

  // 3. Phân hệ bán hàng POS chuyên nghiệp (Toàn màn hình, tinh tế)
  if (currentView === 'pos') {
    return (
      <div className={`${styles.posAppShell} ${isDarkMode ? styles.dark : ''}`}>
        {/* POS Header */}
        <header className={`${styles.posHeader} glass-panel`}>
          <div className={styles.posHeaderLeft}>
            {/* Hiển thị nút quay lại Hub hoặc Admin cho Chủ quán hoặc Nhân viên kể cả khi đang ở chế độ QR */}
            {(role === 'admin' || role === 'cashier' || localStorage.getItem('saas_staff_role') === 'admin' || localStorage.getItem('saas_staff_role') === 'cashier') && (
              <button 
                className={styles.backHubBtn} 
                onClick={() => {
                  const staffRole = localStorage.getItem('saas_staff_role') || 'admin';
                  localStorage.setItem('saas_current_role', staffRole);
                  window.location.href = window.location.pathname; // Tải lại trang cơ bản để thoát chế độ QR
                }} 
                title="Quay lại Trang quản lý / Hub"
              >
                <ArrowLeft size={16} />
                <span>Quay lại Admin</span>
              </button>
            )}
            <div className={`${styles.posLogoWrapper} ${role === 'cashier' || role === 'customer' ? styles.noBorderLeft : ''}`}>
              <UtensilsCrossed size={16} className={styles.logoIcon} />
              <h3>{tenantName}</h3>
              {role === 'customer' ? (
                <span className={styles.badgePOS} style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: 'var(--success-color)', textShadow: 'none' }}>
                  Khách tự gọi món - {activeTableName}
                </span>
              ) : (
                <span className={styles.badgePOS}>Màn hình bán lẻ POS</span>
              )}
            </div>
          </div>

          <div className={styles.posHeaderRight}>
            {role !== 'customer' ? (
              <>
                <button className={styles.themeToggle} onClick={toggleTheme} title="Bật/Tắt chế độ tối">
                  {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                </button>
                <div className={styles.posUserInfo}>
                  <span className={styles.posUser}>{user}</span>
                  <span className={styles.posRole}>{role === 'admin' ? 'Chủ cửa hàng' : 'Nhân viên'}</span>
                  {role === 'cashier' && (
                    <button 
                      className={styles.cashierBackBtn} 
                      onClick={() => setCurrentView('hub')}
                      title="Quay lại Hub điều hành"
                    >
                      Quay lại Hub
                    </button>
                  )}
                </div>
                <button className={styles.posLogoutBtn} onClick={logout} title="Đăng xuất">
                  <LogOut size={16} />
                </button>
              </>
            ) : (
              <div className={styles.posUserInfo} style={{ alignItems: 'flex-end' }}>
                <span className={styles.posUser} style={{ color: 'var(--success-color)' }}>Bàn đang hoạt động</span>
                <span className={styles.posRole}>Thanh toán tại quầy khi dùng xong</span>
              </div>
            )}
          </div>
        </header>

        {/* Khung nội dung POS */}
        <div className={styles.posMain}>
          <POSLayout />
        </div>
      </div>
    );
  }

  // 4. Phân hệ Quản trị Admin chuyên nghiệp (Có sidebar dọc điều hướng)
  if (currentView === 'admin') {
    return (
      <div className={`${styles.adminAppShell} ${isDarkMode ? styles.dark : ''}`}>
        {/* Sidebar quản trị */}
        <aside className={`${styles.adminSidebar} glass-panel`}>
          <div className={styles.sidebarLogo}>
            <UtensilsCrossed size={20} className={styles.logoIcon} />
            <h3>{tenantName}</h3>
          </div>

          <div className={styles.sidebarMenu}>
            <button
              className={`${styles.sidebarBtn} ${adminTab === 'dashboard' ? styles.activeSidebar : ''}`}
              onClick={() => setAdminTab('dashboard')}
            >
              <BarChart3 size={18} />
              <span>Tổng quan doanh thu</span>
            </button>
            <button
              className={`${styles.sidebarBtn} ${adminTab === 'menu_mgmt' ? styles.activeSidebar : ''}`}
              onClick={() => setAdminTab('menu_mgmt')}
            >
              <Database size={18} />
              <span>Thực đơn cửa hàng</span>
            </button>
            <button
              className={`${styles.sidebarBtn} ${adminTab === 'table_mgmt' ? styles.activeSidebar : ''}`}
              onClick={() => setAdminTab('table_mgmt')}
            >
              <LayoutGrid size={18} />
              <span>Sơ đồ & Bàn ăn</span>
            </button>
            <button
              className={`${styles.sidebarBtn} ${adminTab === 'attendance' ? styles.activeSidebar : ''}`}
              onClick={() => setAdminTab('attendance')}
            >
              <UserCheck size={18} />
              <span>Chấm công nhân viên</span>
            </button>
            <button
              className={`${styles.sidebarBtn} ${adminTab === 'payroll' ? styles.activeSidebar : ''}`}
              onClick={() => setAdminTab('payroll')}
            >
              <DollarSign size={18} />
              <span>Tính tiền lương</span>
            </button>
            <button
              className={`${styles.sidebarBtn} ${adminTab === 'activity_log' ? styles.activeSidebar : ''}`}
              onClick={() => setAdminTab('activity_log')}
            >
              <History size={18} />
              <span>Lịch sử hoạt động</span>
            </button>
          </div>

          <div className={styles.sidebarFooter}>
            <button className={styles.backHubBtnSidebar} onClick={() => setCurrentView('hub')}>
              <ArrowLeft size={16} />
              <span>Quay lại Hub điều hành</span>
            </button>
            <div className={styles.securitySeal}>
              <ShieldCheck size={12} />
              <span>SaaS Secure Core</span>
            </div>
          </div>
        </aside>

        {/* Thân chính Admin Panel */}
        <div className={styles.adminMain}>
          {/* Header điều khiển trên */}
          <header className={`${styles.adminHeader} glass-panel`}>
            <div className={styles.adminHeaderLeft}>
              <h4>Trang chủ quản trị viên</h4>
            </div>
             <div className={styles.adminHeaderRight}>
              <button 
                className={styles.goToPosBtn} 
                onClick={() => setCurrentView('pos')}
                title="Chuyển sang màn hình bán hàng POS"
              >
                <ShoppingBag size={14} />
                <span>Bán hàng (POS)</span>
              </button>
              <button className={styles.themeToggle} onClick={toggleTheme}>
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <div className={styles.adminUser}>
                <span>Chủ quán: {user}</span>
              </div>
              <button className={styles.posLogoutBtn} onClick={logout} title="Đăng xuất">
                <LogOut size={16} />
              </button>
            </div>
          </header>

          {/* Vùng xem nội dung Admin */}
          <div className={styles.adminContent}>
            {adminTab === 'dashboard' && <Dashboard />}
            {adminTab === 'menu_mgmt' && <MenuMgmt />}
            {adminTab === 'table_mgmt' && <TableMgmt />}
            {adminTab === 'attendance' && <Attendance />}
            {adminTab === 'payroll' && <Salary />}
            {adminTab === 'activity_log' && <ActivityLog />}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

// Điểm xuất phát của App bọc đầy đủ các Provider hệ thống
export default function App() {
  return (
    <TenantProvider>
      <MenuProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </MenuProvider>
    </TenantProvider>
  );
}
