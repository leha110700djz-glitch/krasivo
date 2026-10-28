class ApiEndpoints {
  // Auth
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const refresh = '/auth/refresh';
  static const logout = '/auth/logout';

  // Profile
  static const me = '/profile/me';
  static const updateProfile = '/profile/me';
  static const uploadAvatar = '/profile/avatar';

  // Salons
  static const salons = '/salons';
  static String salonById(int id) => '/salons/$id';
  static String salonServices(int id) => '/salons/$id/services';
  static String salonMasters(int id) => '/salons/$id/masters';
  static String salonReviews(int id) => '/salons/$id/reviews';

  // Masters
  static const masters = '/masters';
  static String masterById(int id) => '/masters/$id';
  static String masterSlots(int id) => '/masters/$id/slots';
  static String masterReviews(int id) => '/masters/$id/reviews';

  // Services
  static const services = '/services';

  // Bookings
  static const bookings = '/bookings';
  static const myBookings = '/bookings/my';
  static String bookingById(int id) => '/bookings/$id';
  static String cancelBooking(int id) => '/bookings/$id/cancel';

  // Reviews
  static const reviews = '/reviews';

  // Notifications
  static const myNotifications = '/notifications/my';
  static String readNotification(int id) => '/notifications/$id/read';
  static const readAllNotifications = '/notifications/read-all';

  // Owner
  static const ownerBookings = '/owner/bookings';
  static const ownerStats = '/owner/stats';
  static const ownerSalon = '/owner/salon';
  static String ownerBookingStatus(int id) => '/owner/bookings/$id/status';
  static const ownerMasters = '/owner/masters';
  static String ownerMasterById(int id) => '/owner/masters/$id';
  static const ownerServices = '/owner/services';
  static String ownerServiceById(int id) => '/owner/services/$id';

  // Promos
  static String promoByCode(String code) => '/promos/$code';

  // Push notifications
  static const registerPush = '/notifications/register-push';
}
