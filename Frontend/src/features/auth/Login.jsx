import React, { useState, useContext } from 'react';
import { Store, User, Lock, ArrowRight, UtensilsCrossed, AlertCircle, CheckCircle2, UserCheck, Shield } from 'lucide-react';
import { TenantContext } from '../../context/TenantContext';
import { Button } from '../../components/Button/Button';
import { Input } from '../../components/Input/Input';
import styles from './Login.module.css';

// Trang đăng nhập và đăng ký SaaS thương mại phân quyền người dùng
export const Login = () => {
  const { login, register } = useContext(TenantContext);

  // Toggle giữa tab Đăng nhập (false) và Đăng ký (true)
  const [isSignUp, setIsSignUp] = useState(false);

  // States các trường nhập liệu
  const [restaurantName, setRestaurantName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [payDay, setPayDay] = useState(5);
  const [selectedRole, setSelectedRole] = useState('admin'); // admin | cashier
  const [backupEmail, setBackupEmail] = useState('');

  // States thông báo
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Xử lý nộp biểu mẫu Đăng nhập
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!restaurantName.trim() || !username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tất cả thông tin.');
      return;
    }

    const result = login(restaurantName, username, password);
    if (!result.success) {
      setError(result.message || 'Đăng nhập không thành công.');
    }
  };

  // Xử lý nộp biểu mẫu Đăng ký tài khoản mới
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!restaurantName.trim() || !username.trim() || !password.trim()) {
      setError('Vui lòng nhập đầy đủ tất cả các trường.');
      return;
    }

    if (selectedRole === 'admin' && !backupEmail.trim()) {
      setError('Chủ cửa hàng bắt buộc phải nhập Gmail để nhận file sao lưu hệ thống.');
      return;
    }

    const result = register(restaurantName, username, password, selectedRole, fullName, payDay, backupEmail);
    if (result.success) {
      setSuccess(`Đăng ký thành công quán "${restaurantName.trim()}"! Hãy dùng thông tin này để đăng nhập.`);
      // Chuyển về tab Đăng nhập sau khi đăng ký thành công
      setIsSignUp(false);
      // Giữ nguyên tên quán và tài khoản để khách đăng nhập ngay
      setPassword('');
      setFullName('');
      setPayDay(5);
    } else {
      setError(result.message || 'Đăng ký không thành công.');
    }
  };

  // Điền nhanh thông tin tài khoản demo dùng thử
  const fillDemoAccount = (tenant, user, roleType) => {
    setIsSignUp(false);
    setRestaurantName(tenant);
    setUsername(user);
    setPassword('123'); // Mật khẩu demo mặc định mới
    setSelectedRole(roleType);
    setError('');
    setSuccess('');
  };

  return (
    <div className={styles.loginPage}>
      {/* Background Decor */}
      <div className={styles.bgDecorGlow1} />
      <div className={styles.bgDecorGlow2} />

      <div className={`${styles.loginCard} glass-panel`}>
        {/* Logo Cửa hàng */}
        <div className={styles.logoContainer}>
          <div className={styles.logoIconWrapper}>
            <UtensilsCrossed size={26} className={styles.logoIcon} />
          </div>
          <h2>Antigravity POS</h2>
          <p className={styles.tagline}>Nền tảng quản lý và bán lẻ SaaS thương mại</p>
        </div>

        {/* Tab Headers chuyển đổi Đăng nhập / Đăng ký */}
        <div className={styles.tabHeaders}>
          <button
            className={`${styles.tabBtn} ${!isSignUp ? styles.activeTabBtn : ''}`}
            onClick={() => {
              setIsSignUp(false);
              setError('');
              setSuccess('');
            }}
          >
            Đăng nhập
          </button>
          <button
            className={`${styles.tabBtn} ${isSignUp ? styles.activeTabBtn : ''}`}
            onClick={() => {
              setIsSignUp(true);
              setError('');
              setSuccess('');
            }}
          >
            Đăng ký quán mới
          </button>
        </div>

        {/* Thông báo lỗi */}
        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={16} className={styles.errorAlertIcon} />
            <span>{error}</span>
          </div>
        )}

        {/* Thông báo thành công */}
        {success && (
          <div className={styles.successAlert}>
            <CheckCircle2 size={16} className={styles.successAlertIcon} />
            <span>{success}</span>
          </div>
        )}

        {/* FORM CHÍNH */}
        {!isSignUp ? (
          /* FORM ĐĂNG NHẬP */
          <form onSubmit={handleLoginSubmit} className={styles.form}>
            <Input
              label="Tên quán kinh doanh"
              placeholder="Gõ tên quán (Ví dụ: Phở Gia Truyền)"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              icon={Store}
              required
              fullWidth
            />

            <Input
              label="Tên đăng nhập"
              placeholder="Nhập tài khoản"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={User}
              required
              fullWidth
            />

            <Input
              label="Mật khẩu"
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              fullWidth
            />

            <Button type="submit" variant="primary" fullWidth size="large" className={styles.submitBtn}>
              <span>Bắt đầu làm việc</span>
              <ArrowRight size={18} />
            </Button>
          </form>
        ) : (
          /* FORM ĐĂNG KÝ MỚI PHÂN QUYỀN */
          <form onSubmit={handleRegisterSubmit} className={styles.form}>
            <Input
              label="Tên quán kinh doanh của bạn"
              placeholder="Ví dụ: Cơm Gà Hội An, Tiệm Bánh Mì Đẹp"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              icon={Store}
              required
              fullWidth
            />

            <Input
              label="Tên tài khoản mới"
              placeholder="Ví dụ: chutiem hoặc nhanvien01"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={User}
              required
              fullWidth
            />

             <Input
              label="Mật khẩu bảo mật"
              type="password"
              placeholder="Nhập mật khẩu tự chọn"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={Lock}
              required
              fullWidth
            />

            <Input
              label="Họ và tên đầy đủ nhân viên/chủ"
              placeholder="Ví dụ: Nguyễn Văn A"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              icon={User}
              required
              fullWidth
            />

            <Input
              label="Ngày nhận lương hàng tháng (từ 1 đến 31)"
              type="number"
              min="1"
              max="31"
              placeholder="Nhập ngày nhận lương (mặc định: 5)"
              value={payDay || ''}
              onChange={(e) => {
                const val = e.target.value === '' ? '' : Math.min(31, Math.max(1, Number(e.target.value)));
                setPayDay(val);
              }}
              icon={UserCheck}
              required
              fullWidth
            />

            {selectedRole === 'admin' && (
              <div style={{ marginBottom: '1rem' }}>
                <Input
                  label="Tài khoản Gmail nhận file sao lưu (Google Drive)"
                  type="email"
                  placeholder="Ví dụ: chucuahang@gmail.com"
                  value={backupEmail}
                  onChange={(e) => setBackupEmail(e.target.value)}
                  icon={Shield}
                  required={selectedRole === 'admin'}
                  fullWidth
                />
              </div>
            )}

            {/* Vùng chọn Phân quyền vai trò người dùng */}
            <div className={styles.roleSelectionContainer}>
              <label className={styles.roleLabel}>Phân quyền vai trò</label>
              <div className={styles.roleOptionsGrid}>
                {/* Option 1: Chủ cửa hàng (Admin) */}
                <label className={`${styles.roleOptionCard} ${selectedRole === 'admin' ? styles.activeRoleCard : ''}`}>
                  <input
                    type="radio"
                    name="registerRole"
                    value="admin"
                    checked={selectedRole === 'admin'}
                    onChange={() => setSelectedRole('admin')}
                    className={styles.hiddenRadio}
                  />
                  <div className={styles.roleCardInfo}>
                    <Shield size={18} className={styles.roleIconShield} />
                    <div className={styles.roleText}>
                      <strong>Chủ cửa hàng</strong>
                      <span>Quản trị, Bán hàng & Bếp</span>
                    </div>
                  </div>
                </label>

                {/* Option 2: Nhân viên phục vụ (Cashier) */}
                <label className={`${styles.roleOptionCard} ${selectedRole === 'cashier' ? styles.activeRoleCard : ''}`}>
                  <input
                    type="radio"
                    name="registerRole"
                    value="cashier"
                    checked={selectedRole === 'cashier'}
                    onChange={() => setSelectedRole('cashier')}
                    className={styles.hiddenRadio}
                  />
                  <div className={styles.roleCardInfo}>
                    <UserCheck size={18} className={styles.roleIconUser} />
                    <div className={styles.roleText}>
                      <strong>Nhân viên</strong>
                      <span>Bán hàng (POS) & Màn hình Bếp</span>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <Button type="submit" variant="secondary" fullWidth size="large" className={styles.submitBtnRegister}>
              <span>Đăng ký sử dụng hệ thống</span>
              <ArrowRight size={18} />
            </Button>
          </form>
        )}

        {/* Phần điền nhanh thông tin tài khoản demo */}
        <div className={styles.demoSection}>
          <div className={styles.demoDivider}>
            <span>Trải nghiệm nhanh dữ liệu mẫu</span>
          </div>
          
          <div className={styles.demoButtonsGrid}>
            <button
              type="button"
              className={styles.demoBtn}
              onClick={() => fillDemoAccount('Phở Gia Truyền', 'chucuahang', 'admin')}
            >
              <Store size={14} className={styles.demoBtnIcon} />
              <div className={styles.demoBtnText}>
                <strong>Phở Gia Truyền</strong>
                <span>Chủ quán (Quản trị & POS)</span>
              </div>
            </button>

            <button
              type="button"
              className={styles.demoBtn}
              onClick={() => fillDemoAccount('Trà Sữa Chill', 'thungan_01', 'cashier')}
            >
              <Store size={14} className={styles.demoBtnIcon} />
              <div className={styles.demoBtnText}>
                <strong>Trà Sữa Chill</strong>
                <span>Nhân viên (POS & Bếp)</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
