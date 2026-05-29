import React from 'react';
import styles from './Input.module.css';

// Component Input dùng chung hỗ trợ nhãn, thông báo lỗi và icon đi kèm
export const Input = ({
  label,
  error,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  fullWidth = false,
  className = '',
  icon: Icon,
  required = false,
  ...props
}) => {
  const containerClasses = [
    styles.container,
    fullWidth ? styles.fullWidth : '',
    className
  ].filter(Boolean).join(' ');

  const inputWrapperClasses = [
    styles.inputWrapper,
    error ? styles.inputErrorBorder : '',
    disabled ? styles.disabled : ''
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {label && (
        <label className={styles.label}>
          {label} {required && <span className={styles.required}>*</span>}
        </label>
      )}
      <div className={inputWrapperClasses}>
        {Icon && <Icon size={18} className={styles.icon} />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={styles.inputField}
          required={required}
          {...props}
        />
      </div>
      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};
