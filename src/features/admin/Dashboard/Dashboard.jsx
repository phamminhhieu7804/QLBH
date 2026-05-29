import React, { useContext, useMemo, useState, useEffect } from 'react';
import { 
  DollarSign, 
  ShoppingBag, 
  Award, 
  TrendingUp, 
  Target, 
  Coffee, 
  Activity, 
  Settings, 
  Trash, 
  Plus, 
  TrendingDown, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { CartContext } from '../../../context/CartContext';
import { MenuContext } from '../../../context/MenuContext';
import { TenantContext } from '../../../context/TenantContext';
import styles from './Dashboard.module.css';

// Trang tổng quan doanh thu & thống kê (Admin Dashboard)
export const Dashboard = () => {
  const { ordersHistory } = useContext(CartContext);
  const { tenant } = useContext(TenantContext);
  const { menuItems } = useContext(MenuContext);

  // --- STATE CẤU HÌNH VỐN & CHỈ TIÊU ---
  const [initialCapital, setInitialCapital] = useState(() => {
    const saved = localStorage.getItem(`saas_restaurant_capital_${tenant}`);
    return saved !== null && saved !== "" ? Number(saved) : 1000000;
  });

  const [targetProfitRate, setTargetProfitRate] = useState(() => {
    const saved = localStorage.getItem(`saas_restaurant_target_profit_rate_${tenant}`);
    return saved !== null && saved !== "" ? Number(saved) : 30;
  });

  // --- STATE CẤU HÌNH TÀI KHOẢN NGÂN HÀNG NHẬN TIỀN ---
  const [bankId, setBankId] = useState(() => {
    const saved = localStorage.getItem(`saas_bank_id_${tenant}`);
    return saved !== null ? saved : '';
  });

  const [customBank, setCustomBank] = useState(() => {
    const saved = localStorage.getItem(`saas_custom_bank_${tenant}`);
    return saved !== null ? saved : '';
  });

  const [bankAccountNo, setBankAccountNo] = useState(() => {
    const saved = localStorage.getItem(`saas_bank_account_no_${tenant}`);
    return saved !== null ? saved : '';
  });

  const [bankAccountName, setBankAccountName] = useState(() => {
    const saved = localStorage.getItem(`saas_bank_account_name_${tenant}`);
    return saved !== null ? saved : '';
  });

  // Đồng bộ hóa cấu hình ngân hàng khi chuyển đổi Tenant
  useEffect(() => {
    if (tenant) {
      const savedBankId = localStorage.getItem(`saas_bank_id_${tenant}`);
      const savedCustomBank = localStorage.getItem(`saas_custom_bank_${tenant}`);
      const savedAccountNo = localStorage.getItem(`saas_bank_account_no_${tenant}`);
      const savedAccountName = localStorage.getItem(`saas_bank_account_name_${tenant}`);
      
      setBankId(savedBankId !== null ? savedBankId : '');
      setCustomBank(savedCustomBank !== null ? savedCustomBank : '');
      setBankAccountNo(savedAccountNo !== null ? savedAccountNo : '');
      setBankAccountName(savedAccountName !== null ? savedAccountName : '');
    }
  }, [tenant]);

  // Lưu Vốn và Chỉ tiêu tự động khi thay đổi
  useEffect(() => {
    if (tenant) {
      localStorage.setItem(`saas_restaurant_capital_${tenant}`, initialCapital);
      localStorage.setItem(`saas_restaurant_target_profit_rate_${tenant}`, targetProfitRate);
    }
  }, [initialCapital, targetProfitRate, tenant]);

  // Hàm Lưu thủ công cấu hình tài khoản ngân hàng nhận tiền
  const handleSaveBankConfig = () => {
    if (tenant) {
      localStorage.setItem(`saas_bank_id_${tenant}`, bankId);
      localStorage.setItem(`saas_custom_bank_${tenant}`, customBank);
      localStorage.setItem(`saas_bank_account_no_${tenant}`, bankAccountNo);
      localStorage.setItem(`saas_bank_account_name_${tenant}`, bankAccountName);
      
      let bankFullName = '';
      if (bankId === 'custom') {
        if (!customBank.trim()) {
          alert('⚠️ Vui lòng điền tên ngân hàng tự thêm!');
          return;
        }
        bankFullName = customBank.trim();
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
        bankFullName = bankOptions[bankId] || '';
      }
      localStorage.setItem(`saas_bank_full_name_${tenant}`, bankFullName);
      alert('🎉 Đã lưu cấu hình tài khoản ngân hàng thành công!');
    }
  };

  // --- STATE CẤU HÌNH CA LÀM VIỆC ---
  const [isShiftConfigOpen, setIsShiftConfigOpen] = useState(false);
  const [shifts, setShifts] = useState(() => {
    const saved = localStorage.getItem(`saas_restaurant_shifts_${tenant}`);
    return saved ? JSON.parse(saved) : [
      { id: 'shift-1', name: 'Ca Sáng', startHour: 8, endHour: 12 },
      { id: 'shift-2', name: 'Ca Trưa', startHour: 12, endHour: 16 },
      { id: 'shift-3', name: 'Ca Tối', startHour: 16, endHour: 22 }
    ];
  });

  const [newShiftName, setNewShiftName] = useState('');
  const [newStartHour, setNewStartHour] = useState(8);
  const [newEndHour, setNewEndHour] = useState(12);
  const [shiftError, setShiftError] = useState('');

  useEffect(() => {
    if (tenant) {
      localStorage.setItem(`saas_restaurant_shifts_${tenant}`, JSON.stringify(shifts));
    }
  }, [shifts, tenant]);

  // Thêm ca làm việc mới
  const handleAddShift = (e) => {
    e.preventDefault();
    setShiftError('');
    if (!newShiftName.trim()) {
      setShiftError('Vui lòng nhập tên ca!');
      return;
    }
    if (newStartHour >= newEndHour) {
      setShiftError('Giờ bắt đầu phải nhỏ hơn giờ kết thúc!');
      return;
    }
    // Tránh trùng khoảng giờ hoặc trùng tên ca nếu muốn kiểm tra, ở đây cho tạo tự do
    const newShift = {
      id: `shift-${Date.now()}`,
      name: newShiftName.trim(),
      startHour: Number(newStartHour),
      endHour: Number(newEndHour)
    };
    setShifts([...shifts, newShift]);
    setNewShiftName('');
  };

  // Xóa ca làm việc
  const handleDeleteShift = (id) => {
    if (shifts.length <= 1) {
      alert('Hệ thống yêu cầu có ít nhất 1 ca làm việc để hiển thị biểu đồ!');
      return;
    }
    setShifts(shifts.filter(s => s.id !== id));
  };

  // --- STATE SỔ XUỐNG XẾP HẠNG MÓN ĂN ---
  const [isTopProductsOpen, setIsTopProductsOpen] = useState(false);

  // 1. Tính toán số liệu thống kê tài chính thời gian thực từ lịch sử đơn hàng
  const stats = useMemo(() => {
    // Tổng doanh thu hôm nay
    const revenue = ordersHistory.reduce((acc, order) => acc + order.amount, 0);
    
    // Tạo bản đồ tra cứu giá vốn từ thực đơn
    const costMap = {};
    menuItems.forEach(item => {
      costMap[item.name.toLowerCase()] = item.costPrice;
    });
    
    // Tính tổng giá vốn cho toàn bộ sản phẩm đã bán hôm nay
    let totalCost = 0;
    ordersHistory.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const cost = costMap[item.name.toLowerCase()] || (item.price * 0.4);
          totalCost += cost * item.quantity;
        });
      }
    });

    // Lợi nhuận gộp hôm nay
    const grossProfit = revenue - totalCost;

    // Tính điểm hòa vốn dựa trên định phí ngày mặc định = 450,000 VND
    const dailyFixedCost = 450000;
    const cmRatio = revenue > 0 ? (grossProfit / revenue) : 0.60;
    const breakEvenPoint = cmRatio > 0 ? Math.round(dailyFixedCost / cmRatio) : 750000;
    const breakEvenPercent = breakEvenPoint > 0 ? Math.min(100, Math.round((revenue / breakEvenPoint) * 100)) : 0;

    // Tổng số đơn hàng đã bán
    const totalOrders = ordersHistory.length;

    // Tổng hợp sản lượng gọi món
    const itemCounts = {};
    ordersHistory.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          itemCounts[item.name] = (itemCounts[item.name] || 0) + item.quantity;
        });
      }
    });

    let topProduct = 'Chưa có dữ liệu';
    let topProductQty = 0;
    
    Object.entries(itemCounts).forEach(([name, qty]) => {
      if (qty > topProductQty) {
        topProduct = name;
        topProductQty = qty;
      }
    });

    // Sắp xếp các món ăn bán ra theo thứ tự giảm dần
    const sortedProducts = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1]);

    return {
      revenue,
      grossProfit,
      breakEvenPoint,
      breakEvenPercent,
      totalOrders,
      topProduct,
      topProductQty,
      sortedProducts
    };
  }, [ordersHistory, menuItems]);

  // Tính toán chỉ tiêu lợi nhuận dựa trên Vốn ban đầu nhập vào
  const targetProfit = Math.round((Number(initialCapital) || 0) * ((Number(targetProfitRate) || 0) / 100));
  const targetProgress = targetProfit > 0 ? Math.min(100, Math.round((stats.grossProfit / targetProfit) * 100)) : 0;

  // 2. Tính toán doanh thu theo từng CA làm việc tùy chọn để vẽ biểu đồ
  const chartData = useMemo(() => {
    // Sắp xếp các ca theo giờ bắt đầu tăng dần để vẽ cột biểu đồ theo trật tự thời gian
    const sortedShifts = [...shifts].sort((a, b) => a.startHour - b.startHour);

    const shiftData = sortedShifts.map(shift => ({
      label: shift.name,
      hours: `${String(shift.startHour).padStart(2, '0')}:00 - ${String(shift.endHour).padStart(2, '0')}:00`,
      amount: 0,
      id: shift.id
    }));

    ordersHistory.forEach((order) => {
      const orderDate = new Date(order.timestamp);
      const hour = orderDate.getHours();

      sortedShifts.forEach((shift, index) => {
        if (hour >= shift.startHour && hour < shift.endHour) {
          shiftData[index].amount += order.amount;
        }
      });
    });

    const maxAmount = Math.max(...shiftData.map((s) => s.amount), 100000);

    return shiftData.map((slot) => ({
      ...slot,
      percentage: Math.min(100, (slot.amount / maxAmount) * 100)
    }));
  }, [ordersHistory, shifts]);

  // 3. Lọc và tổng hợp thống kê chi tiết các loại đồ uống bán ra hôm nay
  const drinkSales = useMemo(() => {
    const drinkMap = {};
    
    const drinkNames = new Set(
      menuItems
        .filter(item => item.category === 'Nước uống')
        .map(item => item.name.toLowerCase())
    );

    ordersHistory.forEach(order => {
      if (order.items) {
        order.items.forEach(item => {
          const itemName = item.name;
          const isDrink = drinkNames.has(itemName.toLowerCase()) || 
                          itemName.toLowerCase().includes('trà') || 
                          itemName.toLowerCase().includes('cà phê') ||
                          itemName.toLowerCase().includes('nước') ||
                          itemName.toLowerCase().includes('sữa') ||
                          itemName.toLowerCase().includes('soda') ||
                          itemName.toLowerCase().includes('pepsi') ||
                          itemName.toLowerCase().includes('coca');

          if (isDrink) {
            if (!drinkMap[itemName]) {
              const foundMenu = menuItems.find(m => m.name.toLowerCase() === itemName.toLowerCase());
              const price = foundMenu ? foundMenu.sellingPrice : item.price;
              const cost = foundMenu ? foundMenu.costPrice : (price * 0.4);

              drinkMap[itemName] = {
                name: itemName,
                quantity: 0,
                price: price,
                cost: cost,
                revenue: 0,
                profit: 0
              };
            }
            
            drinkMap[itemName].quantity += item.quantity;
            drinkMap[itemName].revenue += item.price * item.quantity;
          }
        });
      }
    });

    return Object.values(drinkMap).map(drink => {
      const totalCost = drink.cost * drink.quantity;
      return {
        ...drink,
        profit: drink.revenue - totalCost
      };
    }).sort((a, b) => b.quantity - a.quantity);
  }, [ordersHistory, menuItems]);

  // Định dạng tiền tệ
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
  };

  return (
    <div className={styles.container}>
      {/* Header Dashboard */}
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Tổng quan kinh doanh</h2>
          <span className={styles.subtitle}>Cập nhật thời gian thực kết quả bán hàng trong ngày</span>
        </div>
        <div className={styles.dateBadge}>
          <span>Hôm nay: {new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Cấu hình Vốn ban đầu và Mục tiêu lợi nhuận của Quán */}
      <div className={`${styles.goalsConfigPanel} glass-panel`}>
        <div className={styles.goalsHeader}>
          <div className={styles.goalsTitleWrapper}>
            <Activity size={18} className={styles.goalsTitleIcon} />
            <h5>Thiết lập Vốn & Mục tiêu Lợi nhuận cần đạt</h5>
          </div>
          <span className={styles.goalsSubtitle}>
            Tùy biến vốn đầu tư ban đầu và chỉ tiêu sinh lời để hệ thống tính toán hiệu suất tài chính tức thì
          </span>
        </div>

        <div className={styles.goalsContent}>
          <div className={styles.inputsRow}>
            <div className={styles.inputGroup}>
              <label>Vốn đầu tư ban đầu hôm nay (VND):</label>
              <input
                type="number"
                min="0"
                step="50000"
                value={initialCapital}
                onChange={(e) => {
                  const val = e.target.value;
                  setInitialCapital(val === "" ? "" : Math.max(0, Number(val)));
                }}
                placeholder="Nhập số vốn..."
                className={styles.capitalInput}
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Tỷ suất lợi nhuận mong muốn (%):</label>
              <input
                type="number"
                min="0"
                max="200"
                value={targetProfitRate}
                onChange={(e) => {
                  const val = e.target.value;
                  setTargetProfitRate(val === "" ? "" : Math.max(0, Number(val)));
                }}
                placeholder="Ví dụ: 30%"
                className={styles.capitalInput}
              />
            </div>

            <div className={styles.goalsCalculatedRow}>
              <div className={styles.calculatedItem}>
                <span className={styles.calcLabel}>Lợi nhuận cần đạt (Mục tiêu):</span>
                <span className={styles.calcValueBlue}>{formatCurrency(targetProfit)}</span>
              </div>
              <div className={styles.calculatedItem}>
                <span className={styles.calcLabel}>Lợi nhuận thực tế hiện tại:</span>
                <span className={`${styles.calcValue} ${stats.grossProfit >= targetProfit ? styles.profitSuccess : styles.profitPending}`}>
                  {formatCurrency(stats.grossProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Thanh Tiến độ mục tiêu sinh lời */}
          <div className={styles.progressBarWrapper}>
            <div className={styles.progressLabelRow}>
              <span>Tiến độ hoàn thành chỉ tiêu lợi nhuận hôm nay</span>
              <span className={styles.progressPercent}>{targetProgress}%</span>
            </div>
            <div className={styles.progressBarContainer}>
              <div 
                className={`${styles.progressBarFill} ${stats.grossProfit >= targetProfit ? styles.progressSuccessFill : ''}`} 
                style={{ width: `${targetProgress}%` }} 
              />
            </div>
            <span className={styles.progressNote}>
              {stats.grossProfit >= targetProfit 
                ? '🎉 Tuyệt vời! Cửa hàng đã xuất sắc hoàn thành mục tiêu lợi nhuận cần đạt hôm nay!'
                : `Còn thiếu ${formatCurrency(Math.max(0, targetProfit - stats.grossProfit))} lợi nhuận để đạt chỉ tiêu`
              }
            </span>
          </div>
        </div>
      </div>

      {/* Cấu hình tài khoản ngân hàng nhận tiền (VietQR) */}
      <div className={`${styles.goalsConfigPanel} glass-panel`} style={{ marginTop: '20px', marginBottom: '20px' }}>
        <div className={styles.goalsHeader}>
          <div className={styles.goalsTitleWrapper}>
            <Settings size={18} className={styles.goalsTitleIcon} style={{ color: 'var(--primary-color)' }} />
            <h5>Cấu hình Tài khoản Ngân hàng nhận tiền (VietQR)</h5>
          </div>
          <span className={styles.goalsSubtitle}>
            Thiết lập thông tin tài khoản ngân hàng của cửa hàng để hệ thống tự động tạo mã QR Banking đi kèm số tiền chính xác khi thanh toán
          </span>
        </div>

        <div className={styles.goalsContent}>
          <div className={styles.inputsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', width: '100%' }}>
            <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
              <label>Ngân hàng nhận (Mã VietQR):</label>
              <select
                value={bankId}
                onChange={(e) => setBankId(e.target.value)}
                className={styles.capitalInput}
                style={{ width: '100%' }}
              >
                <option value="">-- Chưa chọn ngân hàng --</option>
                <option value="custom">-- Tự thêm ngân hàng --</option>
                <option value="tpb">TPBank (Tiên Phong)</option>
                <option value="vcb">Vietcombank (Ngoại Thương)</option>
                <option value="mb">MBBank (Quân Đội)</option>
                <option value="tcb">Techcombank (Kỹ Thương)</option>
                <option value="acb">ACB (Á Châu)</option>
                <option value="bidv">BIDV (Đầu Tư & Phát Triển)</option>
                <option value="vietinbank">Vietinbank (Công Thương)</option>
                <option value="vpb">VPBank (Việt Nam Thịnh Vượng)</option>
              </select>

              {bankId === 'custom' && (
                <div style={{ marginTop: '10px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Tên ngân hàng tự thêm:</label>
                  <input
                    type="text"
                    value={customBank}
                    onChange={(e) => setCustomBank(e.target.value)}
                    placeholder="Ví dụ: SHB, DongABank, Momo..."
                    className={styles.capitalInput}
                    style={{ width: '100%', marginTop: '4px' }}
                  />
                </div>
              )}
            </div>
            
            <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
              <label>Số tài khoản nhận tiền:</label>
              <input
                type="text"
                value={bankAccountNo}
                onChange={(e) => setBankAccountNo(e.target.value.replace(/\s+/g, ''))}
                placeholder="Nhập số tài khoản..."
                className={styles.capitalInput}
                style={{ width: '100%' }}
              />
            </div>

            <div className={styles.inputGroup} style={{ marginBottom: 0 }}>
              <label>Tên chủ tài khoản (VIẾT HOA KHÔNG DẤU):</label>
              <input
                type="text"
                value={bankAccountName}
                onChange={(e) => setBankAccountName(e.target.value.toUpperCase())}
                placeholder="Ví dụ: NGUYEN VAN A..."
                className={styles.capitalInput}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Nút lưu thủ công */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
            <button
              type="button"
              onClick={handleSaveBankConfig}
              style={{
                padding: '10px 24px',
                backgroundColor: 'var(--primary-color)',
                color: '#ffffff',
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 12px var(--primary-glow)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s'
              }}
            >
              Lưu cấu hình nhận tiền
            </button>
          </div>
        </div>
      </div>

      {/* Grid 4 thẻ chỉ số */}
      <div className={styles.statsGrid}>
        {/* Card 1: Doanh thu */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={`${styles.cardIconWrapper} ${styles.iconBgBlue}`}>
            <DollarSign size={24} className={styles.cardIcon} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Doanh thu hôm nay</span>
            <h3 className={styles.cardValue}>{formatCurrency(stats.revenue)}</h3>
            <div className={styles.trendRow}>
              <TrendingUp size={14} className={styles.trendIcon} />
              <span className={styles.trendText}>+12.4% so với hôm qua</span>
            </div>
          </div>
          <div className={styles.cardCornerGlow} />
        </div>

        {/* Card 2: Lợi nhuận gộp hôm nay */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={`${styles.cardIconWrapper} ${styles.iconBgGreen}`}>
            <Activity size={24} className={styles.cardIcon} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Lợi nhuận gộp hôm nay</span>
            <h3 className={styles.cardValue} style={{ color: 'var(--success-color)' }}>
              {formatCurrency(stats.grossProfit)}
            </h3>
            <div className={styles.trendRow}>
              <TrendingUp size={14} className={styles.trendIcon} />
              <span className={styles.trendText}>Tỷ suất: {stats.revenue > 0 ? Math.round((stats.grossProfit / stats.revenue) * 100) : 60}%</span>
            </div>
          </div>
          <div className={styles.cardCornerGlow} />
        </div>

        {/* Card 3: Điểm hòa vốn hôm nay */}
        <div className={`${styles.statCard} glass-panel`}>
          <div className={`${styles.cardIconWrapper} ${styles.iconBgOrange}`}>
            <Target size={24} className={styles.cardIcon} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel}>Điểm hòa vốn hôm nay</span>
            <h3 className={styles.cardValue} style={{ color: 'var(--warning-color)' }}>
              {formatCurrency(stats.breakEvenPoint)}
            </h3>
            <div className={styles.trendRow}>
              <TrendingUp size={14} className={styles.trendIcon} />
              <span className={styles.trendText}>
                {stats.revenue >= stats.breakEvenPoint ? 'Đã hòa vốn & Có lãi!' : `Đạt ${stats.breakEvenPercent}% điểm hòa vốn`}
              </span>
            </div>
          </div>
          <div className={styles.cardCornerGlow} />
        </div>

        {/* Card 4: Món ăn bán chạy nhất - CLICK ĐỂ SỔ XUỐNG DÒNG MÓN GIẢM DẦN */}
        <div 
          className={`${styles.statCard} glass-panel ${styles.clickableCard} ${isTopProductsOpen ? styles.cardExpanded : ''}`}
          onClick={() => setIsTopProductsOpen(!isTopProductsOpen)}
          title="Click để xem bảng xếp hạng món ăn bán chạy hôm nay"
        >
          <div className={`${styles.cardIconWrapper} ${styles.iconBgTeal}`}>
            <Award size={24} className={styles.cardIcon} />
          </div>
          <div className={styles.cardContent}>
            <span className={styles.cardLabel} style={{ color: 'var(--primary-color)', cursor: 'pointer' }}>
              Món bán chạy nhất (Click xem xếp hạng)
            </span>
            <h3 className={`${styles.cardValue} ${styles.cardValueSmall}`} title={stats.topProduct}>
              {stats.topProduct}
            </h3>
            <div className={styles.trendRow}>
              <span className={styles.trendText}>
                {stats.topProductQty > 0 ? `Đã bán ${stats.topProductQty} phần` : 'Đang chờ đơn hàng'}
              </span>
            </div>

            {/* Panel sổ xuống xếp hạng giảm dần */}
            {isTopProductsOpen && (
              <div className={styles.topProductsDropdown} onClick={(e) => e.stopPropagation()}>
                <hr className={styles.popoverDivider} />
                <span className={styles.dropdownTitle}>Xếp hạng gọi món hôm nay:</span>
                <div className={styles.dropdownList}>
                  {stats.sortedProducts.length > 0 ? (
                    stats.sortedProducts.map(([name, qty], index) => (
                      <div key={name} className={styles.dropdownItem}>
                        <span className={styles.itemRank}>#{index + 1}</span>
                        <span className={styles.itemNameText} title={name}>{name}</span>
                        <span className={styles.itemQtyValue}>{qty} phần</span>
                      </div>
                    ))
                  ) : (
                    <span className={styles.emptyDropdownText}>Chưa có dữ liệu gọi món hôm nay</span>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className={styles.cardCornerGlow} />
        </div>
      </div>

      {/* Biểu đồ & Lịch sử giao dịch */}
      <div className={styles.chartsGrid}>
        {/* Biểu đồ doanh thu theo CA làm việc tự cấu hình */}
        <div className={`${styles.chartCard} glass-panel`}>
          <div className={styles.chartHeader}>
            <div className={styles.chartTitleArea}>
              <h4>Doanh thu theo ca làm việc</h4>
              <button 
                className={`${styles.shiftSettingsToggle} ${isShiftConfigOpen ? styles.shiftSettingsToggleActive : ''}`}
                onClick={() => setIsShiftConfigOpen(!isShiftConfigOpen)}
                title="Cấu hình khoảng thời gian các ca làm việc"
              >
                <Settings size={13} />
                <span>Cấu hình Ca</span>
              </button>
            </div>
            <span className={styles.chartSubtitle}>Phân tích doanh thu dựa trên thời gian làm việc tự setup của quán</span>
          </div>

          {/* Form cấu hình ca tự setup sổ xuống bên trong */}
          {isShiftConfigOpen && (
            <div className={`${styles.shiftConfigPanel} glass-panel`}>
              <h5 className={styles.configPanelTitle}>Thiết lập Ca làm việc tùy chỉnh</h5>
              <div className={styles.shiftList}>
                {shifts.map((s) => (
                  <div key={s.id} className={styles.shiftItemConfig}>
                    <span className={styles.shiftNameLabel}>{s.name}</span>
                    <span className={styles.shiftHoursLabel}>
                      {String(s.startHour).padStart(2, '0')}:00 - {String(s.endHour).padStart(2, '0')}:00
                    </span>
                    <button 
                      type="button" 
                      className={styles.deleteShiftBtn}
                      onClick={() => handleDeleteShift(s.id)}
                      title={`Xóa ${s.name}`}
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={handleAddShift} className={styles.addShiftForm}>
                <h6>Thêm ca làm việc mới</h6>
                <div className={styles.addShiftInputs}>
                  <input
                    type="text"
                    placeholder="Tên ca (Ví dụ: Ca Khuya)"
                    value={newShiftName}
                    onChange={(e) => setNewShiftName(e.target.value)}
                    className={styles.shiftNameInput}
                  />
                  <div className={styles.hourSelects}>
                    <div className={styles.hourInputGroup}>
                      <label>Từ:</label>
                      <select 
                        value={newStartHour} 
                        onChange={(e) => setNewStartHour(Number(e.target.value))}
                        className={styles.hourSelect}
                      >
                        {Array.from({ length: 25 }, (_, h) => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div className={styles.hourInputGroup}>
                      <label>Đến:</label>
                      <select 
                        value={newEndHour} 
                        onChange={(e) => setNewEndHour(Number(e.target.value))}
                        className={styles.hourSelect}
                      >
                        {Array.from({ length: 25 }, (_, h) => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button type="submit" className={styles.addShiftSubmitBtn}>
                    <Plus size={12} />
                    <span>Thêm ca</span>
                  </button>
                </div>
                {shiftError && <span className={styles.shiftErrorText}>{shiftError}</span>}
              </form>
            </div>
          )}

          <div className={styles.chartVisualWrapper}>
            <div className={styles.chartArea}>
              {chartData.map((slot) => (
                <div key={slot.label} className={styles.chartColumnWrapper}>
                  {/* Số tiền hiển thị trực tiếp trên đỉnh cột */}
                  <span className={styles.columnTopAmount}>
                    {slot.amount > 0 ? formatCurrency(slot.amount).replace(' ₫', 'đ') : ''}
                  </span>
                  
                  {/* Cột dữ liệu */}
                  <div className={styles.chartColumnContainer}>
                    <div 
                      className={styles.chartColumn} 
                      style={{ height: `${slot.percentage}%` }}
                    >
                      {/* Tooltip nhỏ khi hover */}
                      <span className={styles.columnTooltip}>
                        {formatCurrency(slot.amount)}
                        <br />
                        <span style={{ fontSize: '9px', opacity: 0.8 }}>({slot.hours})</span>
                      </span>
                    </div>
                  </div>
                  {/* Nhãn ca làm việc */}
                  <span className={styles.columnLabel} title={slot.hours}>
                    <span className={styles.columnNameText}>{slot.label}</span>
                    <span className={styles.columnHoursSub}>{slot.hours}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bảng đơn hàng gần đây */}
        <div className={`${styles.recentOrdersCard} glass-panel`}>
          <div className={styles.chartHeader}>
            <h4>Hóa đơn vừa thanh toán</h4>
            <span className={styles.chartSubtitle}>Lịch sử giao dịch trực tuyến từ POS</span>
          </div>
          
          <div className={styles.ordersList}>
            {ordersHistory.length > 0 ? (
              ordersHistory.slice(0, 4).map((order) => (
                <div key={order.orderId} className={styles.orderItem}>
                  <div className={styles.orderInfo}>
                    <span className={styles.orderIdText}>{order.orderId}</span>
                    <span className={styles.orderTimeText}>
                      {new Date(order.timestamp).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className={styles.orderItemsCount}>
                    <span>{order.itemsCount} món</span>
                  </div>
                  <div className={styles.orderAmount}>
                    <span>{formatCurrency(order.amount)}</span>
                  </div>
                  <div className={styles.successStatusDot} />
                </div>
              ))
            ) : (
              <div className={styles.emptyOrdersState}>
                <span>Chưa có giao dịch nào được thực hiện.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bảng Thống kê Nước uống - SỐ LƯỢNG VÀ ĐƠN VỊ CHIA LÀM 2 CỘT RIÊNG BIỆT */}
      <div className={`${styles.drinkCard} glass-panel`}>
        <div className={styles.chartHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coffee size={20} className={styles.titleIcon} style={{ color: 'var(--primary-color)' }} />
            <h4 style={{ margin: 0 }}>Thống kê Đồ uống & Nước uống bán được trong ngày</h4>
          </div>
          <span className={styles.chartSubtitle}>Phân tích chi tiết số lượng bán lẻ, doanh thu, giá vốn và lợi nhuận gộp thực tế của từng đồ uống</span>
        </div>

        <div className={styles.tableWrapper}>
          {drinkSales.length > 0 ? (
            <table className={styles.drinkTable}>
              <thead>
                <tr>
                  <th>Tên đồ uống</th>
                  <th>Số lượng</th>
                  <th>Đơn vị</th>
                  <th>Đơn giá bán</th>
                  <th>Doanh thu đồ uống</th>
                  <th>Giá vốn ước tính</th>
                  <th style={{ color: 'var(--success-color)' }}>Lợi nhuận gộp nước</th>
                  <th>Tỷ suất lợi nhuận</th>
                  <th>Hiệu suất bán</th>
                </tr>
              </thead>
              <tbody>
                {drinkSales.map((drink) => {
                  const profitMargin = drink.revenue > 0 ? Math.round((drink.profit / drink.revenue) * 100) : 0;
                  const totalCost = drink.cost * drink.quantity;
                  return (
                    <tr key={drink.name}>
                      <td className={styles.drinkNameColumn}>{drink.name}</td>
                      <td className={styles.qtyColumn}>{drink.quantity}</td>
                      <td className={styles.unitColumn}>ly/lon</td>
                      <td className={styles.numericColumn}>{formatCurrency(drink.price)}</td>
                      <td className={styles.numericColumn}>{formatCurrency(drink.revenue)}</td>
                      <td className={styles.numericColumn}>{formatCurrency(totalCost)}</td>
                      <td className={`${styles.numericColumn} ${styles.profitText}`}>{formatCurrency(drink.profit)}</td>
                      <td>
                        <span className={styles.marginBadge}>
                          {profitMargin}%
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.statusBadge} ${
                          drink.quantity >= 3 ? styles.badgeHigh : styles.badgeNormal
                        }`}>
                          {drink.quantity >= 3 ? 'Bán chạy' : 'Bình thường'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyTableState}>
              <span>Hôm nay chưa bán được loại đồ uống hay nước giải khát nào từ POS.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
