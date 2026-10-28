import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/models/master.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/star_rating.dart';

final ownerMastersProvider = FutureProvider<List<Master>>((ref) async {
  final client = ref.read(apiClientProvider);
  try {
    final response = await client.dio.get(ApiEndpoints.ownerMasters);
    final data = response.data;
    final items = data is List ? data : (data['items'] as List? ?? []);
    return (items as List)
        .map((e) => Master.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});

class OwnerMastersScreen extends ConsumerWidget {
  const OwnerMastersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final mastersAsync = ref.watch(ownerMastersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Мастера'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddMasterDialog(context, ref),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.person_add_outlined),
        label: const Text('Добавить'),
      ),
      body: RefreshIndicator(
        color: primaryColor,
        onRefresh: () async => ref.invalidate(ownerMastersProvider),
        child: mastersAsync.when(
          loading: () => const LoadingWidget(),
          error: (e, _) => AppErrorWidget(
            message: 'Не удалось загрузить мастеров',
            onRetry: () => ref.invalidate(ownerMastersProvider),
          ),
          data: (masters) {
            if (masters.isEmpty) {
              return const EmptyWidget(
                message: 'У вас пока нет мастеров.\nДобавьте первого мастера!',
                icon: Icons.people_outline,
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: masters.length,
              itemBuilder: (_, index) => _MasterTile(
                master: masters[index],
                onDelete: () => _deleteMaster(context, ref, masters[index].id),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showAddMasterDialog(
      BuildContext context, WidgetRef ref) async {
    final nameCtrl = TextEditingController();
    final specCtrl = TextEditingController();
    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Добавить мастера'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Имя мастера',
                hintText: 'Например: Анна Иванова',
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: specCtrl,
              decoration: const InputDecoration(
                labelText: 'Специализация',
                hintText: 'Например: Маникюр, Педикюр',
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              elevation: 0,
            ),
            child: const Text('Добавить'),
          ),
        ],
      ),
    );

    if (result == true && nameCtrl.text.trim().isNotEmpty && context.mounted) {
      try {
        final client = ref.read(apiClientProvider);
        await client.dio.post(
          ApiEndpoints.ownerMasters,
          data: {
            'name': nameCtrl.text.trim(),
            'specializations': specCtrl.text
                .split(',')
                .map((s) => s.trim())
                .where((s) => s.isNotEmpty)
                .toList(),
          },
        );
        ref.invalidate(ownerMastersProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Мастер добавлен'),
              backgroundColor: successColor,
            ),
          );
        }
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ошибка при добавлении'),
              backgroundColor: errorColor,
            ),
          );
        }
      }
    }
    nameCtrl.dispose();
    specCtrl.dispose();
  }

  Future<void> _deleteMaster(
      BuildContext context, WidgetRef ref, int masterId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Удалить мастера?'),
        content: const Text(
          'Это действие нельзя отменить.',
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
            child: const Text('Удалить'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      try {
        final client = ref.read(apiClientProvider);
        await client.dio.delete(ApiEndpoints.ownerMasterById(masterId));
        ref.invalidate(ownerMastersProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Мастер удалён')),
          );
        }
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ошибка при удалении'),
              backgroundColor: errorColor,
            ),
          );
        }
      }
    }
  }
}

class _MasterTile extends StatelessWidget {
  final Master master;
  final VoidCallback onDelete;

  const _MasterTile({required this.master, required this.onDelete});

  @override
  Widget build(BuildContext context) {
    final avatarUrl =
        master.avatar != null ? resolveImageUrl(master.avatar!) : null;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: cardShadow,
      ),
      child: Row(
        children: [
          // Avatar
          CircleAvatar(
            radius: 28,
            backgroundColor: primaryColor.withOpacity(0.1),
            backgroundImage: avatarUrl != null
                ? CachedNetworkImageProvider(avatarUrl)
                : null,
            child: avatarUrl == null
                ? Text(
                    master.name.isNotEmpty ? master.name[0].toUpperCase() : '?',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: primaryColor,
                    ),
                  )
                : null,
          ),
          const SizedBox(width: 14),
          // Info
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  master.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15,
                    color: textPrimary,
                  ),
                ),
                if (master.specializations.isNotEmpty) ...[
                  const SizedBox(height: 3),
                  Text(
                    master.specializations.join(', '),
                    style: const TextStyle(
                      fontSize: 13,
                      color: textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                const SizedBox(height: 4),
                Row(
                  children: [
                    StarRating(rating: master.rating, size: 13),
                    const SizedBox(width: 6),
                    Text(
                      '${master.rating.toStringAsFixed(1)} (${master.reviewsCount})',
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
          // Actions
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, color: textSecondary),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12)),
            onSelected: (value) {
              if (value == 'delete') onDelete();
            },
            itemBuilder: (_) => [
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete_outline, color: errorColor, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Удалить',
                      style: TextStyle(color: errorColor),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
