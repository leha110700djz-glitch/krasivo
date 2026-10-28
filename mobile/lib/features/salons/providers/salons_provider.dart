import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/salon.dart';
import '../../../shared/models/master.dart';
import '../../../shared/models/service.dart';
import '../../../shared/models/review.dart';

// Salons list with optional filters
final salonsProvider = FutureProvider.family<List<Salon>, SalonsFilter>(
  (ref, filter) async {
    final client = ref.read(apiClientProvider);
    final params = <String, dynamic>{
      'page': filter.page,
      'limit': filter.limit,
    };
    if (filter.search?.isNotEmpty ?? false) params['search'] = filter.search;
    if (filter.city?.isNotEmpty ?? false) params['city'] = filter.city;
    if (filter.category?.isNotEmpty ?? false) params['category'] = filter.category;
    if (filter.minRating != null) params['min_rating'] = filter.minRating;

    final response = await client.dio.get(
      ApiEndpoints.salons,
      queryParameters: params,
    );
    final data = response.data;
    final items = data is List ? data : (data['items'] as List? ?? data['results'] as List? ?? []);
    return (items as List)
        .map((e) => Salon.fromJson(e as Map<String, dynamic>))
        .toList();
  },
);

// Single salon detail
final salonDetailProvider = FutureProvider.family<Salon, int>((ref, id) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.salonById(id));
  return Salon.fromJson(response.data as Map<String, dynamic>);
});

// Services for a salon
final salonServicesProvider =
    FutureProvider.family<List<Service>, int>((ref, salonId) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.salonServices(salonId));
  final data = response.data;
  final items = data is List ? data : (data['items'] as List? ?? []);
  return (items as List)
      .map((e) => Service.fromJson(e as Map<String, dynamic>))
      .toList();
});

// Masters for a salon
final salonMastersProvider =
    FutureProvider.family<List<Master>, int>((ref, salonId) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.salonMasters(salonId));
  final data = response.data;
  final items = data is List ? data : (data['items'] as List? ?? []);
  return (items as List)
      .map((e) => Master.fromJson(e as Map<String, dynamic>))
      .toList();
});

// Reviews for a salon
final salonReviewsProvider =
    FutureProvider.family<List<Review>, int>((ref, salonId) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.salonReviews(salonId));
  final data = response.data;
  final items = data is List ? data : (data['items'] as List? ?? []);
  return (items as List)
      .map((e) => Review.fromJson(e as Map<String, dynamic>))
      .toList();
});

// Featured salons for home screen
final featuredSalonsProvider = FutureProvider<List<Salon>>((ref) async {
  return ref
      .watch(salonsProvider(const SalonsFilter(page: 1, limit: 10)).future);
});

class SalonsFilter {
  final int page;
  final int limit;
  final String? search;
  final String? city;
  final String? category;
  final double? minRating;

  const SalonsFilter({
    this.page = 1,
    this.limit = 20,
    this.search,
    this.city,
    this.category,
    this.minRating,
  });

  SalonsFilter copyWith({
    int? page,
    int? limit,
    String? search,
    String? city,
    String? category,
    double? minRating,
  }) =>
      SalonsFilter(
        page: page ?? this.page,
        limit: limit ?? this.limit,
        search: search ?? this.search,
        city: city ?? this.city,
        category: category ?? this.category,
        minRating: minRating ?? this.minRating,
      );

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is SalonsFilter &&
        other.page == page &&
        other.limit == limit &&
        other.search == search &&
        other.city == city &&
        other.category == category &&
        other.minRating == minRating;
  }

  @override
  int get hashCode => Object.hash(page, limit, search, city, category, minRating);
}
