export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface ShoppingList {
  id: string;
  userId: string;
  name: string;
  createdAt: number; // timestamp
  status: 'active' | 'archived';
  completedAt?: number;
}

export interface Item {
  id: string;
  listId: string;
  name: string;
  quantity?: string;
  category?: string;
  estimatedPrice?: number;
  barcode?: string;
  completed: boolean;
  purchasedAt?: number; // timestamp of when it was checked
}

export interface Product {
  id: string;
  name: string;
  category: string;
  averagePrice: number;
  barcode: string;
  image?: string;
}

export type ViewState = 'LOGIN' | 'DASHBOARD' | 'LIST_DETAIL' | 'ITEM_HISTORY';