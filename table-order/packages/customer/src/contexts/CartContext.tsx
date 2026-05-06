'use client';

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { CartItem, Menu } from '@/types';
import { useAuth } from './AuthContext';

interface CartState {
  items: CartItem[];
  totalAmount: number;
  totalQuantity: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: Menu }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { menuId: number; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_FROM_STORAGE'; payload: CartItem[] };

function calculateTotals(items: CartItem[]) {
  return {
    totalAmount: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    totalQuantity: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

function cartReducer(state: CartState, action: CartAction): CartState {
  let newItems: CartItem[];

  switch (action.type) {
    case 'ADD_ITEM': {
      const menu = action.payload;
      const existing = state.items.find((item) => item.menuId === menu.id);
      if (existing) {
        newItems = state.items.map((item) =>
          item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      } else {
        newItems = [
          ...state.items,
          { menuId: menu.id, name: menu.name, price: menu.price, quantity: 1, imageUrl: menu.imageUrl },
        ];
      }
      return { items: newItems, ...calculateTotals(newItems) };
    }
    case 'REMOVE_ITEM':
      newItems = state.items.filter((item) => item.menuId !== action.payload);
      return { items: newItems, ...calculateTotals(newItems) };
    case 'UPDATE_QUANTITY': {
      const { menuId, quantity } = action.payload;
      if (quantity <= 0) {
        newItems = state.items.filter((item) => item.menuId !== menuId);
      } else {
        newItems = state.items.map((item) =>
          item.menuId === menuId ? { ...item, quantity: Math.min(quantity, 99) } : item,
        );
      }
      return { items: newItems, ...calculateTotals(newItems) };
    }
    case 'CLEAR_CART':
      return { items: [], totalAmount: 0, totalQuantity: 0 };
    case 'LOAD_FROM_STORAGE':
      return { items: action.payload, ...calculateTotals(action.payload) };
    default:
      return state;
  }
}

interface CartContextType extends CartState {
  addItem: (menu: Menu) => void;
  removeItem: (menuId: number) => void;
  updateQuantity: (menuId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [state, dispatch] = useReducer(cartReducer, { items: [], totalAmount: 0, totalQuantity: 0 });

  const storageKey = session ? `cart_${session.storeId}_${session.tableId}` : 'cart';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const items = JSON.parse(saved) as CartItem[];
        dispatch({ type: 'LOAD_FROM_STORAGE', payload: items });
      } catch {
        // ignore parse errors
      }
    }
  }, [storageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (state.items.length > 0) {
      localStorage.setItem(storageKey, JSON.stringify(state.items));
    } else {
      localStorage.removeItem(storageKey);
    }
  }, [state.items, storageKey]);

  const addItem = (menu: Menu) => dispatch({ type: 'ADD_ITEM', payload: menu });
  const removeItem = (menuId: number) => dispatch({ type: 'REMOVE_ITEM', payload: menuId });
  const updateQuantity = (menuId: number, quantity: number) =>
    dispatch({ type: 'UPDATE_QUANTITY', payload: { menuId, quantity } });
  const clearCart = () => dispatch({ type: 'CLEAR_CART' });

  return (
    <CartContext.Provider value={{ ...state, addItem, removeItem, updateQuantity, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
