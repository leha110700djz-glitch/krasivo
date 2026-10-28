import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../shared/models/salon.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';
import '../../../shared/widgets/loading_widget.dart';
import '../../../shared/widgets/error_widget.dart';

final ownerSalonProvider = FutureProvider<Salon>((ref) async {
  final client = ref.read(apiClientProvider);
  final response = await client.dio.get(ApiEndpoints.ownerSalon);
  return Salon.fromJson(response.data as Map<String, dynamic>);
});

class ManageSalonScreen extends ConsumerStatefulWidget {
  const ManageSalonScreen({super.key});

  @override
  ConsumerState<ManageSalonScreen> createState() => _ManageSalonScreenState();
}

class _ManageSalonScreenState extends ConsumerState<ManageSalonScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _phoneController = TextEditingController();
  final _workingHoursController = TextEditingController();
  bool _isLoading = false;
  bool _initialized = false;

  void _initFromSalon(Salon salon) {
    if (_initialized) return;
    _nameController.text = salon.name;
    _descriptionController.text = salon.description ?? '';
    _addressController.text = salon.address;
    _cityController.text = salon.city;
    _phoneController.text = salon.phone ?? '';
    _workingHoursController.text = salon.workingHours ?? '';
    _initialized = true;
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _phoneController.dispose();
    _workingHoursController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    try {
      final client = ref.read(apiClientProvider);
      await client.dio.put(
        ApiEndpoints.ownerSalon,
        data: {
          'name': _nameController.text.trim(),
          'description': _descriptionController.text.trim(),
          'address': _addressController.text.trim(),
          'city': _cityController.text.trim(),
          'phone': _phoneController.text.trim(),
          'working_hours': _workingHoursController.text.trim(),
        },
      );
      ref.invalidate(ownerSalonProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Данные салона обновлены'),
            backgroundColor: successColor,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Ошибка сохранения'),
            backgroundColor: errorColor,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final salonAsync = ref.watch(ownerSalonProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.mySalon),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: salonAsync.when(
        loading: () => const LoadingWidget(),
        error: (e, _) => AppErrorWidget(
          message: 'Не удалось загрузить данные салона',
          onRetry: () => ref.invalidate(ownerSalonProvider),
        ),
        data: (salon) {
          _initFromSalon(salon);
          return Form(
            key: _formKey,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                AppTextField(
                  label: 'Название салона',
                  controller: _nameController,
                  prefix: const Icon(Icons.store_outlined,
                      color: textSecondary, size: 20),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Введите название' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Описание',
                  controller: _descriptionController,
                  maxLines: 4,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Адрес',
                  controller: _addressController,
                  prefix: const Icon(Icons.location_on_outlined,
                      color: textSecondary, size: 20),
                  validator: (v) =>
                      v == null || v.trim().isEmpty ? 'Введите адрес' : null,
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Город',
                  controller: _cityController,
                  prefix: const Icon(Icons.location_city_outlined,
                      color: textSecondary, size: 20),
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Телефон',
                  controller: _phoneController,
                  keyboardType: TextInputType.phone,
                  prefix: const Icon(Icons.phone_outlined,
                      color: textSecondary, size: 20),
                ),
                const SizedBox(height: 16),
                AppTextField(
                  label: 'Часы работы',
                  hint: 'Пн-Вс 10:00-21:00',
                  controller: _workingHoursController,
                  prefix: const Icon(Icons.access_time,
                      color: textSecondary, size: 20),
                ),
                const SizedBox(height: 28),
                AppButton(
                  label: AppStrings.save,
                  onPressed: _save,
                  isLoading: _isLoading,
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
