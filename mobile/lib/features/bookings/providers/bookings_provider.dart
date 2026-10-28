import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/booking.dart';

final myBookingsProvider = FutureProvider.family<List<Booking>, String?>(
  (ref, status) async {
    final client = ref.read(apiClientProvider);
    final params = <String, dynamic>{'limit': 50};
    if (status != null) params['status'] = status;

    final response = await client.dio.get(
      ApiEndpoints.myBookings,
      queryParameters: params,
    );
    final data = response.data;
    final items = data is List ? data : (data['items'] as List? ?? data['results'] as List? ?? []);
    return (items as List)
        .map((e) => Booking.fromJson(e as Map<String, dynamic>))
        .toList();
  },
);

class BookingsNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiClient _apiClient;
  final Ref _ref;

  BookingsNotifier(this._apiClient, this._ref) : super(const AsyncValue.data(null));

  Future<bool> cancelBooking(int bookingId) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.dio.put(ApiEndpoints.cancelBooking(bookingId));
      // Invalidate all booking lists
      _ref.invalidate(myBookingsProvider);
      state = const AsyncValue.data(null);
      return true;
    } on DioException catch (e) {
      state = AsyncValue.error(e.userMessage, StackTrace.current);
      return false;
    } catch (e) {
      state = AsyncValue.error('Ошибка', StackTrace.current);
      return false;
    }
  }
}

final bookingsNotifierProvider =
    StateNotifierProvider<BookingsNotifier, AsyncValue<void>>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return BookingsNotifier(apiClient, ref);
});
