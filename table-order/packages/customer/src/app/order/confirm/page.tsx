'use client';

import { useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { apiClient } from '@/services/apiClient';
import { Order } from '@/types';
import styles from './page.module.css';

export default function OrderConfirmPage() {
  const { items, totalAmount, clearCart } = useCart();
  const { session } = useAuth();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOrder = async () => {
    if (!session || items.length === 0) return;

    setIsSubmitting(true);
    const orderData = {
      storeId: session.storeId,
      tableId: session.tableId,
      sessionId: session.sessionId,
      items: items.map((item) => ({
        menuId: item.menuId,
        menuName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
      })),
      totalAmount,
    };

    const result = await apiClient.post<Order>('/orders', orderData);

    if (result.success && result.data) {
      clearCart();
      window.location.href = `/order/success/?orderNumber=${result.data.orderNumber}`;
    } else {
      toast.error(result.error?.message || '주문에 실패했습니다. 다시 시도해주세요.');
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.empty}>
          <p>장바구니가 비어있습니다</p>
          <a href="/" className={styles.goMenuButton}>메뉴 보러가기</a>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <a href="/cart/" className={styles.backButton}>← 장바구니</a>
        <h1 className={styles.title}>주문 확인</h1>
      </header>

      <main className={styles.content}>
        <ul className={styles.orderList}>
          {items.map((item) => (
            <li key={item.menuId} className={styles.orderItem}>
              <span className={styles.itemName}>{item.name}</span>
              <span className={styles.itemQty}>x{item.quantity}</span>
              <span className={styles.itemPrice}>₩{(item.price * item.quantity).toLocaleString()}</span>
            </li>
          ))}
        </ul>

        <div className={styles.totalSection}>
          <span>총 결제 금액</span>
          <span className={styles.totalAmount}>₩{totalAmount.toLocaleString()}</span>
        </div>
      </main>

      <footer className={styles.footer}>
        <button
          className={styles.confirmButton}
          onClick={handleOrder}
          disabled={isSubmitting}
        >
          {isSubmitting ? '주문 중...' : '주문 확정'}
        </button>
      </footer>
    </div>
  );
}
