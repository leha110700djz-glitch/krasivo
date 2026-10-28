# Krasivo API Contract
# Base URL: http://localhost:8000/api/v1

## Auth
POST   /auth/register          Body: {phone, name, password, role: "client"|"salon_owner"}
POST   /auth/login             Body: {phone, password}
POST   /auth/refresh           Body: {refresh_token}
GET    /auth/me                -> User
PUT    /auth/me                Body: {name, avatar, bio, email}
POST   /auth/upload-avatar     Form: file

## Salons
GET    /salons                 Query: city, category, search, lat, lng, radius, sort, page, limit
GET    /salons/{id}            -> SalonDetail
POST   /salons                 Body: SalonCreate (salon_owner only)
PUT    /salons/{id}            Body: SalonUpdate
POST   /salons/{id}/photos     Form: files[]
DELETE /salons/{id}/photos/{photo_id}
GET    /salons/{id}/masters    -> Master[]
GET    /salons/{id}/services   -> Service[]
GET    /salons/{id}/reviews    Query: page, limit -> Review[]
GET    /salons/{id}/stats      -> SalonStats (owner only)
GET    /salons/{id}/bookings   Query: date, status -> Booking[]  (owner only)

## Masters
GET    /masters                Query: salon_id, category, search, page, limit
GET    /masters/{id}           -> MasterDetail
POST   /masters                Body: MasterCreate (salon_owner creates for their salon)
PUT    /masters/{id}           Body: MasterUpdate
GET    /masters/{id}/schedule  Query: date_from, date_to -> Schedule
PUT    /masters/{id}/schedule  Body: {week_schedule: [{day, start_time, end_time, is_working}]}
GET    /masters/{id}/slots     Query: date, service_id -> Slot[]
GET    /masters/{id}/portfolio -> Portfolio[]
POST   /masters/{id}/portfolio Form: file, description
DELETE /masters/{id}/portfolio/{item_id}
GET    /masters/{id}/reviews   Query: page, limit -> Review[]
GET    /masters/{id}/stats     -> MasterStats

## Services
GET    /services/categories    -> Category[]
GET    /services               Query: salon_id, master_id, category_id, search
POST   /services               Body: ServiceCreate (salon_owner)
PUT    /services/{id}          Body: ServiceUpdate
DELETE /services/{id}

## Bookings
GET    /bookings               Query: status, date_from, date_to -> Booking[]
GET    /bookings/{id}          -> BookingDetail
POST   /bookings               Body: {master_id, service_id, date, start_time, notes}
PUT    /bookings/{id}/confirm  (salon_owner/master)
PUT    /bookings/{id}/cancel   Body: {reason}  (client or owner)
PUT    /bookings/{id}/complete (salon_owner/master)
POST   /bookings/{id}/review   Body: {rating, text, photos[]}

## Reviews
GET    /reviews                Query: salon_id, master_id, page, limit -> Review[]
POST   /reviews                Body: ReviewCreate

## Notifications
GET    /notifications          Query: unread_only, page -> Notification[]
PUT    /notifications/{id}/read
PUT    /notifications/read-all

## Admin
GET    /admin/stats            -> AdminStats
GET    /admin/salons           Query: status, search, page -> Salon[]
PUT    /admin/salons/{id}/verify
PUT    /admin/salons/{id}/block
GET    /admin/users            Query: role, search, page -> User[]
GET    /admin/bookings         Query: date_from, date_to, status, page

## --- MODELS ---

User:
  id, phone, email?, name, avatar_url?, role: client|salon_owner|master|admin
  bio?, is_active, created_at

Salon:
  id, owner_id, name, description, address, city, lat?, lng?
  phone, website?, avatar_url?, photos: str[]
  categories: str[], rating: float, review_count: int
  is_verified, is_active, created_at

Master:
  id, salon_id?, user_id?
  name, avatar_url?, bio?, specializations: str[]
  experience_years?, rating: float, review_count: int
  is_active, created_at

Service:
  id, salon_id, master_id?, category_id
  name, description?, price: int (копейки), duration_minutes: int
  is_active

ServiceCategory:
  id, name, icon, sort_order

Slot:
  id, master_id, service_id?, date, start_time, end_time
  status: available|booked|blocked

Booking:
  id, client_id, salon_id, master_id, service_id
  date, start_time, end_time, price: int
  status: pending|confirmed|completed|cancelled|no_show
  notes?, cancel_reason?, created_at

Review:
  id, client_id, salon_id, master_id?
  booking_id, rating: 1-5, text?, photos: str[]
  created_at

Notification:
  id, user_id, type, title, body, data: json
  is_read, created_at

Portfolio:
  id, master_id, image_url, description?, created_at
