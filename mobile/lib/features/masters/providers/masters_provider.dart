import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../shared/models/master.dart';
import '../../../shared/models/review.dart';

final mastersProvider = FutureProvider.family<List<Master>, MastersFilter>(
  (ref, filter) async {
    final client = ref.read(apiClientProvider);
    final params = <String, dynamic>{
      'page': filter.page,
      'limit': filter.limit,
    };
    if (filter.salonId != null) params['salon_id'] = filter.salonId;
    if (filter.category?.isNotEmpty ?? false) params['category'] = filter.category;

    final response = await client.dio.get(
      ApiEndpoints.masters,
      queryParameters: params,
    );
    final data = response.data;
    final items = data is List ? data : (data['items'] as List? ?? []);
    return (items as List)
        .map((e) => Master.fromJson(e as Map<String, dynamic>))
        .toList();
  },
);

final masterDetailProvider =
    FutureProvider.family<Master, int>((ref, id) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.masterById(id));
  return Master.fromJson(response.data as Map<String, dynamic>);
});

final masterSlotsProvider =
    FutureProvider.family<List<TimeSlot>, MasterSlotsQuery>(
  (ref, query) async {
    final client = ref.read(apiClientProvider);
    final response = await client.dio.get(
      ApiEndpoints.masterSlots(query.masterId),
      queryParameters: {'date': query.date},
    );
    final data = response.data;
    final items = data is List ? data : (data['slots'] as List? ?? []);
    return (items as List)
        .map((e) => TimeSlot.fromJson(e as Map<String, dynamic>))
        .toList();
  },
);

final masterReviewsProvider =
    FutureProvider.family<List<Review>, int>((ref, masterId) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.masterReviews(masterId));
  final data = response.data;
  final items = data is List ? data : (data['items'] as List? ?? []);
  return (items as List)
      .map((e) => Review.fromJson(e as Map<String, dynamic>))
      .toList();
});

final featuredMastersProvider = FutureProvider<List<Master>>((ref) async {
  return ref.watch(mastersProvider(const MastersFilter(page: 1, limit: 10)).future);
});

class MastersFilter {
  final int page;
  final int limit;
  final int? salonId;
  final String? category;

  const MastersFilter({
    this.page = 1,
    this.limit = 20,
    this.salonId,
    this.category,
  });

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MastersFilter &&
        other.page == page &&
        other.limit == limit &&
        other.salonId == salonId &&
        other.category == category;
  }

  @override
  int get hashCode => Object.hash(page, limit, salonId, category);
}

class MasterSlotsQuery {
  final int masterId;
  final String date;

  const MasterSlotsQuery({required this.masterId, required this.date});

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is MasterSlotsQuery &&
        other.masterId == masterId &&
        other.date == date;
  }

  @override
  int get hashCode => Object.hash(masterId, date);
}
