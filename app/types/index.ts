// User and Authentication Types
export interface User {
  id: string;
  name: string;
  mobile: string;
  password: string;
  role: 'superadmin' | 'manager' | 'user';
  image?: string;
  nidNo?: string;
  dateOfBirth?: string;
  totalDue: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  mobile: string;
  password: string;
}

export interface AuthUser {
  id: string;
  name: string;
  mobile: string;
  role: 'superadmin' | 'manager' | 'user';
  image?: string;
}

// Sales and Transaction Types
export interface Sale {
  id: string;
  userId: string;
  userName: string;
  driverId: string;
  driverName: string;
  chargeType: 'chargeBill' | 'noChargeBill';
  chargeAmount: number;
  dueAmount: number;
  dueCollection: number;
  totalDue: number;
  createdAt: string;
  createdBy: string;
}

export interface Driver {
  id: string;
  name: string;
  mobile?: string;
  createdAt: string;
}

// Cost Management Types
export interface Cost {
  id: string;
  type: string;
  amount: number;
  description?: string;
  createdAt: string;
  createdBy: string;
}

export interface CostType {
  id: string;
  name: string;
  isActive: boolean;
}

// Dashboard and Analytics Types
export interface DashboardStats {
  totalSales: number;
  totalDue: number;
  totalCost: number;
  totalCash: number;
  totalAuto: number;
  totalUsers: number;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

// Profile and Transaction History Types
export interface UserTransaction {
  id: string;
  type: 'sale' | 'dueCollection' | 'charge';
  amount: number;
  description: string;
  date: string;
  balance: number;
}

export interface UserProfile {
  user: User;
  transactions: UserTransaction[];
  totalDue: number;
  monthlyStats: {
    chargeBills: number;
    noChargeBills: number;
    dueCollections: number;
    totalDue: number;
  };
}

// Report Types
export interface ReportFilter {
  startDate: string;
  endDate: string;
  userId?: string;
  reportType: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
}

export interface ReportData {
  totalAuto: number;
  totalSales: number;
  totalDue: number;
  totalCost: number;
  totalCash: number;
  salesSummary: Sale[];
  costSummary: Cost[];
  period: string;
}

// Settings Types
export interface AppSettings {
  theme: 'light' | 'dark';
  language: 'en' | 'bn';
  region: 'BD';
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Activity Log Types
export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// Google Sheets Integration Types
export interface SheetConfig {
  spreadsheetId: string;
  sheets: {
    users: string;
    sales: string;
    costs: string;
    drivers: string;
    costTypes: string;
    activityLogs: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form Types
export interface UserFormData {
  name: string;
  mobile: string;
  password?: string;
  role: 'superadmin' | 'manager' | 'user';
  image?: File;
  nidNo?: string;
  dateOfBirth?: string;
  isActive: boolean;
}

export interface SalesFormData {
  userId: string;
  driverId: string;
  chargeType: 'chargeBill' | 'noChargeBill';
  chargeAmount: number;
  dueAmount: number;
  dueCollection: number;
}

export interface CostFormData {
  type: string;
  amount: number;
  description?: string;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
}

// Translation Types
export interface Translations {
  [key: string]: {
    en: string;
    bn: string;
  };
}

// Component Props Types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
}

// Modal Types
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

// Theme Types
export interface ThemeColors {
  primary: string;
  secondary: string;
  success: string;
  danger: string;
  warning: string;
  info: string;
  light: string;
  dark: string;
}

// Export utility type for making properties optional
export type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Export utility type for making properties required
export type Required<T> = {
  [P in keyof T]-?: T[P];
};