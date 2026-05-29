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

  // State quản lý restaurantId từ database MongoDB riêng biệt
  const [restaurantId, setRestaurantId] = useState(() => {
    return localStorage.getItem(`saas_restaurant_id_${localStorage.getItem('saas_current_tenant') || ''}`) || '';
  });

  // State cấu hình ngân hàng phản ứng nhanh
  const [bankId, setBankId] = useState(() => {
    const currentTenant = localStorage.getItem('saas_current_tenant') || '';
    return localStorage.getItem(`saas_bank_id_${currentTenant}`) || '';
  });

  const [customBank, setCustomBank] = useState(() => {
    const currentTenant = localStorage.getItem('saas_current_tenant') || '';
    return localStorage.getItem(`saas_custom_bank_${currentTenant}`) || '';
  });

  const [bankAccountNo, setBankAccountNo] = useState(() => {
    const currentTenant = localStorage.getItem('saas_current_tenant') || '';
    return localStorage.getItem(`saas_bank_account_no_${currentTenant}`) || '';
  });

  const [bankAccountName, setBankAccountName] = useState(() => {
    const currentTenant = localStorage.getItem('saas_current_tenant') || '';
    return localStorage.getItem(`saas_bank_account_name_${currentTenant}`) || '';
  });

  const [bankFullName, setBankFullName] = useState(() => {
    const currentTenant = localStorage.getItem('saas_current_tenant') || '';
    return localStorage.getItem(`saas_bank_full_name_${currentTenant}`) || '';
  });

  const [isBackendConnecting, setIsBackendConnecting] = useState(false);
  const [backendError, setBackendError] = useState(null);

  // Tự động đồng bộ và lấy restaurantId + cấu hình ngân hàng từ MongoDB khi tenant đổi (có cơ chế Auto-Retry)
  useEffect(() => {
    if (!tenant) {
      setRestaurantId('');
      setIsBackendConnecting(false);
      setBackendError(null);
      setBankId('');
      setCustomBank('');
      setBankAccountNo('');
      setBankAccountName('');
      setBankFullName('');
      return;
    }

    // Tải trước từ LocalStorage để hiện lập tức (Cache)
    setBankId(localStorage.getItem(`saas_bank_id_${tenant}`) || '');
    setCustomBank(localStorage.getItem(`saas_custom_bank_${tenant}`) || '');
    setBankAccountNo(localStorage.getItem(`saas_bank_account_no_${tenant}`) || '');
    setBankAccountName(localStorage.getItem(`saas_bank_account_name_${tenant}`) || '');
    setBankFullName(localStorage.getItem(`saas_bank_full_name_${tenant}`) || '');

    const fetchRestaurantInfo = async () => {
      setIsBackendConnecting(true);
      setBackendError(null);
      let attempts = 0;
      const maxAttempts = 15; // 15 attempts * 5s = 75 seconds max wait for Render wake up
      
      const tryFetch = async () => {
        try {
          const res = await fetch(`https://qlbh-zsvr.onrender.com/api/restaurant?tenant=${tenant}`, {
            headers: {
              'Content-Type': 'application/json',
              'x-tenant': tenant
            }
          });
          const data = await res.json();
          if (data.success && data.data) {
            const id = data.data._id;
            setRestaurantId(id);
            localStorage.setItem(`saas_restaurant_id_${tenant}`, id);

            // Đồng bộ dữ liệu cấu hình ngân hàng từ Database
            const bId = data.data.bankId || '';
            const cBank = data.data.customBank || '';
            const accNo = data.data.bankAccountNo || '';
            const accName = data.data.bankAccountName || '';
            const fName = data.data.bankFullName || '';

            setBankId(bId);
            setCustomBank(cBank);
            setBankAccountNo(accNo);
            setBankAccountName(accName);
            setBankFullName(fName);

            localStorage.setItem(`saas_bank_id_${tenant}`, bId);
            localStorage.setItem(`saas_custom_bank_${tenant}`, cBank);
            localStorage.setItem(`saas_bank_account_no_${tenant}`, accNo);
            localStorage.setItem(`saas_bank_account_name_${tenant}`, accName);
            localStorage.setItem(`saas_bank_full_name_${tenant}`, fName);

            // Đồng bộ cấu hình vốn & chỉ tiêu nếu có
            if (data.data.config) {
              if (data.data.config.initialInvestment !== null && data.data.config.initialInvestment !== undefined) {
                localStorage.setItem(`saas_restaurant_capital_${tenant}`, data.data.config.initialInvestment);
              }
              if (data.data.config.targetProfitMargin !== null && data.data.config.targetProfitMargin !== undefined) {
                localStorage.setItem(`saas_restaurant_target_profit_rate_${tenant}`, data.data.config.targetProfitMargin);
              }
            }

            setIsBackendConnecting(false);
            setBackendError(null);
            console.log('[Tenant DB Connection] Connected and synchronized successfully to tenant database!');
            return;
          }
        } catch (err) {
          attempts++;
          console.warn(`[Tenant DB Connection] Attempt ${attempts} failed. Render server might be sleeping. Retrying in 5s...`);
          if (attempts < maxAttempts) {
            setTimeout(tryFetch, 5000);
          } else {
            setIsBackendConnecting(false);
            setBackendError('Máy chủ dữ liệu không phản hồi. Vui lòng xác minh cấu hình MongoDB của Render Backend!');
          }
        }
      };

      tryFetch();
    };

    fetchRestaurantInfo();
  }, [tenant]);

  // Lưu cấu hình ngân hàng lên cơ sở dữ liệu MongoDB thông qua Backend
  const saveBankConfig = async (newBankId, newCustomBank, newBankAccountNo, newBankAccountName) => {
    if (!tenant || !restaurantId) return { success: false, message: 'Chưa kết nối cơ sở dữ liệu!' };

    let resolvedFullName = '';
    if (newBankId === 'custom') {
      if (!newCustomBank.trim()) {
        return { success: false, message: 'Vui lòng điền tên ngân hàng tự thêm!' };
      }
      resolvedFullName = newCustomBank.trim();
    } else {
      const bankOptions = {
        'tpb': 'TPBank',
        'vcb': 'Vietcombank',
        'mb': 'MBBank',
        'tcb': 'Techcombank',
        'acb': 'ACB',
        'bidv': 'BIDV',
        'vietinbank': 'Vietinbank',
        'vpb': 'VPBank'
      };
      resolvedFullName = bankOptions[newBankId] || '';
    }

    try {
      const res = await fetch('https://qlbh-zsvr.onrender.com/api/restaurant/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({
          restaurantId,
          bankId: newBankId,
          customBank: newCustomBank,
          bankAccountNo: newBankAccountNo,
          bankAccountName: newBankAccountName,
          bankFullName: resolvedFullName
        })
      });

      const data = await res.json();
      if (data.success) {
        // Cập nhật State phản ứng nhanh
        setBankId(newBankId);
        setCustomBank(newCustomBank);
        setBankAccountNo(newBankAccountNo);
        setBankAccountName(newBankAccountName);
        setBankFullName(resolvedFullName);

        // Lưu LocalStorage dự phòng
        localStorage.setItem(`saas_bank_id_${tenant}`, newBankId);
        localStorage.setItem(`saas_custom_bank_${tenant}`, newCustomBank);
        localStorage.setItem(`saas_bank_account_no_${tenant}`, newBankAccountNo);
        localStorage.setItem(`saas_bank_account_name_${tenant}`, newBankAccountName);
        localStorage.setItem(`saas_bank_full_name_${tenant}`, resolvedFullName);

        return { success: true };
      } else {
        return { success: false, message: data.message || 'Lỗi cập nhật cấu hình ngân hàng' };
      }
    } catch (err) {
      console.error('[TenantContext] Error saving bank config:', err);
      return { success: false, message: 'Không thể kết nối đến máy chủ!' };
    }
  };

  // Lưu chỉ tiêu tài chính lên cơ sở dữ liệu MongoDB
  const saveFinancialConfig = async (capital, rate) => {
    if (!tenant || !restaurantId) return { success: false, message: 'Chưa kết nối cơ sở dữ liệu!' };
    try {
      const res = await fetch('https://qlbh-zsvr.onrender.com/api/restaurant/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant': tenant
        },
        body: JSON.stringify({
          restaurantId,
          initialInvestment: capital,
          targetProfitMargin: rate
        })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem(`saas_restaurant_capital_${tenant}`, capital);
        localStorage.setItem(`saas_restaurant_target_profit_rate_${tenant}`, rate);
        return { success: true };
      }
      return { success: false, message: data.message || 'Lỗi cập nhật cấu hình tài chính' };
    } catch (err) {
      console.error('[TenantContext] Error saving financial config:', err);
      return { success: false, message: 'Không thể kết nối đến máy chủ!' };
    }
  };

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
        restaurantId,
        isBackendConnecting,
        backendError,
        user,
        role,
        isLoggedIn,
        login,
        register,
        logout,
        convertToSlug,
        registeredUsers,
        updateStaffDetails,
        bankId,
        customBank,
        bankAccountNo,
        bankAccountName,
        bankFullName,
        saveBankConfig,
        saveFinancialConfig
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};
