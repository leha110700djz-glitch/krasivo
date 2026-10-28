import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../features/masters/providers/masters_provider.dart';
import '../../../shared/models/service.dart';
import '../../../shared/models/booking.dart';

class BookingState {
  final int masterId;
  final Service? selectedService;
  final DateTime? selectedDate;
  final String? selectedTime;
  final String? notes;
  final bool isSubmitting;
  final String? error;
  final Booking? createdBooking;
  // Promo code
  final String? promoCode;
  final double? discountPercent;
  final String? promoError;
  final bool isCheckingPromo;

  const BookingState({
    required this.masterId,
    this.selectedService,
    this.selectedDate,
    this.selectedTime,
    this.notes,
    this.isSubmitting = false,
    this.error,
    this.createdBooking,
    this.promoCode,
    this.discountPercent,
    this.promoError,
    this.isCheckingPromo = false,
  });

  double get finalPrice {
    final base = selectedService?.price ?? 0.0;
    if (discountPercent != null && discountPercent! > 0) {
      return base * (1 - discountPercent! / 100);
    }
    return base;
  }

  String get finalPriceFormatted => '${finalPrice.toStringAsFixed(0)} ₽';

  BookingState copyWith({
    Service? selectedService,
    DateTime? selectedDate,
    String? selectedTime,
    String? notes,
    bool? isSubmitting,
    String? error,
    Booking? createdBooking,
    String? promoCode,
    double? discountPercent,
    String? promoError,
    bool? isCheckingPromo,
    bool clearPromo = false,
    bool clearError = false,
    bool clearPromoError = false,
  }) =>
      BookingState(
        masterId: masterId,
        selectedService: selectedService ?? this.selectedService,
        selectedDate: selectedDate ?? this.selectedDate,
        selectedTime: selectedTime ?? this.selectedTime,
        notes: notes ?? this.notes,
        isSubmitting: isSubmitting ?? this.isSubmitting,
        error: clearError ? null : (error ?? this.error),
        createdBooking: createdBooking ?? this.createdBooking,
        promoCode: clearPromo ? null : (promoCode ?? this.promoCode),
        discountPercent:
            clearPromo ? null : (discountPercent ?? this.discountPercent),
        promoError:
            clearPromoError ? null : (promoError ?? this.promoError),
        isCheckingPromo: isCheckingPromo ?? this.isCheckingPromo,
      );
}

class BookingNotifier extends StateNotifier<BookingState> {
  final ApiClient _apiClient;

  BookingNotifier(this._apiClient, int masterId)
      : super(BookingState(masterId: masterId));

  void selectService(Service service) {
    state = state.copyWith(selectedService: service, error: null);
  }

  void selectDate(DateTime date) {
    state = state.copyWith(
      selectedDate: date,
      selectedTime: null, // reset time when date changes
      error: null,
    );
  }

  void selectTime(String time) {
    state = state.copyWith(selectedTime: time, error: null);
  }

  void setNotes(String notes) {
    state = state.copyWith(notes: notes, clearError: true);
  }

  Future<void> applyPromoCode(String code) async {
    if (code.trim().isEmpty) {
      state = state.copyWith(clearPromo: true, clearPromoError: true);
      return;
    }
    state = state.copyWith(isCheckingPromo: true, clearPromoError: true);
    try {
      final response = await _apiClient.dio.get(
        ApiEndpoints.promoByCode(code.trim().toUpperCase()),
      );
      final data = response.data as Map<String, dynamic>;
      final discount = (data['discount_percent'] as num?)?.toDouble() ?? 0.0;
      state = state.copyWith(
        promoCode: code.trim().toUpperCase(),
        discountPercent: discount,
        isCheckingPromo: false,
        clearPromoError: true,
      );
    } on DioException catch (e) {
      final msg = e.response?.statusCode == 404
          ? 'Промокод не найден'
          : e.userMessage;
      state = state.copyWith(
        promoError: msg,
        isCheckingPromo: false,
        clearPromo: true,
      );
    } catch (_) {
      state = state.copyWith(
        promoError: 'Ошибка проверки промокода',
        isCheckingPromo: false,
        clearPromo: true,
      );
    }
  }

  void removePromoCode() {
    state = state.copyWith(clearPromo: true, clearPromoError: true);
  }

  Future<int?> submit() async {
    if (state.selectedService == null ||
        state.selectedDate == null ||
        state.selectedTime == null) {
      state = state.copyWith(error: 'Заполните все поля');
      return null;
    }

    state = state.copyWith(isSubmitting: true, error: null);

    try {
      final dateStr = _formatDate(state.selectedDate!);
      final response = await _apiClient.dio.post(
        ApiEndpoints.bookings,
        data: {
          'master_id': state.masterId,
          'service_id': state.selectedService!.id,
          'date': dateStr,
          'time': state.selectedTime,
          'notes': state.notes,
          if (state.promoCode != null) 'promo_code': state.promoCode,
        },
      );
      final booking = Booking.fromJson(response.data as Map<String, dynamic>);
      state = state.copyWith(isSubmitting: false, createdBooking: booking);
      return booking.id;
    } on DioException catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: e.userMessage,
      );
      return null;
    } catch (e) {
      state = state.copyWith(
        isSubmitting: false,
        error: 'Ошибка при создании записи',
      );
      return null;
    }
  }

  String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}

// Per-master booking notifier
final bookingProvider =
    StateNotifierProvider.family<BookingNotifier, BookingState, int>(
  (ref, masterId) {
    final apiClient = ref.read(apiClientProvider);
    return BookingNotifier(apiClient, masterId);
  },
);

// Master services (using masters api or salon services)
final masterServicesProvider =
    FutureProvider.family<List<Service>, int>((ref, masterId) async {
  final client = ref.read(apiClientProvider);
  try {
    final response = await client.dio.get(
      '/masters/$masterId/services',
    );
    final data = response.data;
    final items = data is List ? data : (data['items'] as List? ?? []);
    return (items as List)
        .map((e) => Service.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});
