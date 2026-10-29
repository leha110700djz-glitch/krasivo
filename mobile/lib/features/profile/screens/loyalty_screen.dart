import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';

final loyaltyProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final client = ref.read(apiClientProvider);
  try {
    final response = await client.dio.get(ApiEndpoints.loyaltyMe);
    return response.data as Map<String, dynamic>;
  } catch (_) {
    return {'points': 0, 'level': 'bronze', 'lifetime_points': 0, 'transactions': []};
  }
});

class LoyaltyScreen extends ConsumerWidget {
  const LoyaltyScreen({super.key});

  Color _levelColor(String level) {
    switch (level) {
      case 'silver':
        return Colors.blueGrey;
      case 'gold':
        return const Color(0xFFD4A017);
      case 'platinum':
        return const Color(0xFF6B21A8);
      default:
        return const Color(0xFF92400E);
    }
  }

  String _levelLabel(String level) {
    switch (level) {
      case 'silver':
        return 'Серебро';
      case 'gold':
        return 'Золото';
      case 'platinum':
        return 'Платина';
      default:
        return 'Бронза';
    }
  }

  int _nextThreshold(String level) {
    switch (level) {
      case 'bronze':
        return 500;
      case 'silver':
        return 2000;
      case 'gold':
        return 5000;
      default:
        return 5000;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final loyaltyAsync = ref.watch(loyaltyProvider);

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Мои баллы',
          style: TextStyle(fontWeight: FontWeight.w700, color: Colors.white),
        ),
        backgroundColor: primaryColor,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: loyaltyAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: primaryColor)),
        error: (_, __) => const Center(child: Text('Ошибка загрузки')),
        data: (data) {
          final points = (data['points'] as num?)?.toInt() ?? 0;
          final lifetime = (data['lifetime_points'] as num?)?.toInt() ?? 0;
          final level = (data['level'] as String?) ?? 'bronze';
          final levelColor = _levelColor(level);
          final nextThresh = _nextThreshold(level);
          final progress = level == 'platinum'
              ? 1.0
              : (lifetime / nextThresh).clamp(0.0, 1.0);
          final transactions = (data['transactions'] as List?) ?? [];

          return RefreshIndicator(
            color: primaryColor,
            onRefresh: () async => ref.invalidate(loyaltyProvider),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Balance card
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [levelColor, levelColor.withOpacity(0.7)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: levelColor.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 6),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            _levelLabel(level),
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Text(
                              '1 балл = 0.50 ₽',
                              style: TextStyle(color: Colors.white70, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Text(
                        '$points',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 52,
                          fontWeight: FontWeight.w900,
                          height: 1,
                        ),
                      ),
                      const Text(
                        'баллов',
                        style: TextStyle(color: Colors.white70, fontSize: 16),
                      ),
                      const SizedBox(height: 16),
                      if (level != 'platinum') ...[
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '$lifetime / $nextThresh',
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                            Text(
                              'до следующего уровня',
                              style: const TextStyle(color: Colors.white70, fontSize: 12),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: progress,
                            backgroundColor: Colors.white.withOpacity(0.2),
                            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
                            minHeight: 6,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // How to earn
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: surfaceColor,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: cardShadow,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Как заработать баллы',
                        style: TextStyle(
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          color: textPrimary,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _EarnItem(
                        icon: Icons.check_circle_outline,
                        text: 'Запись выполнена',
                        points: '+20',
                        color: primaryColor,
                      ),
                      const SizedBox(height: 8),
                      _EarnItem(
                        icon: Icons.star_outline,
                        text: 'Отзыв 5 звёзд',
                        points: '+50',
                        color: const Color(0xFFD97706),
                      ),
                      const SizedBox(height: 8),
                      _EarnItem(
                        icon: Icons.person_add_outlined,
                        text: 'Регистрация',
                        points: '+100',
                        color: successColor,
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Transaction history
                if (transactions.isNotEmpty) ...[
                  const Text(
                    'История',
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 17,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 10),
                  ...transactions.take(20).map((tx) {
                    final pts = (tx['points'] as num?)?.toInt() ?? 0;
                    final reason = (tx['description'] as String?) ?? '';
                    final isPositive = pts > 0;
                    return Container(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: surfaceColor,
                        borderRadius: BorderRadius.circular(12),
                        boxShadow: cardShadow,
                      ),
                      child: Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: (isPositive ? successColor : Colors.red)
                                  .withOpacity(0.1),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Icon(
                              isPositive
                                  ? Icons.add_circle_outline
                                  : Icons.remove_circle_outline,
                              color: isPositive ? successColor : Colors.red,
                              size: 20,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              reason,
                              style: const TextStyle(
                                fontSize: 13,
                                color: textPrimary,
                              ),
                            ),
                          ),
                          Text(
                            '${isPositive ? '+' : ''}$pts',
                            style: TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 15,
                              color: isPositive ? successColor : Colors.red,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ] else
                  const Center(
                    child: Padding(
                      padding: EdgeInsets.all(24),
                      child: Text(
                        'История пуста. Запишитесь к мастеру!',
                        style: TextStyle(color: textSecondary),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),

                const SizedBox(height: 80),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _EarnItem extends StatelessWidget {
  final IconData icon;
  final String text;
  final String points;
  final Color color;

  const _EarnItem({
    required this.icon,
    required this.text,
    required this.points,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(fontSize: 13, color: textPrimary),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            points,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w700,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }
}
