import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/models/salon.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/masters/widgets/master_card.dart';
import '../../../features/salons/providers/salons_provider.dart';
import '../../../shared/models/service.dart';
import '../../../shared/models/review.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/star_rating.dart';
import '../../../shared/widgets/app_button.dart';

class SalonDetailScreen extends ConsumerWidget {
  final int salonId;
  const SalonDetailScreen({super.key, required this.salonId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final salonAsync = ref.watch(salonDetailProvider(salonId));

    return salonAsync.when(
      loading: () => Scaffold(
        appBar: AppBar(),
        body: const LoadingWidget(),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: AppErrorWidget(
          message: 'Не удалось загрузить салон',
          onRetry: () => ref.invalidate(salonDetailProvider(salonId)),
        ),
      ),
      data: (salon) => _SalonDetailView(salonId: salonId, salon: salon as Salon),
    );
  }
}

class _SalonDetailView extends ConsumerStatefulWidget {
  final int salonId;
  final Salon salon;

  const _SalonDetailView({required this.salonId, required this.salon});

  @override
  ConsumerState<_SalonDetailView> createState() => _SalonDetailViewState();
}

class _SalonDetailViewState extends ConsumerState<_SalonDetailView>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _currentPhoto = 0;

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
    final salon = widget.salon;
    final photos = salon.photos;

    return Scaffold(
      body: NestedScrollView(
        headerSliverBuilder: (context, innerBoxScrolled) => [
          SliverAppBar(
            expandedHeight: 260,
            pinned: true,
            backgroundColor: primaryColor,
            leading: IconButton(
              icon: Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: Colors.black26,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 18),
              ),
              onPressed: () => context.pop(),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: photos.isEmpty
                  ? Container(
                      decoration: const BoxDecoration(gradient: heroGradient),
                      child: const Center(
                        child: Text('💅', style: TextStyle(fontSize: 80)),
                      ),
                    )
                  : Stack(
                      children: [
                        PageView.builder(
                          itemCount: photos.length,
                          onPageChanged: (i) => setState(() => _currentPhoto = i),
                          itemBuilder: (_, index) => CachedNetworkImage(
                            imageUrl: resolveImageUrl(photos[index]),
                            fit: BoxFit.cover,
                            width: double.infinity,
                            placeholder: (_, __) => Container(
                              color: primaryColor.withOpacity(0.2),
                              child: const Center(child: CircularProgressIndicator(color: Colors.white)),
                            ),
                            errorWidget: (_, __, ___) => Container(
                              decoration: const BoxDecoration(gradient: heroGradient),
                              child: const Center(child: Text('💅', style: TextStyle(fontSize: 60))),
                            ),
                          ),
                        ),
                        if (photos.length > 1)
                          Positioned(
                            bottom: 16,
                            left: 0,
                            right: 0,
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(
                                photos.length,
                                (i) => AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  width: _currentPhoto == i ? 20 : 6,
                                  height: 6,
                                  margin: const EdgeInsets.symmetric(horizontal: 2),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(_currentPhoto == i ? 1 : 0.5),
                                    borderRadius: BorderRadius.circular(3),
                                  ),
                                ),
                              ),
                            ),
                          ),
                      ],
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
                  Text(
                    salon.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w800,
                      color: textPrimary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined, size: 16, color: textSecondary),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${salon.address}, ${salon.city}',
                          style: const TextStyle(color: textSecondary, fontSize: 14),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      StarRating(rating: salon.rating, size: 18),
                      const SizedBox(width: 8),
                      Text(
                        '${salon.rating.toStringAsFixed(1)} • ${salon.reviewsCount} отзывов',
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: textPrimary,
                        ),
                      ),
                    ],
                  ),
                  if (salon.workingHours != null) ...[
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.access_time, size: 16, color: textSecondary),
                        const SizedBox(width: 4),
                        Text(
                          salon.workingHours!,
                          style: const TextStyle(color: textSecondary, fontSize: 13),
                        ),
                      ],
                    ),
                  ],
                  const SizedBox(height: 16),
                  // Action buttons
                  Row(
                    children: [
                      if (salon.phone != null)
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () async {
                              // launchUrl(Uri.parse('tel:${salon.phone}'));
                            },
                            icon: const Icon(Icons.phone_outlined, size: 18),
                            label: const Text(AppStrings.call),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: primaryColor,
                              side: const BorderSide(color: primaryColor),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                          ),
                        ),
                      if (salon.phone != null) const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () {},
                          icon: const Icon(Icons.map_outlined, size: 18),
                          label: const Text(AppStrings.map),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: primaryColor,
                            side: const BorderSide(color: primaryColor),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          SliverPersistentHeader(
            delegate: _StickyTabBarDelegate(
              TabBar(
                controller: _tabController,
                labelColor: primaryColor,
                unselectedLabelColor: textSecondary,
                indicatorColor: primaryColor,
                indicatorWeight: 3,
                labelStyle: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                tabs: const [
                  Tab(text: AppStrings.services),
                  Tab(text: AppStrings.masters),
                  Tab(text: AppStrings.reviews),
                ],
              ),
            ),
            pinned: true,
          ),
        ],
        body: TabBarView(
          controller: _tabController,
          children: [
            _ServicesTab(salonId: widget.salonId),
            _MastersTab(salonId: widget.salonId),
            _ReviewsTab(salonId: widget.salonId),
          ],
        ),
      ),
    );
  }
}

class _StickyTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar tabBar;
  _StickyTabBarDelegate(this.tabBar);

  @override
  double get minExtent => tabBar.preferredSize.height;
  @override
  double get maxExtent => tabBar.preferredSize.height;

  @override
  Widget build(context, shrinkOffset, overlapsContent) => Container(
        color: surfaceColor,
        child: tabBar,
      );

  @override
  bool shouldRebuild(_StickyTabBarDelegate old) => false;
}

class _ServicesTab extends ConsumerWidget {
  final int salonId;
  const _ServicesTab({required this.salonId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(salonServicesProvider(salonId));

    return servicesAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => AppErrorWidget(
        message: AppStrings.noServices,
        onRetry: () => ref.invalidate(salonServicesProvider(salonId)),
      ),
      data: (services) => services.isEmpty
          ? const Center(child: Text(AppStrings.noServices, style: TextStyle(color: textSecondary)))
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: services.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (_, index) => _ServiceTile(service: services[index]),
            ),
    );
  }
}

class _ServiceTile extends StatelessWidget {
  final Service service;
  const _ServiceTile({required this.service});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 14),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: textPrimary,
                  ),
                ),
                if (service.description != null) ...[
                  const SizedBox(height: 3),
                  Text(
                    service.description!,
                    style: const TextStyle(fontSize: 13, color: textSecondary),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 4),
                Text(
                  service.durationFormatted,
                  style: const TextStyle(fontSize: 12, color: textSecondary),
                ),
              ],
            ),
          ),
          const SizedBox(width: 16),
          Text(
            service.priceFormatted,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: primaryColor,
            ),
          ),
        ],
      ),
    );
  }
}

class _MastersTab extends ConsumerWidget {
  final int salonId;
  const _MastersTab({required this.salonId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mastersAsync = ref.watch(salonMastersProvider(salonId));

    return mastersAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => AppErrorWidget(
        message: AppStrings.noMasters,
        onRetry: () => ref.invalidate(salonMastersProvider(salonId)),
      ),
      data: (masters) => masters.isEmpty
          ? const Center(child: Text(AppStrings.noMasters, style: TextStyle(color: textSecondary)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: masters.length,
              itemBuilder: (_, index) => MasterListTile(master: masters[index]),
            ),
    );
  }
}

class _ReviewsTab extends ConsumerWidget {
  final int salonId;
  const _ReviewsTab({required this.salonId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reviewsAsync = ref.watch(salonReviewsProvider(salonId));

    return reviewsAsync.when(
      loading: () => const LoadingWidget(),
      error: (e, _) => const Center(
        child: Text(AppStrings.noReviews, style: TextStyle(color: textSecondary)),
      ),
      data: (reviews) => reviews.isEmpty
          ? const Center(child: Text(AppStrings.noReviews, style: TextStyle(color: textSecondary)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: reviews.length,
              itemBuilder: (_, index) => _ReviewTile(review: reviews[index]),
            ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final Review review;
  const _ReviewTile({required this.review});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
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
                radius: 20,
                backgroundColor: primaryColor.withOpacity(0.1),
                child: Text(
                  review.userName.isNotEmpty ? review.userName[0] : '?',
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    color: primaryColor,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.userName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 14,
                        color: textPrimary,
                      ),
                    ),
                    StarRating(rating: review.rating.toDouble(), size: 14),
                  ],
                ),
              ),
              if (review.createdAt != null)
                Text(
                  _formatDate(review.createdAt!),
                  style: const TextStyle(fontSize: 12, color: textSecondary),
                ),
            ],
          ),
          if (review.text != null && review.text!.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              review.text!,
              style: const TextStyle(
                fontSize: 14,
                color: textPrimary,
                height: 1.5,
              ),
            ),
          ],
        ],
      ),
    );
  }

  String _formatDate(String dateStr) {
    try {
      final dt = DateTime.parse(dateStr);
      return '${dt.day}.${dt.month.toString().padLeft(2, '0')}.${dt.year}';
    } catch (_) {
      return dateStr;
    }
  }
}
