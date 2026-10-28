import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/masters/providers/masters_provider.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/star_rating.dart';
import '../../../shared/widgets/app_button.dart';

class MasterDetailScreen extends ConsumerWidget {
  final int masterId;
  const MasterDetailScreen({super.key, required this.masterId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final masterAsync = ref.watch(masterDetailProvider(masterId));

    return masterAsync.when(
      loading: () => Scaffold(appBar: AppBar(), body: const LoadingWidget()),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: AppErrorWidget(
          message: 'Не удалось загрузить профиль мастера',
          onRetry: () => ref.invalidate(masterDetailProvider(masterId)),
        ),
      ),
      data: (master) {
        final avatarUrl = master.avatar != null ? resolveImageUrl(master.avatar!) : null;
        final reviewsAsync = ref.watch(masterReviewsProvider(masterId));

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              SliverAppBar(
                expandedHeight: 200,
                pinned: true,
                backgroundColor: primaryColor,
                leading: IconButton(
                  icon: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: const BoxDecoration(
                      color: Colors.black26,
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
                  ),
                  onPressed: () => context.pop(),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: const BoxDecoration(gradient: heroGradient),
                    child: SafeArea(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 48, 20, 20),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white, width: 3),
                              ),
                              child: CircleAvatar(
                                radius: 44,
                                backgroundColor: Colors.white.withOpacity(0.2),
                                backgroundImage: avatarUrl != null
                                    ? CachedNetworkImageProvider(avatarUrl)
                                    : null,
                                child: avatarUrl == null
                                    ? Text(
                                        master.name.isNotEmpty ? master.name[0] : '?',
                                        style: const TextStyle(
                                          fontSize: 32,
                                          fontWeight: FontWeight.w700,
                                          color: Colors.white,
                                        ),
                                      )
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.end,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    master.name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      const Icon(Icons.star_rounded, size: 16, color: accentColor),
                                      const SizedBox(width: 4),
                                      Text(
                                        '${master.rating.toStringAsFixed(1)} (${master.reviewsCount})',
                                        style: TextStyle(
                                          color: Colors.white.withOpacity(0.9),
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
                    ),
                  ),
                ),
              ),
              SliverToBoxAdapter(
                child: Container(
                  color: surfaceColor,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Specializations
                      if (master.specializations.isNotEmpty) ...[
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: master.specializations
                              .map((spec) => Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: primaryColor.withOpacity(0.08),
                                      borderRadius: BorderRadius.circular(20),
                                    ),
                                    child: Text(
                                      spec,
                                      style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: primaryColor,
                                      ),
                                    ),
                                  ))
                              .toList(),
                        ),
                        const SizedBox(height: 16),
                      ],
                      // Experience
                      if (master.experienceYears != null) ...[
                        Row(
                          children: [
                            const Icon(Icons.workspace_premium_outlined,
                                size: 16, color: textSecondary),
                            const SizedBox(width: 8),
                            Text(
                              'Опыт: ${master.experienceYears} ${_yearsLabel(master.experienceYears!)}',
                              style: const TextStyle(
                                fontSize: 14,
                                color: textSecondary,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                      ],
                      // Salon link
                      if (master.salonName != null) ...[
                        GestureDetector(
                          onTap: master.salonId != null
                              ? () => context.push('/salons/${master.salonId}')
                              : null,
                          child: Row(
                            children: [
                              const Icon(Icons.store_outlined,
                                  size: 16, color: textSecondary),
                              const SizedBox(width: 8),
                              Text(
                                master.salonName!,
                                style: TextStyle(
                                  fontSize: 14,
                                  color: master.salonId != null
                                      ? primaryColor
                                      : textSecondary,
                                  decoration: master.salonId != null
                                      ? TextDecoration.underline
                                      : null,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 8),
                      ],
                      // Bio
                      if (master.bio != null && master.bio!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          master.bio!,
                          style: const TextStyle(
                            fontSize: 14,
                            color: textPrimary,
                            height: 1.6,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              // Portfolio
              if (master.portfolio.isNotEmpty) ...[
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                    child: const Text(
                      'Портфолио',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                        color: textPrimary,
                      ),
                    ),
                  ),
                ),
                SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (_, index) {
                      final url = resolveImageUrl(master.portfolio[index]);
                      return Padding(
                        padding: const EdgeInsets.all(4),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: CachedNetworkImage(
                            imageUrl: url,
                            fit: BoxFit.cover,
                            placeholder: (_, __) => Container(
                              color: primaryColor.withOpacity(0.08),
                              child: const Center(
                                child: Icon(Icons.image_outlined, color: primaryLight),
                              ),
                            ),
                            errorWidget: (_, __, ___) => Container(
                              color: primaryColor.withOpacity(0.08),
                              child: const Center(
                                child: Icon(Icons.broken_image_outlined, color: primaryLight),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                    childCount: master.portfolio.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 2,
                    crossAxisSpacing: 2,
                    childAspectRatio: 1,
                  ),
                ),
              ],
              // Reviews
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
                  child: const Text(
                    'Отзывы',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: textPrimary,
                    ),
                  ),
                ),
              ),
              reviewsAsync.when(
                loading: () => const SliverToBoxAdapter(child: LoadingWidget()),
                error: (_, __) => const SliverToBoxAdapter(child: SizedBox.shrink()),
                data: (reviews) => reviews.isEmpty
                    ? const SliverToBoxAdapter(
                        child: Padding(
                          padding: EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            AppStrings.noReviews,
                            style: TextStyle(color: textSecondary),
                          ),
                        ),
                      )
                    : SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (_, index) => Padding(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
                            child: Container(
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
                                      CircleAvatar(
                                        radius: 18,
                                        backgroundColor: primaryColor.withOpacity(0.1),
                                        child: Text(
                                          reviews[index].userName.isNotEmpty
                                              ? reviews[index].userName[0]
                                              : '?',
                                          style: const TextStyle(color: primaryColor),
                                        ),
                                      ),
                                      const SizedBox(width: 10),
                                      Expanded(
                                        child: Text(
                                          reviews[index].userName,
                                          style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14,
                                          ),
                                        ),
                                      ),
                                      StarRating(
                                        rating: reviews[index].rating.toDouble(),
                                        size: 14,
                                      ),
                                    ],
                                  ),
                                  if (reviews[index].text != null) ...[
                                    const SizedBox(height: 8),
                                    Text(
                                      reviews[index].text!,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: textPrimary,
                                        height: 1.5,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                          childCount: reviews.length,
                        ),
                      ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: 100)),
            ],
          ),
          floatingActionButton: FloatingActionButton.extended(
            onPressed: () => context.push('/booking/$masterId'),
            backgroundColor: primaryColor,
            foregroundColor: Colors.white,
            label: const Text(
              AppStrings.book,
              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
            ),
            icon: const Icon(Icons.calendar_today_outlined),
          ),
        );
      },
    );
  }

  String _yearsLabel(int years) {
    if (years == 1) return 'год';
    if (years >= 2 && years <= 4) return 'года';
    return 'лет';
  }
}
