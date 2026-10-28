// User types
export interface User {
  id: number
  name: string
  email: string
  phone: string
  role: 'client' | 'owner' | 'admin'
  avatar?: string
  bio?: string
  created_at: string
}

export interface AuthTokens {
  access_token: string
  token_type: string
}

export interface LoginRequest {
  phone: string
  password: string
}

export interface RegisterRequest {
  name: string
  phone: string
  password: string
  role: 'client' | 'owner'
}

// Salon types
export interface Salon {
  id: number
  name: string
  description: string
  address: string
  city: string
  phone: string
  email?: string
  website?: string
  photos: string[]
  cover_photo?: string
  rating: number
  reviews_count: number
  categories: Category[]
  working_hours: WorkingHours
  is_verified: boolean
  is_active: boolean
  owner_id: number
  masters_count?: number
  min_price?: number
  max_price?: number
  created_at: string
  lat?: number
  lng?: number
}

export interface SalonListItem {
  id: number
  name: string
  address: string
  city: string
  cover_photo?: string
  avatar_url?: string
  rating: number
  reviews_count: number
  review_count: number
  categories: string[]
  min_price?: number
  max_price?: number
  is_verified: boolean
  masters_count?: number
}

// Category types
export interface Category {
  id: number
  name: string
  slug: string
  icon?: string
}

// Master types
export interface Master {
  id: number
  user_id: number
  salon_id: number
  name: string
  bio?: string
  avatar?: string
  specializations: string[]
  experience_years?: number
  portfolio: PortfolioItem[]
  rating: number
  reviews_count: number
  salon?: SalonListItem
  services?: Service[]
}

export interface PortfolioItem {
  id: number
  image_url: string
  description?: string
}

// Service types
export interface Service {
  id: number
  name: string
  description?: string
  duration_minutes: number
  price: number
  category?: Category
  salon_id: number
  master_id?: number
  is_active: boolean
}

// Booking types
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'

export interface Booking {
  id: number
  client_id: number
  master_id: number
  service_id: number
  salon_id: number
  date: string
  time_start: string
  time_end: string
  status: BookingStatus
  notes?: string
  client_name?: string
  client_phone?: string
  total_price: number
  master?: Master
  service?: Service
  salon?: SalonListItem
  client?: User
  created_at: string
}

export interface CreateBookingRequest {
  master_id: number
  service_id: number
  date: string
  time_start: string
  notes?: string
  client_name?: string
  client_phone?: string
}

export interface TimeSlot {
  time: string
  available: boolean
}

// Review types
export interface Review {
  id: number
  client_id: number
  salon_id: number
  master_id?: number
  booking_id: number
  rating: number
  comment?: string
  client?: User
  created_at: string
}

// Working hours
export interface WorkingHours {
  monday?: DayHours
  tuesday?: DayHours
  wednesday?: DayHours
  thursday?: DayHours
  friday?: DayHours
  saturday?: DayHours
  sunday?: DayHours
}

export interface DayHours {
  open: string
  close: string
  is_closed: boolean
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  per_page: number
  pages: number
}

// Filters
export interface SalonFilters {
  city?: string
  category?: string
  rating_min?: number
  price_min?: number
  price_max?: number
  search?: string
  sort?: 'rating' | 'newest' | 'price_asc' | 'price_desc'
  page?: number
  per_page?: number
}

// Dashboard stats
export interface DashboardStats {
  bookings_today: number
  revenue_month: number
  new_clients: number
  rating: number
  bookings_week: BookingsByDay[]
}

export interface BookingsByDay {
  date: string
  count: number
  revenue: number
}

export interface AdminStats {
  total_salons: number
  total_users: number
  total_bookings: number
  pending_verifications: number
  revenue_total: number
}

// API error
export interface ApiError {
  detail: string | { msg: string; type: string }[]
  status?: number
}

// Form types
export interface SalonFormData {
  name: string
  description: string
  address: string
  city: string
  phone: string
  email?: string
  website?: string
  categories: number[]
}

export interface ServiceFormData {
  name: string
  description?: string
  duration_minutes: number
  price: number
  category_id?: number
  master_id?: number
}

export interface MasterScheduleDay {
  day: string
  slots: string[]
  is_working: boolean
}
