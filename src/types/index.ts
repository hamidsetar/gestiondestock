export interface User {
  id: string;
  username: string;
  password: string;
  role: 'admin' | 'agent';
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  size: string;
  color: string;
  barcode: string;
  price: number;
  rentalPrice: number;
  purchasePrice: number;
  stock: number;
  createdAt: string;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address?: string;
  createdAt: string;
}

export interface Sale {
  id: string;
  clientId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: 'paid' | 'partial' | 'pending';
  createdBy: string;
  createdAt: string;
}

export interface Rental {
  id: string;
  clientId: string;
  productId: string;
  quantity: number;
  dailyRate: number;
  startDate: string;
  endDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  deposit: number;
  status: 'active' | 'returned' | 'overdue' | 'reserved';
  createdBy: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  transactionId: string;
  transactionType: 'sale' | 'rental';
  amount: number;
  paymentMethod: 'cash' | 'card' | 'transfer';
  createdBy: string;
  createdAt: string;
}

export interface Receipt {
  id: string;
  type: 'sale' | 'rental' | 'payment';
  transactionId: string;
  clientName: string;
  items: ReceiptItem[];
  total: number;
  paid: number;
  remaining: number;
  createdBy: string;
  createdAt: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
}