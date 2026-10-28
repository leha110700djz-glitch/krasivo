import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../shared/models/review.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';

final notificationsProvider =
    FutureProvider<List<AppNotification>>((ref) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.myNotifications);
  final data = response.data;
  final items = data is List ? data : (data['items'] as List? ?? []);
  return (items as List)
      .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
      .toList();
});

class NotificationsScreen extends ConsumerWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.notifications),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
        actions: [
          TextButton(
            onPressed: () => _markAllRead(ref),
            child: const Text(
              AppStrings.markAllRead,
              style: TextStyle(color: primaryColor, fontSize: 13),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: primaryColor,
        onRefresh: () async => ref.invalidate(notificationsProvider),
        child: notificationsAsync.when(
          loading: () => const LoadingWidget(),
          error: (e, _) => AppErrorWidget(
            message: AppStrings.errorGeneric,
            onRetry: () => ref.invalidate(notificationsProvider),
          ),
          data: (notifications) {
            if (notifications.isEmpty) {
              return const EmptyWidget(
                message: AppStrings.noNotifications,
                icon: Icons.notifications_outlined,
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              itemBuilder: (_, index) =>
                  _NotificationTile(notification: notifications[index]),
            );
          },
        ),
      ),
    );
  }

  Future<void> _markAllRead(WidgetRef ref) async {
    try {
      final client = ref.read(apiClientProvider);
      await client.dio.put(ApiEndpoints.readAllNotifications);
      ref.invalidate(notificationsProvider);
    } catch (_) {}
  }
}

class _NotificationTile extends StatelessWidget {
  final AppNotification notification;

  const _NotificationTile({required this.notification});

  IconData get _icon {
    switch (notification.type) {
      case 'booking_confirmed':
        return Icons.check_circle_outline;
      case 'booking_reminder':
        return Icons.alarm_outlined;
      case 'booking_cancelled':
        return Icons.cancel_outlined;
      case 'review':
        return Icons.star_outline;
      case 'promo':
        return Icons.local_offer_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color get _iconColor {
    switch (notification.type) {
      case 'booking_confirmed':
        return successColor;
      case 'booking_reminder':
        return warningColor;
      case 'booking_cancelled':
        return errorColor;
      case 'review':
        return accentColor;
      default:
        return primaryColor;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: notification.isRead
            ? surfaceColor
            : primaryColor.withOpacity(0.04),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: notification.isRead
              ? dividerColor
              : primaryColor.withOpacity(0.2),
        ),
      ),
      child: ListTile(
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(
            color: _iconColor.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(_icon, color: _iconColor, size: 22),
        ),
        title: Text(
          notification.title,
          style: TextStyle(
            fontWeight:
                notification.isRead ? FontWeight.w500 : FontWeight.w700,
            fontSize: 14,
            color: textPrimary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 3),
            Text(
              notification.body,
              style: const TextStyle(
                fontSize: 13,
                color: textSecondary,
                height: 1.4,
              ),
            ),
            if (notification.createdAt != null) ...[
              const SizedBox(height: 4),
              Text(
                _formatDate(notification.createdAt!),
                style: const TextStyle(fontSize: 11, color: textHint),
              ),
            ],
          ],
        ),
        trailing: notification.isRead
            ? null
            : Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: primaryColor,
                  shape: BoxShape.circle,
                ),
              ),
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr).toLocal();
      final now = DateTime.now();
      final diff = now.difference(dt);
      if (diff.inMinutes < 60) return '${diff.inMinutes} мин назад';
      if (diff.inHours < 24) return '${diff.inHours} ч назад';
      if (diff.inDays == 1) return 'Вчера';
      return DateFormat('d MMMM', 'ru').format(dt);
    } catch (_) {
      return dateStr;
    }
  }
}
