import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../shared/models/service.dart';
import '../../../shared/widgets/error_widget.dart';
import '../../../shared/widgets/loading_widget.dart';

final ownerServicesProvider = FutureProvider<List<Service>>((ref) async {
  final client = ref.read(apiClientProvider);
  try {
    final response = await client.dio.get(ApiEndpoints.ownerServices);
    final data = response.data;
    final items = data is List ? data : (data['items'] as List? ?? []);
    return (items as List)
        .map((e) => Service.fromJson(e as Map<String, dynamic>))
        .toList();
  } catch (_) {
    return [];
  }
});

class OwnerServicesScreen extends ConsumerWidget {
  const OwnerServicesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final servicesAsync = ref.watch(ownerServicesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Услуги'),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddServiceDialog(context, ref),
        backgroundColor: primaryColor,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Добавить'),
      ),
      body: RefreshIndicator(
        color: primaryColor,
        onRefresh: () async => ref.invalidate(ownerServicesProvider),
        child: servicesAsync.when(
          loading: () => const LoadingWidget(),
          error: (e, _) => AppErrorWidget(
            message: 'Не удалось загрузить услуги',
            onRetry: () => ref.invalidate(ownerServicesProvider),
          ),
          data: (services) {
            if (services.isEmpty) {
              return const EmptyWidget(
                message: 'Услуги не добавлены.\nДобавьте первую услугу!',
                icon: Icons.content_cut_outlined,
              );
            }
            return ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: services.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (_, index) => _ServiceTile(
                service: services[index],
                onEdit: () => _showEditServiceDialog(
                    context, ref, services[index]),
                onDelete: () =>
                    _deleteService(context, ref, services[index].id),
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _showAddServiceDialog(
      BuildContext context, WidgetRef ref) async {
    final nameCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final durationCtrl = TextEditingController(text: '60');
    final descCtrl = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Новая услуга'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Название *'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: priceCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Цена (₽) *'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: durationCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Длит. (мин)'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Описание'),
                maxLines: 2,
              ),
            ],
          ),
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

    if (result == true &&
        nameCtrl.text.trim().isNotEmpty &&
        priceCtrl.text.trim().isNotEmpty &&
        context.mounted) {
      try {
        final client = ref.read(apiClientProvider);
        await client.dio.post(
          ApiEndpoints.ownerServices,
          data: {
            'name': nameCtrl.text.trim(),
            'price': double.tryParse(priceCtrl.text.trim()) ?? 0.0,
            'duration_minutes':
                int.tryParse(durationCtrl.text.trim()) ?? 60,
            'description': descCtrl.text.trim().isEmpty
                ? null
                : descCtrl.text.trim(),
          },
        );
        ref.invalidate(ownerServicesProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Услуга добавлена'),
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
    priceCtrl.dispose();
    durationCtrl.dispose();
    descCtrl.dispose();
  }

  Future<void> _showEditServiceDialog(
      BuildContext context, WidgetRef ref, Service service) async {
    final nameCtrl = TextEditingController(text: service.name);
    final priceCtrl =
        TextEditingController(text: service.price.toStringAsFixed(0));
    final durationCtrl =
        TextEditingController(text: service.durationMinutes.toString());
    final descCtrl =
        TextEditingController(text: service.description ?? '');

    final result = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Редактировать услугу'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: 'Название'),
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: priceCtrl,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(labelText: 'Цена (₽)'),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: TextField(
                      controller: durationCtrl,
                      keyboardType: TextInputType.number,
                      decoration:
                          const InputDecoration(labelText: 'Длит. (мин)'),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              TextField(
                controller: descCtrl,
                decoration: const InputDecoration(labelText: 'Описание'),
                maxLines: 2,
              ),
            ],
          ),
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
            child: const Text('Сохранить'),
          ),
        ],
      ),
    );

    if (result == true && context.mounted) {
      try {
        final client = ref.read(apiClientProvider);
        await client.dio.put(
          ApiEndpoints.ownerServiceById(service.id),
          data: {
            'name': nameCtrl.text.trim(),
            'price': double.tryParse(priceCtrl.text.trim()) ?? service.price,
            'duration_minutes':
                int.tryParse(durationCtrl.text.trim()) ??
                    service.durationMinutes,
            'description': descCtrl.text.trim().isEmpty
                ? null
                : descCtrl.text.trim(),
          },
        );
        ref.invalidate(ownerServicesProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Услуга обновлена'),
              backgroundColor: successColor,
            ),
          );
        }
      } catch (_) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Ошибка при обновлении'),
              backgroundColor: errorColor,
            ),
          );
        }
      }
    }
    nameCtrl.dispose();
    priceCtrl.dispose();
    durationCtrl.dispose();
    descCtrl.dispose();
  }

  Future<void> _deleteService(
      BuildContext context, WidgetRef ref, int serviceId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Удалить услугу?'),
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
        await client.dio.delete(ApiEndpoints.ownerServiceById(serviceId));
        ref.invalidate(ownerServicesProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Услуга удалена')));
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

class _ServiceTile extends StatelessWidget {
  final Service service;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ServiceTile({
    required this.service,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceColor,
        borderRadius: BorderRadius.circular(14),
        boxShadow: cardShadow,
      ),
      child: Row(
        children: [
          // Category icon
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(
              Icons.content_cut_outlined,
              color: primaryColor,
              size: 22,
            ),
          ),
          const SizedBox(width: 14),
          // Info
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
                const SizedBox(height: 3),
                Text(
                  service.durationFormatted,
                  style: const TextStyle(
                    fontSize: 13,
                    color: textSecondary,
                  ),
                ),
                if (service.description != null &&
                    service.description!.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    service.description!,
                    style: const TextStyle(
                      fontSize: 12,
                      color: textSecondary,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ],
            ),
          ),
          // Price
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                service.priceFormatted,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: primaryColor,
                ),
              ),
              const SizedBox(height: 4),
              // Actions
              Row(
                children: [
                  GestureDetector(
                    onTap: onEdit,
                    child: const Icon(
                      Icons.edit_outlined,
                      color: textSecondary,
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 10),
                  GestureDetector(
                    onTap: onDelete,
                    child: const Icon(
                      Icons.delete_outline,
                      color: errorColor,
                      size: 18,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }
}
