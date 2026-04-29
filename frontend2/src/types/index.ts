export interface User {
  id: string
  username: string
  email?: string
  phone?: string
  avatar?: string
  role: 'admin' | 'user'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Supplier {
  id: string
  name: string
  contact?: string
  phone?: string
  email?: string
  address?: string
  bankName?: string
  bankAccount?: string
  taxNumber?: string
  invoiceInfo?: string
  projectCount: number
  bidProjectCount: number
  bidRate: number
  rating: number
  deliveryRating: number
  remarks?: string
  status: 'active' | 'inactive'
  userId: string
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  name: string
  code?: string
  description?: string
  parentId?: string
  level: number
  attributes?: Record<string, any>
  sort: number
  userId: string
  createdAt: string
  updatedAt: string
  children?: Category[]
  parent?: Category
}

export interface Item {
  id: string
  name: string
  code?: string
  model?: string
  spec?: string
  unit?: string
  brand?: string
  description?: string
  attributes?: Record<string, any>
  categoryId: string
  userId: string
  createdAt: string
  updatedAt: string
  category?: Category
  suppliers?: Supplier[]
}

export interface ConsultProject {
  id: string
  name: string
  projectCode?: string
  customer?: string
  address?: string
  consultDate?: string
  remarks?: string
  status: 'consulting' | 'quoted' | 'paused' | 'cancelled'
  totalAmount: number
  userId: string
  createdAt: string
  updatedAt: string
  projectItems?: ConsultProjectItem[]
  hasBidProject?: boolean
}

export interface ConsultProjectItem {
  id: string
  projectId: string
  itemId: string
  quantity: number
  remarks?: string
  project?: ConsultProject
  item?: Item
  quotes?: SupplierQuote[]
}

export interface SupplierQuote {
  id: string
  projectItemId: string
  supplierId: string
  price: number
  quantity: number
  brand?: string
  contact?: string
  phone?: string
  totalAmount: number
  remarks?: string
  isSelected: boolean
  createdAt: string
  supplier?: Supplier
  projectItem?: ConsultProjectItem
}

export interface BidProject {
  id: string
  name: string
  projectCode?: string
  customer?: string
  address?: string
  contractDate?: string
  contractAmount?: number
  remarks?: string
  status: 'preparing' | 'in_progress' | 'accepted' | 'completed'
  consultProjectId?: string
  totalAmount: number
  userId: string
  createdAt: string
  updatedAt: string
  projectItems?: BidProjectItem[]
  consultProject?: ConsultProject
  receipts?: ReceiptRecord[]
}

export interface BidProjectItem {
  id: string
  projectId: string
  itemId: string
  quantity: number
  remarks?: string
  project?: BidProject
  item?: Item
  suppliers?: BidSupplier[]
}

export interface BidSupplier {
  id: string
  projectItemId: string
  supplierId: string
  price: number
  amount: number
  progress: 'ordered' | 'producing' | 'shipped' | 'delivered' | 'completed'
  paymentStatus: 'unpaid' | 'partial' | 'paid'
  paymentTime?: string | null
  remarks?: string | null
  isSelected: boolean
  supplier?: Supplier
  projectItem?: BidProjectItem
}

export interface PaymentRecord {
  id: string
  projectId: string
  supplierId: string
  amount: number
  paymentTime: string
  paymentMethod?: string
  proofUrl?: string
  remarks?: string
  userId: string
  createdAt: string
  project?: BidProject
  supplier?: Supplier
}

export interface ReceiptRecord {
  id: string
  projectId: string
  amount: number
  receiptTime: string
  receiptMethod?: string
  ratio?: number
  invoiceStatus: 'not_invoiced' | 'invoiced'
  invoiceTime?: string
  invoiceType?: string
  invoiceNo?: string
  estimatedPaymentTime?: string
  isCompleted: boolean
  proofUrl?: string
  remarks?: string
  userId: string
  createdAt: string
  project?: BidProject
}

export interface ReceiptRecord {
  id: string
  projectId: string
  amount: number
  receiptTime: string
  receiptMethod?: string
  ratio?: number
  invoiceStatus: 'not_invoiced' | 'invoiced'
  invoiceTime?: string
  invoiceType?: string
  invoiceNo?: string
  estimatedPaymentTime?: string
  isCompleted: boolean
  remarks?: string
  userId: string
  createdAt: string
  project?: BidProject
}

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm {
  username: string
  password: string
  email?: string
  phone?: string
}

export interface ApiResponse<T = any> {
  access_token?: string
  user?: User
  data?: T
  message?: string
}

export interface PageResult<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface PaginatedResponse<T = any> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}
