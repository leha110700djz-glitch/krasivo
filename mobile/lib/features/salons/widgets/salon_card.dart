import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/models/salon.dart';
import '../../../shared/widgets/star_rating.dart';

class SalonCard extends StatelessWidget {
  final Salon salon;
  final bool compact;

  const SalonCard({super.key, required this.salon, this.compact = false});

  @override
  Widget build(BuildContext context) {
    if (compact) return _CompactSalonCard(salon: salon);
    return _FullSalonCard(salon: salon);
  }
}

class _FullSalonCard extends StatelessWidget {
  final Salon salon;
  const _FullSalonCard({required this.salon});

  @override
  Widget build(BuildContext context) {
    final imageUrl = salon.mainPhoto != null
        ? resolveImageUrl(salon.mainPhoto!)
        : null;

    return GestureDetector(
      onTap: () => context.push('/salons/${salon.id}'),
      child: Container(
        width: 200,
        margin: const EdgeInsets.only(right: 12),
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              child: imageUrl != null
                  ? CachedNetworkImage(
                      imageUrl: imageUrl,
                      width: 200,
                      height: 130,
                      fit: BoxFit.cover,
                      placeholder: (_, __) => Container(
                        width: 200,
                        height: 130,
                        color: primaryColor.withOpacity(0.08),
                        child: const Center(
                          child: Icon(Icons.spa_outlined, color: primaryLight, size: 36),
                        ),
                      ),
                      errorWidget: (_, __, ___) => Container(
                        width: 200,
                        height: 130,
                        color: primaryColor.withOpacity(0.08),
                        child: const Center(
                          child: Icon(Icons.spa_outlined, color: primaryLight, size: 36),
                        ),
                      ),
                    )
                  : Container(
                      width: 200,
                      height: 130,
                      decoration: const BoxDecoration(gradient: heroGradient),
                      child: const Center(
                        child: Text('💅', style: TextStyle(fontSize: 40)),
                      ),
                    ),
            ),
            Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    salon.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: textPrimary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 13, color: textSecondary),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(
                          salon.city,
                          style: const TextStyle(
                            fontSize: 12,
                            color: textSecondary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      StarRating(rating: salon.rating, size: 14),
                      const SizedBox(width: 4),
                      Text(
                        '${salon.rating.toStringAsFixed(1)} (${salon.reviewsCount})',
                        style: const TextStyle(
                          fontSize: 12,
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
    );
  }
}

class _CompactSalonCard extends StatelessWidget {
  final Salon salon;
  const _CompactSalonCard({required this.salon});

  @override
  Widget build(BuildContext context) {
    final imageUrl = salon.mainPhoto != null
        ? resolveImageUrl(salon.mainPhoto!)
        : null;

    return GestureDetector(
      onTap: () => context.push('/salons/${salon.id}'),
      child: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          borderRadius: BorderRadius.circular(16),
          boxShadow: cardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              flex: 3,
              child: ClipRRect(
                borderRadius: const BorderRadius.vertical(
                  top: Radius.circular(16),
                ),
                child: imageUrl != null
                    ? CachedNetworkImage(
                        imageUrl: imageUrl,
                        width: double.infinity,
                        height: double.infinity,
                        fit: BoxFit.cover,
                        placeholder: (_, __) => Container(
                          color: primaryColor.withOpacity(0.08),
                          child: const Center(
                            child: Icon(Icons.spa_outlined,
                                color: primaryLight, size: 32),
                          ),
                        ),
                        errorWidget: (_, __, ___) => Container(
                          color: primaryColor.withOpacity(0.08),
                          child: const Center(
                            child: Icon(Icons.spa_outlined,
                                color: primaryLight, size: 32),
                          ),
                        ),
                      )
                    : Container(
                        decoration: const BoxDecoration(gradient: heroGradient),
                        child: const Center(
                          child: Text('💅', style: TextStyle(fontSize: 32)),
                        ),
                      ),
              ),
            ),
            Expanded(
              flex: 2,
              child: Padding(
                padding: const EdgeInsets.all(10),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      salon.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                        color: textPrimary,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            size: 14, color: accentColor),
                        const SizedBox(width: 3),
                        Text(
                          salon.rating.toStringAsFixed(1),
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: textPrimary,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '(${salon.reviewsCount})',
                          style: const TextStyle(
                            fontSize: 11,
                            color: textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
