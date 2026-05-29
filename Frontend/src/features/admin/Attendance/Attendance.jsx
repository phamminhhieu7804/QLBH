import React, { useState, useEffect, useContext } from 'react';
import { Clock, Search, Calendar, User, Trash2, ShieldCheck, PlayCircle } from 'lucide-react';
import { TenantContext } from '../../../context/TenantContext';
import styles from './Attendance.module.css';

export const Attendance = () => {
  const { tenant, registeredUsers } = useContext(TenantContext);
  const [records, setRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [expandedRowId, setExpandedRowId] = useState(null);

  const toggleRow = (id) => {
    setExpandedRowId(expandedRowId === id ? null : id);
  };

  const loadAttendance = () => {
    if (tenant) {
      const saved = localStorage.getItem(`restaurant_attendance_${tenant}`);
      setRecords(saved ? JSON.parse(saved) : []);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [tenant]);

  // Xóa bản ghi chấm công lỗi
  const handleDeleteRecord = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA bản ghi chấm công này không? Dữ liệu tính lương sẽ bị ảnh hưởng!')) {
      const updated = records.filter(rec => rec.id !== id);
      localStorage.setItem(`restaurant_attendance_${tenant}`, JSON.stringify(updated));
      setRecords(updated);
    }
  };

  // Lọc danh sách chấm công
  const filteredRecords = records.filter(rec => {
    const term = searchTerm.toLowerCase();
    const matchesUser = 
      rec.fullName?.toLowerCase().includes(term) || 
      rec.username?.toLowerCase().includes(term);

    // Chuẩn hóa ngày nhập lọc và ngày ghi nhận để so khớp linh hoạt
    const matchesDate = !filterDate || rec.date.includes(filterDate.split('-').reverse().join('/'));

    return matchesUser && matchesDate;
  });

  // Lấy thống kê chấm công trong ngày hôm nay
  const todayStr = new Date().toLocaleDateString('vi-VN');
  const todayRecords = records.filter(rec => rec.date === todayStr);
  const activeStaffCount = todayRecords.filter(rec => !rec.clockOut).length;
  const completedShiftsCount = todayRecords.filter(rec => rec.clockOut).length;
  const totalHoursWorkedToday = todayRecords.filter(rec => rec.clockOut).reduce((sum, rec) => sum + (rec.hoursWorked || 0), 0);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Lịch sử chấm công nhân viên</h2>
          <span className={styles.subtitle}>Quản lý chi tiết giờ làm việc thực tế, thời gian bắt đầu và kết thúc ca làm của nhân sự</span>
        </div>
      </div>

      {/* Khối Chỉ số Thống kê Tổng kết Chấm công trong ngày */}
      <div className={styles.statsRow}>
        <div className={`${styles.statCard} glass-panel`}>
          <div className={`${styles.statIconWrapper} ${styles.iconBgGreen}`}>
            <PlayCircle size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{activeStaffCount} ca làm</span>
            <span className={styles.statLabel}>Đang làm việc trực tiếp</span>
          </div>
        </div>
        <div className={`${styles.statCard} glass-panel`}>
          <div className={`${styles.statIconWrapper} ${styles.iconBgBlue}`}>
            <ShieldCheck size={22} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statVal}>{completedShiftsCount} ca làm</span>
            <span className={styles.statLabel}>Đã hoàn thành hôm nay</span>
          </div>
        </div>
      </div>

      {/* Grid bộ lọc */}
      <div className={`${styles.filterGrid} glass-panel`}>
        <div className={styles.inputWrapper}>
          <Search size={16} className={styles.filterIcon} />
          <input
            type="text"
            placeholder="Tìm theo họ tên, tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.inputWrapper}>
          <Calendar size={16} className={styles.filterIcon} />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className={styles.dateInput}
          />
        </div>
        {filterDate && (
          <button className={styles.resetBtn} onClick={() => setFilterDate('')}>
            Xóa lọc ngày
          </button>
        )}
      </div>

      {/* Bảng chấm công */}
      <div className={`${styles.tableCard} glass-panel`}>
        <div className={styles.tableWrapper}>
          {filteredRecords.length > 0 ? (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nhân viên</th>
                  <th>Tài khoản</th>
                  <th>Ngày làm việc</th>
                  <th>Giờ bắt đầu</th>
                  <th>Giờ kết thúc</th>
                  <th>Tổng giờ làm</th>
                  <th>Trạng thái ca</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec) => {
                  const isExpanded = expandedRowId === rec.id;
                  const staff = (registeredUsers || []).find(u => u.username === rec.username);

                  // Tính tổng giờ làm việc lũy kế của nhân viên này
                  const totalHoursWorked = records
                    .filter(r => r.username === rec.username && r.clockOut)
                    .reduce((sum, r) => sum + (r.hoursWorked || 0), 0);

                  // Tính số lần vi phạm (đi trễ) động
                  const allowedLateTime = localStorage.getItem(`restaurant_late_time_${tenant}`) || '08:05';
                  const [allowedH, allowedM] = allowedLateTime.split(':').map(Number);
                  const userLateCount = records
                    .filter(r => r.username === rec.username && r.clockIn)
                    .filter(r => {
                      try {
                        const [h, m] = r.clockIn.split(':').map(Number);
                        return h > allowedH || (h === allowedH && m > allowedM);
                      } catch (e) {
                        return false;
                      }
                    }).length;

                  const deductionAmount = staff?.deduction || 0;
                  const deductionReason = staff?.deductionReason || 'Không có lý do';

                  return (
                    <React.Fragment key={rec.id}>
                      <tr 
                        className={`${styles.mainRow} ${isExpanded ? styles.expandedRowActive : ''}`}
                        onClick={() => toggleRow(rec.id)}
                        style={{ cursor: 'pointer' }}
                        title="Click để xem chi tiết vi phạm & phạt lương"
                      >
                        <td className={styles.nameColumn}>
                          <User size={13} className={styles.tableIcon} />
                          <strong>{rec.fullName || rec.username}</strong>
                        </td>
                        <td>{rec.username}</td>
                        <td>{rec.date}</td>
                        <td className={styles.timeValue}>{rec.clockIn}</td>
                        <td className={styles.timeValue}>
                          {rec.clockOut || (
                            <span className={styles.workingBadgeSmall}>Đang làm ca</span>
                          )}
                        </td>
                        <td className={styles.hoursValue}>
                          {rec.clockOut ? (
                            <strong>{rec.hoursWorked} giờ</strong>
                          ) : (
                            <span className={styles.runningTime}>Đang tích lũy</span>
                          )}
                        </td>
                        <td>
                          {rec.clockOut ? (
                            <span className={`${styles.statusBadge} ${styles.statusDone}`}>
                              <ShieldCheck size={11} />
                              <span>Hoàn ca</span>
                            </span>
                          ) : (
                            <span className={`${styles.statusBadge} ${styles.statusWorking}`}>
                              <PlayCircle size={11} />
                              <span>Đang làm</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            className={styles.deleteBtn}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRecord(rec.id);
                            }}
                            title="Xóa chấm công"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className={styles.detailRow}>
                          <td colSpan={8}>
                            <div className={styles.expandedDetailContainer}>
                              <div className={styles.detailCard}>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Tổng giờ làm tích lũy:</span>
                                  <strong className={styles.detailValue}>{totalHoursWorked.toFixed(1)} giờ</strong>
                                </div>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Số ca vi phạm đi trễ:</span>
                                  <strong className={`${styles.detailValue} ${userLateCount > 0 ? styles.textRed : styles.textGreen}`}>
                                    {userLateCount} lần
                                  </strong>
                                </div>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Số tiền bị phạt/trừ:</span>
                                  <strong className={`${styles.detailValue} ${deductionAmount > 0 ? styles.textRed : ''}`}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(deductionAmount)}
                                  </strong>
                                </div>
                                <div className={styles.detailItem}>
                                  <span className={styles.detailLabel}>Lý do khấu trừ:</span>
                                  <span className={styles.detailText}>{deductionReason}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <Clock size={40} className={styles.emptyIcon} />
              <span>Chưa có bản ghi chấm công nào khớp bộ lọc tìm kiếm.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
