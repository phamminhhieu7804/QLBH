import React, { useState, useEffect, useContext } from 'react';
import { Activity, Trash2, Calendar, User, Search, RefreshCw } from 'lucide-react';
import { CartContext } from '../../../context/CartContext';
import styles from './ActivityLog.module.css';

export const ActivityLog = () => {
  const { tenant } = useContext(CartContext);
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Load nhật ký hoạt động từ localStorage
  const loadLogs = () => {
    if (tenant) {
      const saved = localStorage.getItem(`restaurant_activity_log_${tenant}`);
      setLogs(saved ? JSON.parse(saved) : []);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [tenant]);

  // Xóa toàn bộ nhật ký
  const handleClearLogs = () => {
    if (window.confirm('Bạn có chắc chắn muốn XÓA TOÀN BỘ lịch sử nhật ký hoạt động không? Hành động này không thể hoàn tác!')) {
      localStorage.setItem(`restaurant_activity_log_${tenant}`, JSON.stringify([]));
      setLogs([]);
    }
  };

  // Lọc logs
  const filteredLogs = logs.filter(log => {
    const term = searchTerm.toLowerCase();
    return (
      log.user?.toLowerCase().includes(term) ||
      log.action?.toLowerCase().includes(term) ||
      log.details?.toLowerCase().includes(term)
    );
  });

  const getActionBadgeClass = (action) => {
    switch (action) {
      case 'Thanh toán': return styles.badgeSuccess;
      case 'Gọi món': return styles.badgePrimary;
      case 'Xóa món ăn': return styles.badgeDanger;
      case 'Chấm công': return styles.badgePurple;
      case 'Thay đổi số lượng': return styles.badgeWarning;
      case 'Đăng nhập':
      case 'Đăng xuất': return styles.badgeInfo;
      default: return styles.badgeNormal;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Nhật ký hoạt động hệ thống</h2>
          <span className={styles.subtitle}>Ghi nhận toàn bộ thao tác thêm, bớt món, chấm công và thanh toán của nhân viên</span>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.refreshBtn} onClick={loadLogs} title="Làm mới dữ liệu">
            <RefreshCw size={15} />
            <span>Tải lại</span>
          </button>
          {logs.length > 0 && (
            <button className={styles.clearBtn} onClick={handleClearLogs} title="Xóa lịch sử nhật ký">
              <Trash2 size={15} />
              <span>Xóa hết nhật ký</span>
            </button>
          )}
        </div>
      </div>

      {/* Bộ lọc tìm kiếm */}
      <div className={`${styles.filterCard} glass-panel`}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          placeholder="Tìm kiếm theo nhân viên, hành động hoặc nội dung chi tiết..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
      </div>

      {/* Bảng logs */}
      <div className={`${styles.logTableCard} glass-panel`}>
        <div className={styles.tableWrapper}>
          {filteredLogs.length > 0 ? (
            <table className={styles.logTable}>
              <thead>
                <tr>
                  <th>Thời gian</th>
                  <th>Nhân viên</th>
                  <th>Hành động</th>
                  <th>Nội dung chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => {
                  const dateObj = new Date(log.timestamp);
                  const formattedTime = !isNaN(dateObj) 
                    ? `${dateObj.toLocaleDateString('vi-VN')} ${dateObj.toLocaleTimeString('vi-VN')}`
                    : 'Không xác định';

                  return (
                    <tr key={log.id}>
                      <td className={styles.timeColumn}>
                        <Calendar size={13} className={styles.tableIcon} />
                        <span>{formattedTime}</span>
                      </td>
                      <td className={styles.userColumn}>
                        <User size={13} className={styles.tableIcon} />
                        <span>{log.user}</span>
                      </td>
                      <td>
                        <span className={`${styles.actionBadge} ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className={styles.detailsColumn} title={log.details}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className={styles.emptyState}>
              <Activity size={40} className={styles.emptyIcon} />
              <span>Chưa có hoạt động nào được ghi nhận.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
