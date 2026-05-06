'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiClient } from '@/services/apiClient';
import { Order, OrderStatus } from '@/types';
import styles from './page.module.css';

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '대기중',
  preparing: '준비중',
  completed: '완료',
};

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#FF9800',
  preparing: '#2196F3',
  completed: '#4CAF50',
};

export default function OrderHistoryPage() {
  const { session, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !session) return;

    const fetchOrders = async () => {
      const result = await apiClient.get<Order[]>(`/sessions/${session.sessionId}/orders`);
      if (result.success && result.data) {
        setOrders(result.data);
      }
      setIsLoading(false);
    };

    fetchOrders();
  }, [isAuthenticated, session]);

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') window.location.href = '/setup/';
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>주문 내역</h1>
      </header>

      <main className={styles.content}>
        {isLoading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : orders.length === 0 ? (
          <div className={styles.empty}>아직 주문 내역이 없습니다</div>
        ) : (
          <ul className={styles.orderList}>
            {orders.map((order) => (
              <li key={order.id} className={styles.orderCard}>
                <div className={styles.orderHeader}>
                  <span className={styles.orderNumber}>#{order.orderNumber}</span>
                  <span
                    className={styles.statusBadge}
                    style={{ backgroundColor: STATUS_COLORS[order.status] }}
                  >
                    {STATUS_LABELS[order.status]}
                  </span>
                </div>
                <div className={styles.orderTime}>
                  {new Date(order.orderedAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                </div>
                <ul className={styles.itemList}>
                  {order.items.map((item) => (
                    <li key={item.id} className={styles.item}>
                      <span>{item.menuName} x{item.quantity}</span>
                      <span>₩{item.subtotal.toLocaleString()}</span>
                    </li>
                  ))}
                </ul>
                <div className={styles.orderTotal}>
                  <span>합계</span>
                  <span className={styles.totalAmount}>₩{order.totalAmount.toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <nav className={styles.bottomNav}>
        <a href="/" className={styles.navItem}>🍽️ 메뉴</a>
        <a href="/cart/" className={styles.navItem}>🛒 장바구니</a>
        <a href="/orders/" className={`${styles.navItem} ${styles.navActive}`}>📋 주문내역</a>
      </nav>
    </div>
  );
}
