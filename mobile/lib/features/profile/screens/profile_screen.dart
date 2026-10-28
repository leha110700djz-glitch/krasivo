import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/user.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.valueOrNull;

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.profile),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: user == null
          ? const Center(child: CircularProgressIndicator(color: primaryColor))
          : ListView(
              children: [
                // Profile header
                Container(
                  color: surfaceColor,
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                      Stack(
                        children: [
                          _UserAvatar(user: user, radius: 48),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: GestureDetector(
                              onTap: () => context.push('/settings'),
                              child: Container(
                                width: 32,
                                height: 32,
                                decoration: const BoxDecoration(
                                  color: primaryColor,
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.edit,
                                  size: 16,
                                  color: Colors.white,
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        user.name,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        user.phone,
                        style: const TextStyle(
                          fontSize: 14,
                          color: textSecondary,
                        ),
                      ),
                      if (user.bio != null && user.bio!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          user.bio!,
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontSize: 13,
                            color: textSecondary,
                            height: 1.4,
                          ),
                        ),
                      ],
                      const SizedBox(height: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 14,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: primaryColor.withOpacity(0.08),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          user.isSalonOwner
                              ? 'Владелец салона'
                              : 'Клиент',
                          style: const TextStyle(
                            color: primaryColor,
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                // Menu items
                Container(
                  color: surfaceColor,
                  child: Column(
                    children: [
                      _MenuItem(
                        icon: Icons.person_outline,
                        label: AppStrings.editProfile,
                        onTap: () => context.push('/settings'),
                      ),
                      _MenuItem(
                        icon: Icons.calendar_today_outlined,
                        label: AppStrings.history,
                        onTap: () => context.go('/home/bookings'),
                      ),
                      _MenuItem(
                        icon: Icons.notifications_outlined,
                        label: AppStrings.notifications,
                        onTap: () => context.push('/notifications'),
                      ),
                      if (user.isSalonOwner)
                        _MenuItem(
                          icon: Icons.store_outlined,
                          label: 'Панель владельца',
                          onTap: () => context.go('/owner/dashboard'),
                        ),
                      _MenuItem(
                        icon: Icons.help_outline,
                        label: AppStrings.help,
                        onTap: () {},
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  color: surfaceColor,
                  child: _MenuItem(
                    icon: Icons.logout,
                    label: AppStrings.logout,
                    iconColor: errorColor,
                    textColor: errorColor,
                    showArrow: false,
                    onTap: () => _confirmLogout(context, ref),
                  ),
                ),
                const SizedBox(height: 32),
                Center(
                  child: Text(
                    'Версия 1.0.0',
                    style: const TextStyle(
                      fontSize: 12,
                      color: textHint,
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
    );
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Выйти из аккаунта?'),
        content: const Text(
          'Вы уверены, что хотите выйти?',
          style: TextStyle(color: textSecondary),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Отмена'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: errorColor),
            child: const Text(AppStrings.logout),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) {
        context.go('/auth/login');
      }
    }
  }
}

class _UserAvatar extends StatelessWidget {
  final User user;
  final double radius;

  const _UserAvatar({required this.user, this.radius = 36});

  @override
  Widget build(BuildContext context) {
    final avatarUrl = user.avatar != null ? resolveImageUrl(user.avatar!) : null;

    return CircleAvatar(
      radius: radius,
      backgroundColor: primaryColor.withOpacity(0.1),
      backgroundImage: avatarUrl != null
          ? CachedNetworkImageProvider(avatarUrl)
          : null,
      child: avatarUrl == null
          ? Text(
              user.name.isNotEmpty ? user.name[0].toUpperCase() : '?',
              style: TextStyle(
                fontSize: radius * 0.7,
                fontWeight: FontWeight.w700,
                color: primaryColor,
              ),
            )
          : null,
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? textColor;
  final bool showArrow;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.iconColor,
    this.textColor,
    this.showArrow = true,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(
        icon,
        color: iconColor ?? textSecondary,
        size: 22,
      ),
      title: Text(
        label,
        style: TextStyle(
          fontSize: 15,
          color: textColor ?? textPrimary,
          fontWeight: FontWeight.w500,
        ),
      ),
      trailing: showArrow
          ? const Icon(
              Icons.arrow_forward_ios_rounded,
              size: 14,
              color: textSecondary,
            )
          : null,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 2),
    );
  }
}
