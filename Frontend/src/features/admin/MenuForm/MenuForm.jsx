import React, { useState, useEffect, useRef, useContext } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { TenantContext } from '../../../context/TenantContext';
import { Button } from '../../../components/Button/Button';
import { Input } from '../../../components/Input/Input';
import styles from './MenuForm.module.css';

// Form Thêm/Sửa món ăn dạng nâng cao với xem trước ảnh tức thì
export const MenuForm = ({ item, onSave, onClose }) => {
  const isEdit = !!item;
  const fileInputRef = useRef(null);
  const { tenant } = useContext(TenantContext);

  // Khởi tạo các trường dữ liệu
  const [name, setName] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [category, setCategory] = useState('Món chính');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('active');

  // Lỗi nhập liệu
  const [errors, setErrors] = useState({});

  // Quản lý danh mục động
  const [categoriesList, setCategoriesList] = useState(() => {
    if (tenant) {
      const saved = localStorage.getItem(`restaurant_categories_${tenant}`);
      return saved ? JSON.parse(saved) : ['Món chính', 'Nước uống', 'Ăn vặt', 'Tráng miệng'];
    }
    return ['Món chính', 'Nước uống', 'Ăn vặt', 'Tráng miệng'];
  });

  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  useEffect(() => {
    if (tenant) {
      const saved = localStorage.getItem(`restaurant_categories_${tenant}`);
      if (saved) {
        setCategoriesList(JSON.parse(saved));
      }
    }
  }, [tenant]);

  const saveNewCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    if (categoriesList.includes(trimmed)) {
      alert('Danh mục này đã tồn tại!');
      return;
    }
    const updated = [...categoriesList, trimmed];
    setCategoriesList(updated);
    if (tenant) {
      localStorage.setItem(`restaurant_categories_${tenant}`, JSON.stringify(updated));
    }
    setCategory(trimmed); // Tự động chọn danh mục vừa tạo
    setNewCategoryName('');
    setIsAddingCategory(false);
  };

  const deleteSelectedCategory = () => {
    if (categoriesList.length <= 1) {
      alert('Phải có ít nhất một danh mục!');
      return;
    }
    if (window.confirm(`Bạn có chắc chắn muốn xóa danh mục "${category}"?`)) {
      const updated = categoriesList.filter(cat => cat !== category);
      setCategoriesList(updated);
      if (tenant) {
        localStorage.setItem(`restaurant_categories_${tenant}`, JSON.stringify(updated));
      }
      setCategory(updated[0]); // Chọn danh mục đầu tiên trong danh sách còn lại
    }
  };

  // Điền dữ liệu cũ nếu ở chế độ sửa
  useEffect(() => {
    if (isEdit && item) {
      setName(item.name || '');
      setSellingPrice(item.sellingPrice || '');
      setCostPrice(item.costPrice || '');
      setCategory(item.category || 'Món chính');
      setImage(item.image || '');
      setDescription(item.description || '');
      setStatus(item.status || 'active');
    }
  }, [isEdit, item]);

  // Xử lý upload ảnh (Chuyển đổi thành Base64 Data URL để lưu trữ vĩnh viễn vào Backend Database)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Chuỗi Base64 Data URL đầy đủ
      };
      reader.readAsDataURL(file);
    }
  };

  // Click vào vùng camera sẽ mở trình chọn file hệ thống
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  // Xác thực dữ liệu
  const validateForm = () => {
    const newErrors = {};
    if (!name.trim()) newErrors.name = 'Tên món ăn không được để trống';
    if (!sellingPrice || Number(sellingPrice) <= 0) {
      newErrors.sellingPrice = 'Giá bán phải lớn hơn 0';
    }
    if (!costPrice || Number(costPrice) <= 0) {
      newErrors.costPrice = 'Giá vốn phải lớn hơn 0';
    }
    if (Number(costPrice) > Number(sellingPrice)) {
      newErrors.sellingPrice = 'Cảnh báo: Giá bán đang nhỏ hơn giá vốn!';
    }
    if (!image) {
      newErrors.image = 'Hãy tải ảnh lên hoặc dán liên kết hình ảnh';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Nộp form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const savedData = {
      ...(isEdit ? { id: item.id } : {}),
      name: name.trim(),
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
      category,
      image,
      description: description.trim(),
      status
    };

    onSave(savedData);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Vùng Upload / Xem trước ảnh */}
      <div className={styles.imageSection}>
        <div 
          className={`${styles.imagePreviewContainer} ${errors.image ? styles.imageError : ''}`}
          onClick={triggerFileInput}
        >
          {image ? (
            <>
              <img src={image} alt="Xem trước món ăn" className={styles.previewImage} />
              <div className={styles.imageOverlay}>
                <RefreshCw size={24} className={styles.overlayIcon} />
                <span>Thay đổi ảnh</span>
              </div>
            </>
          ) : (
            <div className={styles.uploadPlaceholder}>
              <Camera size={32} className={styles.uploadIcon} />
              <span className={styles.uploadText}>Tải ảnh món ăn</span>
              <span className={styles.uploadSubText}>Hỗ trợ JPG, PNG, WEBP</span>
            </div>
          )}
        </div>
        
        {/* Nút dán liên kết URL ảnh ngoài */}
        <div className={styles.urlInputContainer}>
          <input
            type="text"
            placeholder="Hoặc dán URL ảnh trực tiếp..."
            value={image.startsWith('blob:') ? '' : image}
            onChange={(e) => setImage(e.target.value)}
            className={styles.urlInput}
          />
        </div>
        {errors.image && <span className={styles.errorText}>{errors.image}</span>}
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleImageChange}
          className={styles.hiddenFileInput}
        />
      </div>

      {/* Vùng thông tin văn bản */}
      <div className={styles.formFields}>
        <Input
          label="Tên món ăn"
          placeholder="Ví dụ: Phở Bò Tái Lăn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          required
          fullWidth
        />

        <div className={styles.priceRow}>
          <Input
            label="Giá bán (VND)"
            type="number"
            placeholder="Ví dụ: 65000"
            value={sellingPrice}
            onChange={(e) => setSellingPrice(e.target.value)}
            error={errors.sellingPrice}
            required
            fullWidth
          />
          <Input
            label="Giá vốn (VND)"
            type="number"
            placeholder="Ví dụ: 25000"
            value={costPrice}
            onChange={(e) => setCostPrice(e.target.value)}
            error={errors.costPrice}
            required
            fullWidth
          />
        </div>

        <div className={styles.categoryStatusRow}>
          <div className={styles.selectContainer}>
            <div className={styles.categoryHeader}>
              <label className={styles.selectLabel}>Danh mục</label>
              {!isAddingCategory && (
                <div className={styles.categoryActionButtons}>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className={styles.catActionBtn}
                    title="Thêm danh mục mới"
                  >
                    Thêm mới
                  </button>
                  {categoriesList.length > 1 && (
                    <button
                      type="button"
                      onClick={deleteSelectedCategory}
                      className={`${styles.catActionBtn} ${styles.catDeleteBtn}`}
                      title="Xóa danh mục hiện tại"
                    >
                      Xóa
                    </button>
                  )}
                </div>
              )}
            </div>

            {isAddingCategory ? (
              <div className={styles.inlineAddContainer}>
                <input
                  type="text"
                  placeholder="Tên danh mục..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className={styles.inlineCatInput}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      saveNewCategory();
                    } else if (e.key === 'Escape') {
                      setIsAddingCategory(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={saveNewCategory}
                  className={styles.inlineCatSave}
                >
                  Lưu
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(false)}
                  className={styles.inlineCatCancel}
                >
                  Hủy
                </button>
              </div>
            ) : (
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={styles.select}
              >
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className={styles.statusToggleContainer}>
            <label className={styles.selectLabel}>Trạng thái phục vụ</label>
            <div className={styles.switchWrapper}>
              <label className={styles.switch}>
                <input
                  type="checkbox"
                  checked={status === 'active'}
                  onChange={(e) => setStatus(e.target.checked ? 'active' : 'inactive')}
                />
                <span className={styles.slider}></span>
              </label>
              <span className={styles.statusLabel}>
                {status === 'active' ? 'Đang bán (Còn)' : 'Ngừng bán (Hết)'}
              </span>
            </div>
          </div>
        </div>

        <div className={styles.textAreaContainer}>
          <label className={styles.selectLabel}>Mô tả món ăn</label>
          <textarea
            placeholder="Mô tả nguyên liệu, hương vị món ăn..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textarea}
            rows="3"
          />
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} size="medium">
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" size="medium">
            {isEdit ? 'Cập nhật món' : 'Thêm thực đơn'}
          </Button>
        </div>
      </div>
    </form>
  );
};
