import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/salons/providers/salons_provider.dart';
import '../../../features/salons/widgets/salon_card.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';

final _exploreFilterProvider = StateProvider<SalonsFilter>((ref) {
  return const SalonsFilter(page: 1, limit: 20);
});

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  String? _selectedCategory;
  double? _selectedRating;

  final _categories = [
    AppStrings.categoryHair,
    AppStrings.categoryNails,
    AppStrings.categoryBrows,
    AppStrings.categoryMakeup,
    AppStrings.categoryBarber,
    AppStrings.categoryMassage,
    AppStrings.categorySkin,
  ];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    // Infinite scroll placeholder - could load more pages
  }

  void _applyFilters() {
    ref.read(_exploreFilterProvider.notifier).state = SalonsFilter(
      page: 1,
      limit: 20,
      search: _searchController.text.trim().isEmpty
          ? null
          : _searchController.text.trim(),
      category: _selectedCategory,
      minRating: _selectedRating,
    );
  }

  void _clearFilters() {
    _searchController.clear();
    setState(() {
      _selectedCategory = null;
      _selectedRating = null;
    });
    ref.read(_exploreFilterProvider.notifier).state =
        const SalonsFilter(page: 1, limit: 20);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(_exploreFilterProvider);
    final salonsAsync = ref.watch(salonsProvider(filter));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Поиск'),
        backgroundColor: surfaceColor,
        actions: [
          if (_selectedCategory != null || _selectedRating != null)
            TextButton(
              onPressed: _clearFilters,
              child: const Text(
                'Сбросить',
                style: TextStyle(color: primaryColor),
              ),
            ),
        ],
      ),
      body: Column(
        children: [
          // Search bar
          Container(
            color: surfaceColor,
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            child: TextField(
              controller: _searchController,
              onSubmitted: (_) => _applyFilters(),
              onChanged: (v) {
                if (v.isEmpty) _applyFilters();
              },
              decoration: InputDecoration(
                hintText: AppStrings.searchHint,
                hintStyle: const TextStyle(color: textHint, fontSize: 14),
                prefixIcon: const Icon(Icons.search, color: textSecondary),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, color: textSecondary),
                        onPressed: () {
                          _searchController.clear();
                          _applyFilters();
                        },
                      )
                    : null,
                filled: true,
                fillColor: backgroundColor,
                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: dividerColor),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: dividerColor),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: const BorderSide(color: primaryColor, width: 2),
                ),
              ),
            ),
          ),
          // Category filter chips
          Container(
            color: surfaceColor,
            height: 44,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 8),
              children: [
                // Rating filter
                _FilterChip(
                  label: 'Рейтинг 4+',
                  isSelected: _selectedRating == 4.0,
                  onTap: () {
                    setState(() {
                      _selectedRating = _selectedRating == 4.0 ? null : 4.0;
                    });
                    _applyFilters();
                  },
                ),
                const SizedBox(width: 8),
                ..._categories.map((cat) => Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: _FilterChip(
                        label: cat,
                        isSelected: _selectedCategory == cat,
                        onTap: () {
                          setState(() {
                            _selectedCategory =
                                _selectedCategory == cat ? null : cat;
                          });
                          _applyFilters();
                        },
                      ),
                    )),
              ],
            ),
          ),
          const Divider(height: 1),
          // Results
          Expanded(
            child: RefreshIndicator(
              color: primaryColor,
              onRefresh: () async {
                ref.invalidate(salonsProvider(filter));
              },
              child: salonsAsync.when(
                loading: () => const SalonGridShimmer(),
                error: (e, _) => AppErrorWidget(
                  message: 'Не удалось загрузить салоны',
                  onRetry: () => ref.invalidate(salonsProvider(filter)),
                ),
                data: (salons) {
                  if (salons.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text('🔍', style: TextStyle(fontSize: 48)),
                          SizedBox(height: 16),
                          Text(
                            'Ничего не найдено',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: textPrimary,
                            ),
                          ),
                          SizedBox(height: 8),
                          Text(
                            'Попробуйте изменить фильтры',
                            style: TextStyle(color: textSecondary),
                          ),
                        ],
                      ),
                    );
                  }
                  return GridView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.72,
                    ),
                    itemCount: salons.length,
                    itemBuilder: (_, index) =>
                        SalonCard(salon: salons[index], compact: true),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _FilterChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
        decoration: BoxDecoration(
          color: isSelected ? primaryColor : backgroundColor,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? primaryColor : dividerColor,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: isSelected ? Colors.white : textSecondary,
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }
}
