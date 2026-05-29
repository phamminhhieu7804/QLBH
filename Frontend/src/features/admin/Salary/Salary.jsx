import React, { useContext, useState, useEffect } from 'react';
import { DollarSign, ShieldAlert, BadgeInfo, Calendar, Save, Calculator, Sparkles, Clock } from 'lucide-react';
import { TenantContext } from '../../../context/TenantContext';
import styles from './Salary.module.css';

export const Salary = () => {
  const { tenant, registeredUsers, updateStaffDetails } = useContext(TenantContext);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [saveStatus, setSaveStatus] = useState({});
  const [allowedLateTime, setAllowedLateTime] = useState('08:05');

  // Tải danh sách chấm công để tính giờ
  useEffect(() => {
    if (tenant) {
      const saved = localStorage.getItem(`restaurant_attendance_${tenant}`);
      setAttendanceRecords(saved ? JSON.parse(saved) : []);
      const savedLate = localStorage.getItem(`restaurant_late_time_${tenant}`);
      if (savedLate) {
        setAllowedLateTime(savedLate);
      }
    }
  }, [tenant]);

  const handleLateTimeChange = (val) => {
    setAllowedLateTime(val);
    if (tenant) {
      localStorage.setItem(`restaurant_late_time_${tenant}`, val);
    }
  };

  // Lấy danh sách nhân viên của quán hiện tại
  const staffList = (registeredUsers || []).filter((u) => u.tenant === tenant);

  // Tính tổng số giờ làm việc tích lũy của nhân viên
  const calculateTotalHours = (username) => {
    return attendanceRecords
      .filter((rec) => rec.username === username && rec.clockOut)
      .reduce((sum, rec) => sum + (rec.hoursWorked || 0), 0);
  };

  // Tính tổng số lần đi trễ (Clock In sau giờ quy chuẩn)
  const calculateLateCount = (username) => {
    const [allowedH, allowedM] = allowedLateTime.split(':').map(Number);
    return attendanceRecords
      .filter((rec) => rec.username === username && rec.clockIn)
      .filter((rec) => {
        try {
          const [h, m] = rec.clockIn.split(':').map(Number);
          return h > allowedH || (h === allowedH && m > allowedM);
        } catch (e) {
          return false;
        }
      }).length;
  };

  // Kiểm tra xem có phải nhân viên mới không (bắt đầu trong vòng 30 ngày)
  const isNewEmployee = (startDateStr) => {
    if (!startDateStr) return false;
    try {
      const [d, m, y] = startDateStr.split('/').map(Number);
      const start = new Date(y, m - 1, d);
      const diffTime = Math.abs(new Date() - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    } catch (e) {
      return false;
    }
  };

  // Cập nhật thông số lương
  const handleUpdate = (username, field, value) => {
    updateStaffDetails(username, { [field]: value });
    
    // Hiển thị trạng thái lưu thành công tạm thời
    setSaveStatus(prev => ({ ...prev, [`${username}-${field}`]: true }));
    setTimeout(() => {
      setSaveStatus(prev => ({ ...prev, [`${username}-${field}`]: false }));
    }, 1500);
  };

  // Định dạng VND
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  // Tính toán tổng số liệu toàn quán (chỉ áp dụng cho nhân sự, loại trừ chủ quán admin)
  let totalHoursSum = 0;
  let totalLateSum = 0;
  let totalDeductionsSum = 0;
  let totalNetSalarySum = 0;

  staffList.forEach((staff) => {
    if (staff.role !== 'admin') {
      const hours = calculateTotalHours(staff.username);
      const late = calculateLateCount(staff.username);
      const rate = staff.hourlyRate !== undefined ? staff.hourlyRate : 25000;
      const deduction = staff.deduction !== undefined ? Number(staff.deduction) : 0;
      const salary = Math.max(0, (hours * rate) - deduction);

      totalHoursSum += hours;
      totalLateSum += late;
      totalDeductionsSum += deduction;
      totalNetSalarySum += salary;
    }
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Tính lương & Quản lý nhân viên</h2>
          <span className={styles.subtitle}>Thiết lập mức lương giờ, cấu hình ngày thanh toán và tính lương thực lĩnh tự động theo ca làm</span>
        </div>
      </div>

      {/* Cấu hình Giờ Đi Trễ Cho Phép */}
      <div className={`${styles.configLatePanel} glass-panel`}>
        <div className={styles.configHeader}>
          <Clock size={18} className={styles.configIcon} />
          <div>
            <h4>Cấu hình quy chuẩn đi trễ</h4>
            <p>Thiết lập mốc thời gian tối đa được tính là đúng giờ ca sáng (mặc định 08:05)</p>
          </div>
        </div>
        <div className={styles.configBody}>
          <span className={styles.configLabel}>Giờ đi trễ cho phép:</span>
          <input
            type="time"
            value={allowedLateTime}
            onChange={(e) => handleLateTimeChange(e.target.value)}
            className={styles.inputLateTime}
          />
        </div>
      </div>

      <div className={`${styles.payrollCard} glass-panel`}>
        <div className={styles.tableWrapper}>
          {staffList.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Họ và tên</th>
                  <th>Tài khoản</th>
                  <th>Vai trò</th>
                  <th>Ngày vào làm</th>
                  <th>Ngày nhận lương</th>
                  <th>Lương theo giờ (VND)</th>
                  <th>Số giờ làm</th>
                  <th>Đi trễ</th>
                  <th>Trừ lương (VND)</th>
                  <th>Lý do trừ</th>
                  <th style={{ color: 'var(--success-color)' }}>Tổng lương thực lĩnh</th>
                  <th>Lưu ý</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((staff) => {
                  const totalHours = calculateTotalHours(staff.username);
                  const lateCount = calculateLateCount(staff.username);
                  // Tính lương = tổng số giờ làm * mức lương giờ
                  const hourlyRate = staff.hourlyRate !== undefined ? staff.hourlyRate : 25000;
                  const payDay = staff.payDay !== undefined ? staff.payDay : 5;
                  const deduction = staff.deduction !== undefined ? Number(staff.deduction) : 0;
                  const totalSalary = Math.max(0, (totalHours * hourlyRate) - deduction);
                  const isNew = isNewEmployee(staff.startDate);

                  return (
                    <tr key={staff.username}>
                      <td className={styles.nameColumn}>
                        <strong>{staff.fullName || staff.username}</strong>
                        {isNew && (
                          <span className={styles.newBadge}>
                            <Sparkles size={10} />
                            <span>Mới vào</span>
                          </span>
                        )}
                      </td>
                      <td>{staff.username}</td>
                      <td>
                        <span className={`${styles.roleBadge} ${staff.role === 'admin' ? styles.roleAdmin : styles.roleCashier}`}>
                          {staff.role === 'admin' ? 'Chủ quán' : 'Nhân viên'}
                        </span>
                      </td>
                      <td className={styles.dateColumn}>
                        <Calendar size={13} className={styles.tableIcon} />
                        <span>{staff.startDate || 'Chưa rõ'}</span>
                      </td>
                      <td>
                        <div className={styles.inputCell}>
                          <select
                            value={payDay}
                            onChange={(e) => handleUpdate(staff.username, 'payDay', Number(e.target.value))}
                            className={styles.selectPayDay}
                          >
                            {Array.from({ length: 31 }, (_, i) => (
                              <option key={i + 1} value={i + 1}>
                                Ngày {String(i + 1).padStart(2, '0')}
                              </option>
                            ))}
                          </select>
                          {saveStatus[`${staff.username}-payDay`] && (
                            <span className={styles.saveOk}>Lưu ok</span>
                          )}
                        </div>
                      </td>
                      <td>
                        {staff.role === 'admin' ? (
                          <span className={styles.noWage}>Không hưởng lương</span>
                        ) : (
                          <div className={styles.inputCell}>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={hourlyRate}
                              onChange={(e) => handleUpdate(staff.username, 'hourlyRate', Number(e.target.value))}
                              className={styles.inputHourlyRate}
                            />
                            <span className={styles.rateLabel}>đ/h</span>
                            {saveStatus[`${staff.username}-hourlyRate`] && (
                              <span className={styles.saveOk}>Lưu ok</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={styles.hoursColumn}>
                        <strong>{totalHours.toFixed(1)}h</strong>
                      </td>
                      <td>
                        {staff.role === 'admin' ? (
                          <span className={styles.noWage}>---</span>
                        ) : lateCount > 0 ? (
                          <span className={styles.lateBadge}>
                            Trễ {lateCount} lần
                          </span>
                        ) : (
                          <span className={styles.ontimeBadge}>Đúng giờ</span>
                        )}
                      </td>
                      <td>
                        {staff.role === 'admin' ? (
                          <span className={styles.noWage}>---</span>
                        ) : (
                          <div className={styles.inputCell}>
                            <input
                              type="number"
                              min="0"
                              step="1000"
                              value={staff.deduction || 0}
                              onChange={(e) => handleUpdate(staff.username, 'deduction', Number(e.target.value))}
                              className={styles.inputDeduction}
                            />
                            <span className={styles.rateLabel}>đ</span>
                            {saveStatus[`${staff.username}-deduction`] && (
                              <span className={styles.saveOk}>Lưu ok</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        {staff.role === 'admin' ? (
                          <span className={styles.noWage}>---</span>
                        ) : (
                          <div className={styles.inputCell}>
                            <input
                              type="text"
                              placeholder="Lý do..."
                              value={staff.deductionReason || ''}
                              onChange={(e) => handleUpdate(staff.username, 'deductionReason', e.target.value)}
                              className={styles.inputReason}
                            />
                            {saveStatus[`${staff.username}-deductionReason`] && (
                              <span className={styles.saveOk}>Lưu ok</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className={styles.salaryColumn}>
                        {staff.role === 'admin' ? (
                          <span className={styles.noWage}>---</span>
                        ) : (
                          <strong>{formatCurrency(totalSalary)}</strong>
                        )}
                      </td>
                      <td>
                        {staff.role === 'admin' ? (
                          <span className={styles.note}>Quản trị hệ thống</span>
                        ) : (
                          <span className={styles.note}>
                            Ngày nhận lương tiếp theo: {payDay}/{new Date().getMonth() + 2}/{new Date().getFullYear()}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* Hàng Tổng cộng toàn quán */}
                <tr className={styles.totalRow}>
                  <td colSpan={6} className={styles.totalLabelCell}>
                    <strong>Tổng cộng toàn quán</strong>
                  </td>
                  <td className={styles.hoursColumn}>
                    <strong>{totalHoursSum.toFixed(1)}h</strong>
                  </td>
                  <td>
                    <strong className={styles.totalLateText}>{totalLateSum} lần trễ</strong>
                  </td>
                  <td>
                    <strong className={styles.totalDeductionText}>{formatCurrency(totalDeductionsSum)}</strong>
                  </td>
                  <td>---</td>
                  <td className={styles.salaryColumn}>
                    <strong>{formatCurrency(totalNetSalarySum)}</strong>
                  </td>
                  <td>---</td>
                </tr>
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <ShieldAlert size={40} className={styles.emptyIcon} />
              <span>Chưa có thông tin nhân viên nào để hiển thị.</span>
            </div>
          )}
        </div>
      </div>

      {/* Card Hướng dẫn */}
      <div className={`${styles.infoCard} glass-panel`}>
        <BadgeInfo size={20} className={styles.infoIcon} />
        <div className={styles.infoText}>
          <h5>Nguyên lý tính toán tiền lương của Antigravity SaaS</h5>
          <p>
            Tiền lương của nhân viên được tính toán tự động dựa trên thời gian làm việc thực tế (giờ) nhân với mức lương giờ đã setup. 
            Khi nhân viên tiến hành <strong>Clock In</strong> và <strong>Clock Out</strong> tại cổng điều hành sảnh, hệ thống sẽ tự động cập nhật tổng thời gian tích lũy và chuyển đổi sang bảng tiền lương tức thì.
          </p>
        </div>
      </div>
    </div>
  );
};
