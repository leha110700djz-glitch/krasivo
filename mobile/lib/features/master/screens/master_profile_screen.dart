import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';

/// Экран просмотра профиля мастера (для клиентов).
/// Показывает фото-hero, вкладки "О мастере" / "Портфолио" / "Отзывы"
/// и фиксированную кнопку "Записаться".
class MasterProfileScreen extends StatefulWidget {
  final int masterId;
  const MasterProfileScreen({super.key, required this.masterId});

  @override
  State<MasterProfileScreen> createState() => _MasterProfileScreenState();
}

class _MasterProfileScreenState extends State<MasterProfileScreen>
    with SingleTickerProviderStateMixin {
  late final TabController _tabController;

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
      backgroundColor: backgroundColor,
      body: Stack(
        children: [
          NestedScrollView(
            headerSliverBuilder: (_, __) => [
              SliverAppBar(
                expandedHeight: 320,
                pinned: true,
                backgroundColor: primaryColor,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Colors.black26,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.arrow_back_ios_new,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                  onPressed: () => context.pop(),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  collapseMode: CollapseMode.pin,
                  background: Stack(
                    fit: StackFit.expand,
                    children: [
                      // Hero photo
                      Image.network(
                        'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?w=600',
                        fit: BoxFit.cover,
                        loadingBuilder: (_, child, progress) {
                          if (progress == null) return child;
                          return Container(
                            color: primaryDark,
                            child: const Center(
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            ),
                          );
                        },
                        errorBuilder: (_, __, ___) => Container(
                          decoration: const BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [primaryDark, primaryLight],
                            ),
                          ),
                          child: const Center(
                            child: Icon(
                              Icons.person_rounded,
                              color: Colors.white54,
                              size: 80,
                            ),
                          ),
                        ),
                      ),
                      // Gradient overlay for readability
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              Colors.transparent,
                              Colors.black.withOpacity(0.72),
                            ],
                            stops: const [0.4, 1.0],
                          ),
                        ),
                      ),
                      // Master info
                      Positioned(
                        bottom: 56,
                        left: 20,
                        right: 20,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Анастасия Романова',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 24,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Стилист-колорист · 7 лет опыта',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 14,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: [
                                ...List.generate(
                                  5,
                                  (i) => Icon(
                                    i < 4
                                        ? Icons.star_rounded
                                        : Icons.star_half_rounded,
                                    color: accentColor,
                                    size: 18,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Text(
                                  '4.8',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 15,
                                    fontWeight: FontWeight.w700,
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Text(
                                  '128 отзывов',
                                  style: TextStyle(
                                    color: Colors.white60,
                                    fontSize: 13,
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
                bottom: PreferredSize(
                  preferredSize: const Size.fromHeight(48),
                  child: Container(
                    color: surfaceColor,
                    child: TabBar(
                      controller: _tabController,
                      labelColor: primaryColor,
                      unselectedLabelColor: textSecondary,
                      indicatorColor: primaryColor,
                      indicatorWeight: 3,
                      labelStyle: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      unselectedLabelStyle: const TextStyle(fontSize: 14),
                      tabs: const [
                        Tab(text: 'О мастере'),
                        Tab(text: 'Портфолио'),
                        Tab(text: 'Отзывы'),
                      ],
                    ),
                  ),
                ),
              ),
            ],
            body: TabBarView(
              controller: _tabController,
              children: const [
                _AboutTab(),
                _PortfolioTab(),
                _ReviewsTab(),
              ],
            ),
          ),
          // Fixed "Записаться" button at the bottom
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: EdgeInsets.fromLTRB(
                20,
                12,
                20,
                MediaQuery.of(context).padding.bottom + 12,
              ),
              decoration: BoxDecoration(
                color: surfaceColor,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 16,
                    offset: const Offset(0, -4),
                  ),
                ],
              ),
              child: SizedBox(
                width: double.infinity,
                height: 54,
                child: ElevatedButton(
                  onPressed: () =>
                      context.push('/booking/${widget.masterId}'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(14),
                    ),
                    elevation: 0,
                  ),
                  child: const Text(
                    'Записаться',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tab: О мастере
// ────────────────────────────────────────────────────────────────────────────

class _AboutTab extends StatelessWidget {
  const _AboutTab();

  static const _services = [
    {'name': 'Стрижка женская', 'price': '1 500 ₽'},
    {'name': 'Окрашивание корней', 'price': '2 800 ₽'},
    {'name': 'Мелирование', 'price': '4 500 ₽'},
    {'name': 'Балаяж / Омбре', 'price': '6 000 ₽'},
    {'name': 'Укладка', 'price': '1 200 ₽'},
    {'name': 'Восстановление волос', 'price': '3 500 ₽'},
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
      children: [
        // Description
        _SectionTitle('О мастере'),
        const SizedBox(height: 10),
        const Text(
          'Профессиональный стилист с 7-летним опытом. '
          'Специализируюсь на окрашивании, стрижках и уходе за волосами. '
          'Работаю с натуральными и стойкими красителями. '
          'Индивидуальный подход к каждому клиенту.',
          style: TextStyle(
            fontSize: 14,
            color: textSecondary,
            height: 1.65,
          ),
        ),
        const SizedBox(height: 8),
        // Specializations chips
        Wrap(
          spacing: 8,
          runSpacing: 6,
          children: const [
            _SpecChip('Окрашивание'),
            _SpecChip('Стрижки'),
            _SpecChip('Балаяж'),
            _SpecChip('Уход за волосами'),
          ],
        ),
        const SizedBox(height: 28),
        _SectionTitle('Услуги и цены'),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: surfaceColor,
            borderRadius: BorderRadius.circular(14),
            boxShadow: cardShadow,
          ),
          child: Column(
            children: [
              for (var i = 0; i < _services.length; i++) ...[
                _ServiceRow(
                  name: _services[i]['name']!,
                  price: _services[i]['price']!,
                ),
                if (i < _services.length - 1)
                  const Divider(
                    height: 1,
                    indent: 16,
                    endIndent: 16,
                    color: dividerColor,
                  ),
              ],
            ],
          ),
        ),
      ],
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: textPrimary,
      ),
    );
  }
}

class _SpecChip extends StatelessWidget {
  final String label;
  const _SpecChip(this.label);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: primaryColor.withOpacity(0.08),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.w500,
          color: primaryColor,
        ),
      ),
    );
  }
}

class _ServiceRow extends StatelessWidget {
  final String name;
  final String price;
  const _ServiceRow({required this.name, required this.price});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Text(
              name,
              style: const TextStyle(fontSize: 14, color: textPrimary),
            ),
          ),
          Text(
            price,
            style: const TextStyle(
              fontSize: 14,
              color: primaryColor,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tab: Портфолио
// ────────────────────────────────────────────────────────────────────────────

class _PortfolioTab extends StatelessWidget {
  const _PortfolioTab();

  static const _photos = [
    'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400',
    'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=400',
    'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
    'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=400',
    'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400',
    'https://images.unsplash.com/photo-1491895200222-0fc4a4c35e18?w=400',
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: const EdgeInsets.fromLTRB(12, 12, 12, 100),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
        childAspectRatio: 1,
      ),
      itemCount: _photos.length,
      itemBuilder: (_, index) => ClipRRect(
        borderRadius: BorderRadius.circular(12),
        child: Image.network(
          _photos[index],
          fit: BoxFit.cover,
          loadingBuilder: (_, child, progress) {
            if (progress == null) return child;
            return Container(
              color: primaryColor.withOpacity(0.08),
              child: const Center(
                child: CircularProgressIndicator(
                  color: primaryLight,
                  strokeWidth: 2,
                ),
              ),
            );
          },
          errorBuilder: (_, __, ___) => Container(
            color: primaryColor.withOpacity(0.08),
            child: const Center(
              child: Icon(
                Icons.image_outlined,
                color: primaryLight,
                size: 32,
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tab: Отзывы
// ────────────────────────────────────────────────────────────────────────────

class _ReviewsTab extends StatelessWidget {
  const _ReviewsTab();

  static const _reviews = [
    {
      'name': 'Мария К.',
      'avatar': 'https://i.pravatar.cc/80?img=1',
      'rating': 5,
      'text':
          'Анастасия — настоящий профессионал! Великолепный результат. Буду возвращаться.',
      'date': '15 окт 2026',
    },
    {
      'name': 'Светлана Т.',
      'avatar': 'https://i.pravatar.cc/80?img=5',
      'rating': 5,
      'text': 'Делала балаяж — очень довольна. Цвет держится уже 3 месяца!',
      'date': '2 окт 2026',
    },
    {
      'name': 'Ольга В.',
      'avatar': 'https://i.pravatar.cc/80?img=9',
      'rating': 4,
      'text': 'Хороший мастер, приятная атмосфера. Немного подождала, но результатом довольна.',
      'date': '18 сент 2026',
    },
    {
      'name': 'Екатерина Л.',
      'avatar': 'https://i.pravatar.cc/80?img=20',
      'rating': 5,
      'text':
          'Пришла с очень повреждёнными волосами. После процедуры восстановления волосы стали шёлковыми. Спасибо!',
      'date': '5 авг 2026',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.separated(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),
      itemCount: _reviews.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (_, index) => _ReviewCard(review: _reviews[index]),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  final Map<String, dynamic> review;
  const _ReviewCard({required this.review});

  @override
  Widget build(BuildContext context) {
    final rating = review['rating'] as int;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: cardShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              // Client avatar
              CircleAvatar(
                radius: 22,
                backgroundColor: primaryColor.withOpacity(0.1),
                backgroundImage: NetworkImage(review['avatar'] as String),
                onBackgroundImageError: (_, __) {},
                child: null,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review['name'] as String,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      review['date'] as String,
                      style: const TextStyle(
                        fontSize: 12,
                        color: textHint,
                      ),
                    ),
                  ],
                ),
              ),
              Row(
                children: List.generate(
                  rating,
                  (_) => const Icon(
                    Icons.star_rounded,
                    color: accentColor,
                    size: 15,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            review['text'] as String,
            style: const TextStyle(
              fontSize: 13,
              color: textSecondary,
              height: 1.55,
            ),
          ),
        ],
      ),
    );
  }
}
