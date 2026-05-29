import React from 'react';
import styles from './Button.module.css';

// Component Button dùng chung hỗ trợ nhiều giao diện khác nhau
export const Button = ({
  children,
  onClick,
  type = 'button',
  variant = 'primary', // primary | secondary | danger | outline | glass
  size = 'medium',     // small | medium | large
  disabled = false,
  fullWidth = false,
  className = '',
  icon: Icon,          // Cho phép truyền vào icon component từ Lucide
  ...props
}) => {
  const buttonClasses = [
    styles.btn,
    styles[variant],
    styles[size],
    fullWidth ? styles.fullWidth : '',
    disabled ? styles.disabled : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {Icon && <Icon size={size === 'small' ? 14 : size === 'large' ? 20 : 16} className={styles.icon} />}
      {children}
    </button>
  );
};
