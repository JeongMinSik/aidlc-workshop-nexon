'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { apiClient } from '@/services/apiClient';
import { Category, Menu } from '@/types';
import styles from './page.module.css';

export default function MenuPage() {
  const { isAuthenticated, isLoading, session } = useAuth();
  const { addItem, totalQuantity } = useCart();
  const [categories, setCategories] = useState<Category[]>([]);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingMenus, setLoadingMenus] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !session) return;

    const fetchData = async () => {
      const catResult = await apiClient.get<Category[]>(`/stores/${session.storeId}/categories`);
      if (catResult.success && catResult.data) {
        setCategories(catResult.data);
        if (catResult.data.length > 0) {
          setSelectedCategory(catResult.data[0].id);
        }
      }

      const menuResult = await apiClient.get<Menu[]>(`/stores/${session.storeId}/menus`);
      if (menuResult.success && menuResult.data) {
        setMenus(menuResult.data);
      }
      setLoadingMenus(false);
    };

    fetchData();
  }, [isAuthenticated, session]);

  if (isLoading) {
    return <div className={styles.loading}>로딩 중...</div>;
  }

  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      window.location.href = '/setup/';
    }
    return null;
  }

  const filteredMenus = selectedCategory
    ? menus.filter((m) => m.categoryId === selectedCategory)
    : menus;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.storeName}>{session?.storeName}</h1>
        <div className={styles.tableInfo}>테이블 {session?.tableNumber}</div>
        <a href="/cart/" className={styles.cartBadge}>
          🛒 {totalQuantity > 0 && <span className={styles.badge}>{totalQuantity}</span>}
        </a>
      </header>

      <nav className={styles.categoryTabs}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`${styles.categoryTab} ${selectedCategory === cat.id ? styles.active : ''}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.name}
          </button>
        ))}
      </nav>

      <main className={styles.menuGrid}>
        {loadingMenus ? (
          <div className={styles.loading}>메뉴 로딩 중...</div>
        ) : filteredMenus.length === 0 ? (
          <div className={styles.empty}>등록된 메뉴가 없습니다</div>
        ) : (
          filteredMenus.map((menu) => (
            <div key={menu.id} className={styles.menuCard}>
              {menu.imageUrl && (
                <img
                  src={menu.imageUrl}
                  alt={menu.name}
                  className={styles.menuImage}
                  loading="lazy"
                />
              )}
              <div className={styles.menuInfo}>
                <h3 className={styles.menuName}>{menu.name}</h3>
                <p className={styles.menuPrice}>₩{menu.price.toLocaleString()}</p>
                {menu.description && (
                  <p className={styles.menuDesc}>{menu.description}</p>
                )}
              </div>
              <button
                className={styles.addButton}
                onClick={() => addItem(menu)}
                aria-label={`${menu.name} 장바구니에 추가`}
              >
                + 담기
              </button>
            </div>
          ))
        )}
      </main>

      <nav className={styles.bottomNav}>
        <a href="/" className={`${styles.navItem} ${styles.navActive}`}>🍽️ 메뉴</a>
        <a href="/cart/" className={styles.navItem}>🛒 장바구니</a>
        <a href="/orders/" className={styles.navItem}>📋 주문내역</a>
      </nav>
    </div>
  );
}
