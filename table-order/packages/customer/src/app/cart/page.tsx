'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from './page.module.css';

export default function CartPage() {
  const { items, totalAmount, totalQuantity, updateQuantity, removeItem, clearCart } = useCart();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') window.location.href = '/setup/';
    return null;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <a href="/" className={styles.backButton}>← 메뉴</a>
        <h1 className={styles.title}>장바구니</h1>
        {items.length > 0 && (
          <button className={styles.clearButton} onClick={clearCart}>
            비우기
          </button>
        )}
      </header>

      <main className={styles.content}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>장바구니가 비어있습니다</p>
            <a href="/" className={styles.goMenuButton}>메뉴 보러가기</a>
          </div>
        ) : (
          <ul className={styles.itemList}>
            {items.map((item) => (
              <li key={item.menuId} className={styles.cartItem}>
                <div className={styles.itemInfo}>
                  <h3 className={styles.itemName}>{item.name}</h3>
                  <p className={styles.itemPrice}>₩{(item.price * item.quantity).toLocaleString()}</p>
                </div>
                <div className={styles.quantityControl}>
                  <button
                    className={styles.qtyButton}
                    onClick={() => updateQuantity(item.menuId, item.quantity - 1)}
                    aria-label="수량 감소"
                  >
                    −
                  </button>
                  <span className={styles.quantity}>{item.quantity}</span>
                  <button
                    className={styles.qtyButton}
                    onClick={() => updateQuantity(item.menuId, item.quantity + 1)}
                    aria-label="수량 증가"
                  >
                    +
                  </button>
                  <button
                    className={styles.removeButton}
                    onClick={() => removeItem(item.menuId)}
                    aria-label="삭제"
                  >
                    ✕
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {items.length > 0 && (
        <footer className={styles.footer}>
          <div className={styles.summary}>
            <span>총 {totalQuantity}개</span>
            <span className={styles.totalAmount}>₩{totalAmount.toLocaleString()}</span>
          </div>
          <a href="/order/confirm/" className={styles.orderButton}>
            주문하기
          </a>
        </footer>
      )}

      <nav className={styles.bottomNav}>
        <a href="/" className={styles.navItem}>🍽️ 메뉴</a>
        <a href="/cart/" className={`${styles.navItem} ${styles.navActive}`}>🛒 장바구니</a>
        <a href="/orders/" className={styles.navItem}>📋 주문내역</a>
      </nav>
    </div>
  );
}
