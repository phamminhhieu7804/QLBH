import React, { createContext, useState, useEffect } from 'react';

// Tạo Context cho việc định danh Quán (Tenant) và Tài khoản
export const TenantContext = createContext();

// Danh sách tài khoản demo mặc định ban đầu
const DEFAULT_USERS = [
  {
    tenant: 'pho-gia-truyen',
    tenantName: 'Phở Gia Truyền',
    username: 'chucuahang',
    password: '123', // Đổi mật khẩu ngắn gọn để khách dễ gõ
    role: 'admin',    // Chủ cửa hàng (Vào được cả Admin & POS)
    fullName: 'Chủ Quán Gia Truyền',
    startDate: '01/01/2026',
    payDay: 5,
    hourlyRate: 0
  },
  {
    tenant: 'tra-sua-chill',
    tenantName: 'Trà Sữa Chill',
    username: 'thungan_01',
    password: '123',
    role: 'cashier',  // Nhân viên (Chỉ được vào POS/Order)
    fullName: 'Nguyễn Thu Ngân',
    startDate: '15/02/2026',
    payDay: 5,
    hourlyRate: 25000
  }
];

export const TenantProvider = ({ children }) => {
  // Tự động khởi tạo tài khoản Demo làm mặc định để vào thẳng giao diện chính
  const initializeDemoSession = () => {
    localStorage.setItem('saas_current_tenant', 'pho-gia-truyen');
    localStorage.setItem('saas_current_tenant_name', 'Phở Gia Truyền');
    localStorage.setItem('saas_current_user', 'chucuahang');
    localStorage.setItem('saas_current_role', 'admin');
    localStorage.setItem('saas_staff_role', 'admin');
  };

  const [tenant, setTenant] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrTable = urlParams.get('table');
    const qrTenant = urlParams.get('tenant');

    // Nếu vào thẳng link gốc (không phải QR) mà trước đó đang ở vai trò customer
    if (!qrTable && !qrTenant && localStorage.getItem('saas_current_role') === 'customer') {
      const staffRole = localStorage.getItem('saas_staff_role');
      if (staffRole) {
        localStorage.setItem('saas_current_role', staffRole);
      } else {
        localStorage.removeItem('saas_current_role');
        localStorage.removeItem('saas_current_tenant');
        localStorage.removeItem('saas_current_user');
      }
    }

    if (qrTenant) {
      localStorage.setItem('saas_current_tenant', qrTenant);
      return qrTenant;
    }
    const current = localStorage.getItem('saas_current_tenant');
    if (!current) {
      return '';
    }
    return current;
  });

  const [user, setUser] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrTable = urlParams.get('table');
    const qrTenant = urlParams.get('tenant');
    if (qrTable && qrTenant) {
      localStorage.setItem('saas_current_user', 'Khách hàng (QR)');
      return 'Khách hàng (QR)';
    }
    const current = localStorage.getItem('saas_current_user');
    if (!current) {
      return '';
    }
    return current;
  });

  const [role, setRole] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrTable = urlParams.get('table');
    const qrTenant = urlParams.get('tenant');
    if (qrTable && qrTenant) {
      localStorage.setItem('saas_current_role', 'customer');
      return 'customer';
    }
    const current = localStorage.getItem('saas_current_role');
    if (!current) {
      return '';
    }
    return current;
  });

  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const qrTable = urlParams.get('table');
    const qrTenant = urlParams.get('tenant');
    if (qrTable && qrTenant) {
      localStorage.setItem('saas_current_tenant', qrTenant);
      const savedUsers = localStorage.getItem('saas_registered_users');
      const usersList = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
      const found = usersList.find(u => u.tenant === qrTenant);
      const name = found ? found.tenantName : (qrTenant === 'pho-gia-truyen' ? 'Phở Gia Truyền' : 'Trà Sữa Chill');
      localStorage.setItem('saas_current_tenant_name', name);
      return true;
    }

    // Kiểm tra xem có phiên đăng nhập nhân viên/admin lưu sẵn hợp lệ hay không
    const savedUser = localStorage.getItem('saas_current_user');
    const savedTenant = localStorage.getItem('saas_current_tenant');
    const savedRole = localStorage.getItem('saas_current_role');

    if (savedUser && savedTenant && savedRole && savedRole !== 'customer') {
      return true;
    }
    return false; // Mặc định không tự động đăng nhập khi vào, hiện trang Đăng nhập
  });

  // Danh sách toàn bộ tài khoản đăng ký trong hệ thống
  const [registeredUsers, setRegisteredUsers] = useState(() => {
    const saved = localStorage.getItem('saas_registered_users');
    return saved ? JSON.parse(saved) : DEFAULT_USERS;
  });

  // Đồng bộ hóa danh sách tài khoản đăng ký
  useEffect(() => {
    localStorage.setItem('saas_registered_users', JSON.stringify(registeredUsers));
  }, [registeredUsers]);

  // Chuyển đổi tên quán nhập vào thành Slug chuẩn (ví dụ: "Tiệm Trà Sữa Chill" -> "tiem-tra-sua-chill")
  const convertToSlug = (text) => {
    return text
      .toLowerCase()
      .normalize('NFD') // Loại bỏ dấu tiếng Việt chuẩn Unicode
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/([^a-z0-9\s-]|_)+/g, '') // Xóa ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-'); // Thay khoảng trắng bằng dấu gạch ngang
  };

  // Logic Đăng ký tài khoản mới phân quyền
  const register = (rawTenantName, username, password, selectedRole, fullName = '', payDay = 5) => {
    if (!rawTenantName.trim() || !username.trim() || !password.trim()) {
      return { success: false, message: 'Vui lòng điền đầy đủ tất cả thông tin.' };
    }

    const tenantSlug = convertToSlug(rawTenantName);

    // Kiểm tra tài khoản đã tồn tại cho quán này chưa
    const isExisted = registeredUsers.some(
      (u) => u.tenant === tenantSlug && u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (isExisted) {
      return { 
        success: false, 
        message: `Tên tài khoản "${username}" đã tồn tại trong hệ thống của quán "${rawTenantName.trim()}".` 
      };
    }

    const newUser = {
      tenant: tenantSlug,
      tenantName: rawTenantName.trim(),
      username: username.trim(),
      password: password,
      role: selectedRole, // 'admin' hoặc 'cashier'
      fullName: fullName.trim() || username.trim(),
      startDate: new Date().toLocaleDateString('vi-VN'),
      payDay: Number(payDay) || 5,
      hourlyRate: selectedRole === 'admin' ? 0 : 25000
    };

    setRegisteredUsers((prev) => [...prev, newUser]);
    return { success: true };
  };

  // Cập nhật thông tin nhân viên (ngày nhận lương, mức lương giờ...)
  const updateStaffDetails = (username, updatedFields) => {
    setRegisteredUsers((prev) =>
      prev.map((u) => {
        if (u.tenant === tenant && u.username === username) {
          return { ...u, ...updatedFields };
        }
        return u;
      })
    );
  };

  // Logic Đăng nhập kiểm tra dữ liệu đăng ký động
  const login = (rawTenantName, username, password) => {
    if (!rawTenantName.trim() || !username.trim() || !password.trim()) {
      return { success: false, message: 'Vui lòng điền đầy đủ Tên quán, Tên đăng nhập và Mật khẩu.' };
    }

    const tenantSlug = convertToSlug(rawTenantName);

    // Tìm kiếm người dùng trong danh sách tài khoản đã đăng ký (hoặc demo)
    const foundUser = registeredUsers.find(
      (u) => u.tenant === tenantSlug && u.username.toLowerCase() === username.toLowerCase().trim()
    );

    if (!foundUser) {
      return { 
        success: false, 
        message: `Không tìm thấy tài khoản "${username}" đăng ký tại quán "${rawTenantName.trim()}". Hãy tạo tài khoản mới ở tab Đăng ký!` 
      };
    }

    // Kiểm tra mật khẩu
    if (foundUser.password !== password) {
      return { success: false, message: 'Mật khẩu đăng nhập không chính xác!' };
    }

    // Đăng nhập thành công -> Cập nhật các states phiên làm việc
    setTenant(foundUser.tenant);
    setUser(foundUser.username);
    setRole(foundUser.role);
    setIsLoggedIn(true);

    // Lưu thông tin phiên đăng nhập hiện tại
    localStorage.setItem('saas_current_tenant', foundUser.tenant);
    localStorage.setItem('saas_current_tenant_name', foundUser.tenantName);
    localStorage.setItem('saas_current_user', foundUser.username);
    localStorage.setItem('saas_current_role', foundUser.role);
    localStorage.setItem('saas_staff_role', foundUser.role); // Lưu role nhân sự

    return { success: true, tenant: foundUser.tenant, role: foundUser.role };
  };

  const logout = () => {
    setTenant('');
    setUser('');
    setRole('');
    setIsLoggedIn(false);

    localStorage.removeItem('saas_current_tenant');
    localStorage.removeItem('saas_current_tenant_name');
    localStorage.removeItem('saas_current_user');
    localStorage.removeItem('saas_current_role');
    localStorage.removeItem('saas_staff_role'); // Xóa role nhân sự

    // Xóa sạch các query parameters trên URL khi đăng xuất để trả về trang đăng nhập
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const getTenantName = () => {
    return localStorage.getItem('saas_current_tenant_name') || tenant;
  };

  return (
    <TenantContext.Provider
      value={{
        tenant,
        tenantName: getTenantName(),
        user,
        role,
        isLoggedIn,
        login,
        register,
        logout,
        convertToSlug,
        registeredUsers,
        updateStaffDetails
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
