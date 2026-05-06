// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[];
    page: number;
    limit: number;
    total: number;
  };
}

// Domain Entities
export interface Store {
  id: number;
  code: string;
  name: string;
}

export interface Category {
  id: number;
  storeId: number;
  name: string;
  sortOrder: number;
}

export interface Menu {
  id: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  sortOrder: number;
}

export interface CartItem {
  menuId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export type OrderStatus = 'pending' | 'preparing' | 'completed';

export interface OrderItem {
  id: number;
  menuId: number;
  menuName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: number;
  orderNumber: string;
  storeId: number;
  tableId: number;
  sessionId: number;
  status: OrderStatus;
  totalAmount: number;
  items: OrderItem[];
  orderedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface TableAuth {
  storeCode: string;
  tableNumber: number;
  password: string;
}

export interface TableSession {
  token: string;
  storeId: number;
  tableId: number;
  sessionId: number;
  storeName: string;
  tableNumber: number;
}
