import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/bookings/providers/bookings_provider.dart';
import '../../../shared/models/booking.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/status_badge.dart';

class BookingsScreen extends ConsumerStatefulWidget {
  const BookingsScreen({super.key});

  @override
  ConsumerState<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends ConsumerState<BookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.bookings),
        bottom: TabBar(
          controller: _tabController,
          labelColor: primaryColor,
          unselectedLabelColor: textSecondary,
          indicatorColor: primaryColor,
          tabs: const [
            Tab(text: AppStrings.upcoming),
            Tab(text: AppStrings.past),
            Tab(text: AppStrings.cancelled),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _BookingsList(filter: 'upcoming'),
          _BookingsList(filter: 'completed'),
          _BookingsList(filter: 'cancelled'),
        ],
      ),
    );
  }
}

class _BookingsList extends ConsumerWidget {
  final String filter; // 'upcoming' | 'completed' | 'cancelled'

  const _BookingsList({required this.filter});

  String? get _statusFilter {
    switch (filter) {
      case 'upcoming':
        return 'active'; // backend might return pending+confirmed
      case 'completed':
        return 'completed';
      case 'cancelled':
        return 'cancelled';
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(myBookingsProvider(_statusFilter));

    return RefreshIndicator(
      color: primaryColor,
      onRefresh: () async => ref.invalidate(myBookingsProvider(_statusFilter)),
      child: bookingsAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: AppStrings.errorGeneric,
          onRetry: () => ref.invalidate(myBookingsProvider(_statusFilter)),
        ),
        data: (bookings) {
          // Filter client-side as well for robustness
          final filtered = bookings.where((b) {
            switch (filter) {
              case 'upcoming':
                return b.isPending || b.isConfirmed;
              case 'completed':
                return b.isCompleted;
              case 'cancelled':
                return b.isCancelled;
              default:
                return true;
            }
          }).toList();

          if (filtered.isEmpty) {
            String message;
            switch (filter) {
              case 'upcoming':
                message = AppStrings.noUpcomingBookings;
                break;
              case 'completed':
                message = AppStrings.noPastBookings;
                break;
              default:
                message = AppStrings.noCancelledBookings;
            }
            return EmptyWidget(
              message: message,
              icon: Icons.calendar_today_outlined,
              action: filter == 'upcoming'
                  ? AppButton(
                      label: 'Найти мастера',
                      onPressed: () => context.go('/home/explore'),
                      fullWidth: false,
                    )
                  : null,
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: filtered.length,
            itemBuilder: (_, index) => _BookingCard(booking: filtered[index]),
          );
        },
      ),
    );
  }
}

class _BookingCard extends ConsumerWidget {
  final Booking booking;
  const _BookingCard({required this.booking});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final avatarUrl = booking.masterAvatar != null
        ? resolveImageUrl(booking.masterAvatar!)
        : booking.salonPhoto != null
            ? resolveImageUrl(booking.salonPhoto!)
            : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(16),
        boxShadow: cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: avatarUrl != null
                      ? CachedNetworkImage(
                          imageUrl: avatarUrl,
                          width: 60,
                          height: 60,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            width: 60,
                            height: 60,
                            color: primaryColor.withOpacity(0.1),
                            child: const Icon(Icons.spa_outlined, color: primaryLight),
                          ),
                          errorWidget: (_, __, ___) => Container(
                            width: 60,
                            height: 60,
                            color: primaryColor.withOpacity(0.1),
                            child: const Icon(Icons.spa_outlined, color: primaryLight),
                          ),
                        )
                      : Container(
                          width: 60,
                          height: 60,
                          decoration: const BoxDecoration(
                            gradient: heroGradient,
                          ),
                          child: const Center(
                            child: Text('💅', style: TextStyle(fontSize: 24)),
                          ),
                        ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              booking.salonName ?? booking.masterName ?? 'Запись',
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 15,
                                color: textPrimary,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          StatusBadge(status: booking.status),
                        ],
                      ),
                      if (booking.masterName != null &&
                          booking.salonName != null) ...[
                        const SizedBox(height: 2),
                        Text(
                          booking.masterName!,
                          style: const TextStyle(
                            fontSize: 13,
                            color: textSecondary,
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      if (booking.serviceName != null)
                        Text(
                          booking.serviceName!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: textPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      const SizedBox(height: 6),
                      Row(
                        children: [
                          const Icon(Icons.calendar_today_outlined,
                              size: 13, color: textSecondary),
                          const SizedBox(width: 5),
                          Text(
                            _formatDate(booking.date),
                            style: const TextStyle(
                              fontSize: 13,
                              color: textSecondary,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(Icons.access_time,
                              size: 13, color: textSecondary),
                          const SizedBox(width: 5),
                          Text(
                            booking.time,
                            style: const TextStyle(
                              fontSize: 13,
                              color: textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          // Price + actions
          Container(
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: dividerColor)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              children: [
                Text(
                  booking.priceFormatted,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: primaryColor,
                  ),
                ),
                const Spacer(),
                if (booking.canCancel)
                  TextButton(
                    onPressed: () => _cancelBooking(context, ref),
                    style: TextButton.styleFrom(
                      foregroundColor: errorColor,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                    ),
                    child: const Text(AppStrings.cancel),
                  ),
                if (booking.canReview)
                  ElevatedButton(
                    onPressed: () =>
                        context.push('/review/${booking.id}'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 8,
                      ),
                      elevation: 0,
                      textStyle: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    child: const Text(AppStrings.leaveReview),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelBooking(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Отменить запись?'),
        content: const Text(
          'Вы уверены, что хотите отменить эту запись?',
          style: TextStyle(color: textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Нет'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: errorColor),
            child: const Text('Отменить запись'),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await ref
          .read(bookingsNotifierProvider.notifier)
          .cancelBooking(booking.id);
    }
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return DateFormat('d MMMM, EEE', 'ru').format(dt);
    } catch (_) {
      return dateStr;
    }
  }
}
