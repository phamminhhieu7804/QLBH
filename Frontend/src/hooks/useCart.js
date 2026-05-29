import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

// Custom Hook quản lý logic giỏ hàng, tính toán tài chính và chuyển đổi bàn ăn
export const useCart = () => {
  const context = useContext(CartContext);
  
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }

  const {
    isQRMode,
    tables,
    activeTableId,
    setActiveTableId,
    activeTableName,
    tableCarts,
    cartItems,
    discountPercentage,
    setDiscountPercentage,
    taxPercentage,
    setTaxPercentage,
    ordersHistory,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleItemServed,
    addTable,
    deleteTable,
    clearCart,
    completeOrder,
    submitQROrder
  } = context;

  // Tính toán tiền hàng thuần túy của bàn hiện tại (chưa giảm giá, chưa thuế)
  const getSubTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.product.sellingPrice * item.quantity);
    }, 0);
  };

  // Tính giá trị giảm giá bằng tiền
  const getDiscountAmount = () => {
    const subTotal = getSubTotal();
    return Math.round(subTotal * (discountPercentage / 100));
  };

  // Tính giá trị thuế VAT bằng tiền (sau khi trừ chiết khấu)
  const getTaxAmount = () => {
    const subTotal = getSubTotal();
    const discountAmount = getDiscountAmount();
    const taxableAmount = Math.max(0, subTotal - discountAmount);
    return Math.round(taxableAmount * (taxPercentage / 100));
  };

  // Tổng tiền thanh toán cuối cùng của bàn hiện tại
  const getTotalAmount = () => {
    const subTotal = getSubTotal();
    const discountAmount = getDiscountAmount();
    const taxAmount = getTaxAmount();
    return Math.max(0, subTotal - discountAmount + taxAmount);
  };

  // Tổng số lượng các sản phẩm trong giỏ hàng bàn hiện tại
  const getCartItemsCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  // Tính xem bàn cụ thể bất kỳ có khách hay không và có bao nhiêu món
  const getTableStatus = (tableId) => {
    const items = tableCarts[tableId] || [];
    const count = items.reduce((acc, curr) => acc + curr.quantity, 0);
    return {
      isOccupied: count > 0,
      itemsCount: count
    };
  };

  return {
    isQRMode,
    tables,
    activeTableId,
    setActiveTableId,
    activeTableName,
    tableCarts,
    cartItems,
    discountPercentage,
    setDiscountPercentage,
    taxPercentage,
    setTaxPercentage,
    ordersHistory,
    addToCart,
    updateQuantity,
    removeFromCart,
    toggleItemServed,
    addTable,
    deleteTable,
    clearCart,
    completeOrder,
    submitQROrder,
    // Các hàm tính toán tài chính riêng biệt
    subTotal: getSubTotal(),
    discountAmount: getDiscountAmount(),
    taxAmount: getTaxAmount(),
    totalAmount: getTotalAmount(),
    cartItemsCount: getCartItemsCount(),
    // Helper xem trạng thái bàn cụ thể
    getTableStatus
  };
};
