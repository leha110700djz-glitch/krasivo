import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../shared/models/booking.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/status_badge.dart';

final _selectedDateProvider = StateProvider<DateTime>((ref) => DateTime.now());

final ownerBookingsByDateProvider =
    FutureProvider.family<List<Booking>, String>((ref, date) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(
    ApiEndpoints.ownerBookings,
    queryParameters: {'date': date, 'limit': 50},
  );
  final data = response.data;
  final items = data is List ? data : (data['items'] as List? ?? []);
  return (items as List)
      .map((e) => Booking.fromJson(e as Map<String, dynamic>))
      .toList();
});

class OwnerBookingsScreen extends ConsumerWidget {
  const OwnerBookingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedDate = ref.watch(_selectedDateProvider);
    final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
    final bookingsAsync = ref.watch(ownerBookingsByDateProvider(dateStr));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Управление записями'),
        actions: [
          IconButton(
            icon: const Icon(Icons.calendar_month_outlined),
            onPressed: () => _pickDate(context, ref),
          ),
        ],
      ),
      body: Column(
        children: [
          // Date header
          Container(
            color: surfaceColor,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.chevron_left, color: primaryColor),
                  onPressed: () {
                    ref.read(_selectedDateProvider.notifier).state =
                        selectedDate.subtract(const Duration(days: 1));
                  },
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _pickDate(context, ref),
                    child: Text(
                      _formatDateHeader(selectedDate),
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.chevron_right, color: primaryColor),
                  onPressed: () {
                    ref.read(_selectedDateProvider.notifier).state =
                        selectedDate.add(const Duration(days: 1));
                  },
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          // Bookings list
          Expanded(
            child: RefreshIndicator(
              color: primaryColor,
              onRefresh: () async =>
                  ref.invalidate(ownerBookingsByDateProvider(dateStr)),
              child: bookingsAsync.when(
                loading: () => const LoadingWidget(),
                error: (e, _) => AppErrorWidget(
                  message: AppStrings.errorGeneric,
                  onRetry: () =>
                      ref.invalidate(ownerBookingsByDateProvider(dateStr)),
                ),
                data: (bookings) {
                  if (bookings.isEmpty) {
                    return const EmptyWidget(
                      message: 'Нет записей на эту дату',
                      icon: Icons.calendar_today_outlined,
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: bookings.length,
                    itemBuilder: (_, index) => _OwnerBookingTile(
                      booking: bookings[index],
                      onStatusChanged: () =>
                          ref.invalidate(ownerBookingsByDateProvider(dateStr)),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _pickDate(BuildContext context, WidgetRef ref) async {
    final selected = await showDatePicker(
      context: context,
      initialDate: ref.read(_selectedDateProvider),
      firstDate: DateTime.now().subtract(const Duration(days: 90)),
      lastDate: DateTime.now().add(const Duration(days: 90)),
      locale: const Locale('ru'),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: primaryColor),
        ),
        child: child!,
      ),
    );
    if (selected != null) {
      ref.read(_selectedDateProvider.notifier).state = selected;
    }
  }

  String _formatDateHeader(DateTime date) {
    final now = DateTime.now();
    if (date.year == now.year &&
        date.month == now.month &&
        date.day == now.day) {
      return 'Сегодня, ${DateFormat('d MMMM', 'ru').format(date)}';
    }
    final tomorrow = now.add(const Duration(days: 1));
    if (date.year == tomorrow.year &&
        date.month == tomorrow.month &&
        date.day == tomorrow.day) {
      return 'Завтра, ${DateFormat('d MMMM', 'ru').format(date)}';
    }
    return DateFormat('d MMMM yyyy', 'ru').format(date);
  }
}

class _OwnerBookingTile extends ConsumerWidget {
  final Booking booking;
  final VoidCallback onStatusChanged;

  const _OwnerBookingTile({
    required this.booking,
    required this.onStatusChanged,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: cardShadow,
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(14),
            child: Row(
              children: [
                // Time
                Container(
                  width: 60,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: primaryColor.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    booking.time,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                      color: primaryColor,
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        booking.serviceName ?? 'Услуга',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 15,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        booking.masterName ?? 'Мастер не указан',
                        style: const TextStyle(
                          fontSize: 12,
                          color: textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
                StatusBadge(status: booking.status),
              ],
            ),
          ),
          // Action buttons
          if (booking.isPending || booking.isConfirmed)
            Container(
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: dividerColor)),
              ),
              child: Row(
                children: [
                  if (booking.isPending)
                    Expanded(
                      child: TextButton(
                        onPressed: () => _updateStatus(context, ref, 'confirmed'),
                        style: TextButton.styleFrom(
                          foregroundColor: successColor,
                          shape: const RoundedRectangleBorder(),
                        ),
                        child: const Text('Подтвердить'),
                      ),
                    ),
                  if (booking.isConfirmed)
                    Expanded(
                      child: TextButton(
                        onPressed: () => _updateStatus(context, ref, 'completed'),
                        style: TextButton.styleFrom(
                          foregroundColor: successColor,
                          shape: const RoundedRectangleBorder(),
                        ),
                        child: const Text('Завершить'),
                      ),
                    ),
                  Container(
                    width: 1,
                    height: 40,
                    color: dividerColor,
                  ),
                  Expanded(
                    child: TextButton(
                      onPressed: () => _updateStatus(context, ref, 'cancelled'),
                      style: TextButton.styleFrom(
                        foregroundColor: errorColor,
                        shape: const RoundedRectangleBorder(),
                      ),
                      child: const Text('Отменить'),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Future<void> _updateStatus(
      BuildContext context, WidgetRef ref, String status) async {
    try {
      final client = ref.read(apiClientProvider);
      await client.dio.put(
        ApiEndpoints.ownerBookingStatus(booking.id),
        data: {'status': status},
      );
      onStatusChanged();
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ошибка обновления статуса'),
            backgroundColor: errorColor,
          ),
        );
      }
    }
  }
}
