'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TableAuth } from '@/types';
import styles from './page.module.css';

export default function SetupPage() {
  const { login, error, isLoading } = useAuth();
  const [form, setForm] = useState<TableAuth>({ storeCode: '', tableNumber: 0, password: '' });
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.storeCode) { setFormError('매장 코드를 입력해주세요'); return; }
    if (!form.tableNumber || form.tableNumber < 1) { setFormError('테이블 번호를 입력해주세요'); return; }
    if (!form.password) { setFormError('비밀번호를 입력해주세요'); return; }

    const success = await login(form);
    if (success) {
      window.location.href = '/';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>테이블 설정</h1>
        <p className={styles.subtitle}>매장 정보를 입력해주세요</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="storeCode" className={styles.label}>매장 코드</label>
            <input
              id="storeCode"
              type="text"
              className={styles.input}
              value={form.storeCode}
              onChange={(e) => setForm({ ...form, storeCode: e.target.value })}
              placeholder="매장 코드 입력"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="tableNumber" className={styles.label}>테이블 번호</label>
            <input
              id="tableNumber"
              type="number"
              className={styles.input}
              value={form.tableNumber || ''}
              onChange={(e) => setForm({ ...form, tableNumber: parseInt(e.target.value) || 0 })}
              placeholder="테이블 번호 입력"
              min="1"
              max="999"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>비밀번호</label>
            <input
              id="password"
              type="password"
              className={styles.input}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="비밀번호 입력"
            />
          </div>

          {(formError || error) && (
            <p className={styles.error}>{formError || error}</p>
          )}

          <button type="submit" className={styles.submitButton} disabled={isLoading}>
            {isLoading ? '연결 중...' : '설정 완료'}
          </button>
        </form>
      </div>
    </div>
  );
}
