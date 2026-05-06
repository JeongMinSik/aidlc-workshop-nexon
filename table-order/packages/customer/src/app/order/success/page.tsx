'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from './page.module.css';

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || '';
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = '/';
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.successCard}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>주문 완료!</h1>
        <p className={styles.orderNumber}>주문번호: {orderNumber}</p>
        <p className={styles.message}>주문이 정상적으로 접수되었습니다.</p>
        <p className={styles.countdown}>{countdown}초 후 메뉴 화면으로 이동합니다</p>
        <a href="/" className={styles.goMenuButton}>바로 이동</a>
      </div>
    </div>
  );
}
