import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';

/// Экран заработка мастера (видит только залогиненный мастер).
class MasterEarningsScreen extends StatelessWidget {
  const MasterEarningsScreen({super.key});

  // Данные за 7 дней (пн–вс), сумма в рублях
  static const _weeklyData = <double>[
    3200,
    5800,
    2400,
    7600,
    4900,
    8100,
    3200,
  ];
  static const _weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  static const _recentBookings = [
    {
      'client': 'Мария К.',
      'service': 'Окрашивание корней',
      'time': 'Сегодня, 14:00',
      'amount': '2 800 ₽',
      'avatarUrl': 'https://i.pravatar.cc/80?img=1',
    },
    {
      'client': 'Светлана Т.',
      'service': 'Мелирование',
      'time': 'Сегодня, 11:30',
      'amount': '4 500 ₽',
      'avatarUrl': 'https://i.pravatar.cc/80?img=5',
    },
    {
      'client': 'Ольга В.',
      'service': 'Стрижка женская',
      'time': 'Вчера, 17:00',
      'amount': '1 500 ₽',
      'avatarUrl': 'https://i.pravatar.cc/80?img=9',
    },
    {
      'client': 'Екатерина Л.',
      'service': 'Балаяж',
      'time': 'Вчера, 12:00',
      'amount': '6 000 ₽',
      'avatarUrl': 'https://i.pravatar.cc/80?img=20',
    },
    {
      'client': 'Анна Ф.',
      'service': 'Укладка',
      'time': '27 окт, 16:30',
      'amount': '1 200 ₽',
      'avatarUrl': 'https://i.pravatar.cc/80?img=30',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        title: const Text(
          'Мой заработок',
          style: TextStyle(fontWeight: FontWeight.w700, fontSize: 18),
        ),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // ── 3 summary cards ────────────────────────────────────────────
          Row(
            children: const [
              Expanded(
                child: _SummaryCard(
                  label: 'Сегодня',
                  amount: '3 200 ₽',
                  trend: '+12%',
                  positive: true,
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _SummaryCard(
                  label: 'Неделя',
                  amount: '35 200 ₽',
                  trend: '+8%',
                  positive: true,
                ),
              ),
              SizedBox(width: 10),
              Expanded(
                child: _SummaryCard(
                  label: 'Месяц',
                  amount: '74 000 ₽',
                  trend: '+15%',
                  positive: true,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          // ── Weekly bar chart ───────────────────────────────────────────
          Container(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
            decoration: BoxDecoration(
              color: surfaceColor,
              borderRadius: BorderRadius.circular(16),
              boxShadow: cardShadow,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Заработок за неделю',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                const Text(
                  'Пн – Вс текущей недели',
                  style: TextStyle(fontSize: 12, color: textHint),
                ),
                const SizedBox(height: 24),
                SizedBox(
                  height: 160,
                  child: _WeeklyBarChart(
                    data: _weeklyData,
                    labels: _weekDays,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // ── Recent bookings ────────────────────────────────────────────
          const Text(
            'Последние записи',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 12),
          ...(_recentBookings.map((b) => _BookingRow(booking: b))),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Summary card widget
// ────────────────────────────────────────────────────────────────────────────

class _SummaryCard extends StatelessWidget {
  final String label;
  final String amount;
  final String trend;
  final bool positive;

  const _SummaryCard({
    required this.label,
    required this.amount,
    required this.trend,
    required this.positive,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              fontSize: 11,
              color: textHint,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            amount,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w800,
              color: textPrimary,
            ),
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
            decoration: BoxDecoration(
              color: (positive ? successColor : errorColor).withOpacity(0.12),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              trend,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: positive ? successColor : errorColor,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Weekly bar chart (CustomPaint)
// ────────────────────────────────────────────────────────────────────────────

class _WeeklyBarChart extends StatelessWidget {
  final List<double> data;
  final List<String> labels;

  const _WeeklyBarChart({required this.data, required this.labels});

  @override
  Widget build(BuildContext context) {
    final maxVal = data.reduce(math.max);
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: List.generate(data.length, (i) {
        final ratio = data[i] / maxVal;
        final isToday = i == 0; // Пн = сегодня в примере
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                // Amount label on top of bar
                Text(
                  _formatAmount(data[i]),
                  style: TextStyle(
                    fontSize: 9,
                    color: isToday ? primaryColor : textHint,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                // Bar
                AnimatedContainer(
                  duration: const Duration(milliseconds: 500),
                  curve: Curves.easeOut,
                  height: 120 * ratio,
                  decoration: BoxDecoration(
                    color: isToday
                        ? primaryColor
                        : primaryColor.withOpacity(0.25),
                    borderRadius: const BorderRadius.vertical(
                      top: Radius.circular(6),
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                // Day label
                Text(
                  labels[i],
                  style: TextStyle(
                    fontSize: 11,
                    color: isToday ? primaryColor : textHint,
                    fontWeight:
                        isToday ? FontWeight.w700 : FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        );
      }),
    );
  }

  String _formatAmount(double v) {
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}к';
    return v.toInt().toString();
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Recent booking row
// ────────────────────────────────────────────────────────────────────────────

class _BookingRow extends StatelessWidget {
  final Map<String, dynamic> booking;
  const _BookingRow({required this.booking});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: cardShadow,
      ),
      child: Row(
        children: [
          // Client avatar
          CircleAvatar(
            radius: 22,
            backgroundColor: primaryColor.withOpacity(0.1),
            backgroundImage:
                NetworkImage(booking['avatarUrl'] as String),
            onBackgroundImageError: (_, __) {},
          ),
          const SizedBox(width: 12),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking['client'] as String,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: textPrimary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  booking['service'] as String,
                  style: const TextStyle(
                    fontSize: 12,
                    color: textSecondary,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  booking['time'] as String,
                  style: const TextStyle(
                    fontSize: 11,
                    color: textHint,
                  ),
                ),
              ],
            ),
          ),
          // Amount
          Text(
            booking['amount'] as String,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w700,
              color: successColor,
            ),
          ),
        ],
      ),
    );
  }
}
