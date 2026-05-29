import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import styles from './Modal.module.css';

// Component Modal dùng chung có hiệu ứng mở ra mượt mà và nền kính mờ
export const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'medium', // small | medium | large | xlarge
  closeOnOverlayClick = true
}) => {
  // Khóa cuộn trang khi modal đang mở
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalClasses = [
    styles.modal,
    styles[size]
  ].join(' ');

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={modalClasses}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>
        <div className={styles.body}>
          {children}
        </div>
      </div>
    </div>
  );
};
