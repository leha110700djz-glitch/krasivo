import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../features/profile/providers/profile_provider.dart';
import '../../../shared/widgets/app_button.dart';
import '../../../shared/widgets/app_text_field.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _bioController;
  final _picker = ImagePicker();
  bool _hasChanges = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).valueOrNull;
    _nameController = TextEditingController(text: user?.name ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
    _bioController = TextEditingController(text: user?.bio ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _bioController.dispose();
    super.dispose();
  }

  Future<void> _pickAvatar() async {
    final image = await _picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 85,
      maxWidth: 400,
      maxHeight: 400,
    );
    if (image != null) {
      final success = await ref
          .read(profileNotifierProvider.notifier)
          .uploadAvatar(image);
      if (success && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Аватар обновлён'),
            backgroundColor: successColor,
          ),
        );
      }
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;

    final success = await ref.read(profileNotifierProvider.notifier).updateProfile(
          name: _nameController.text.trim(),
          email: _emailController.text.trim().isEmpty
              ? null
              : _emailController.text.trim(),
          bio: _bioController.text.trim().isEmpty
              ? null
              : _bioController.text.trim(),
        );

    if (mounted) {
      if (success) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Профиль обновлён'),
            backgroundColor: successColor,
          ),
        );
        setState(() => _hasChanges = false);
      } else {
        final error = ref.read(profileNotifierProvider).error?.toString();
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error ?? 'Ошибка обновления'),
            backgroundColor: errorColor,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).valueOrNull;
    final profileState = ref.watch(profileNotifierProvider);
    final isLoading = profileState.isLoading;

    return Scaffold(
      appBar: AppBar(
        title: const Text(AppStrings.editProfile),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        onChanged: () => setState(() => _hasChanges = true),
        child: ListView(
          padding: const EdgeInsets.all(24),
          children: [
            // Avatar picker
            Center(
              child: GestureDetector(
                onTap: _pickAvatar,
                child: Stack(
                  children: [
                    CircleAvatar(
                      radius: 52,
                      backgroundColor: primaryColor.withOpacity(0.1),
                      child: user?.name.isNotEmpty == true
                          ? Text(
                              user!.name[0].toUpperCase(),
                              style: const TextStyle(
                                fontSize: 38,
                                fontWeight: FontWeight.w700,
                                color: primaryColor,
                              ),
                            )
                          : null,
                    ),
                    Positioned(
                      bottom: 4,
                      right: 4,
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: const BoxDecoration(
                          color: primaryColor,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt_outlined,
                          size: 16,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 8),
            const Center(
              child: Text(
                'Нажмите, чтобы изменить фото',
                style: TextStyle(fontSize: 13, color: textSecondary),
              ),
            ),
            const SizedBox(height: 28),
            AppTextField(
              label: AppStrings.name,
              controller: _nameController,
              prefix: const Icon(Icons.person_outline, color: textSecondary, size: 20),
              validator: (v) {
                if (v == null || v.trim().isEmpty) return AppStrings.nameRequired;
                return null;
              },
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: AppStrings.phone,
              controller: TextEditingController(text: user?.phone ?? ''),
              prefix: const Icon(Icons.phone_outlined, color: textSecondary, size: 20),
              enabled: false,
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: 'Email (необязательно)',
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              prefix: const Icon(Icons.email_outlined, color: textSecondary, size: 20),
            ),
            const SizedBox(height: 16),
            AppTextField(
              label: AppStrings.bio,
              hint: AppStrings.bioHint,
              controller: _bioController,
              maxLines: 3,
            ),
            const SizedBox(height: 28),
            AppButton(
              label: AppStrings.save,
              onPressed: _save,
              isLoading: isLoading,
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            // Change password section
            const Text(
              AppStrings.changePassword,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w700,
                color: textPrimary,
              ),
            ),
            const SizedBox(height: 14),
            AppButton(
              label: AppStrings.changePassword,
              onPressed: () => _showChangePasswordDialog(context, ref),
              variant: AppButtonVariant.outlined,
            ),
          ],
        ),
      ),
    );
  }

  void _showChangePasswordDialog(BuildContext context, WidgetRef ref) {
    final currentPwdCtrl = TextEditingController();
    final newPwdCtrl = TextEditingController();
    final formKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text(AppStrings.changePassword),
        content: Form(
          key: formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AppTextField(
                label: 'Текущий пароль',
                controller: currentPwdCtrl,
                obscureText: true,
                validator: (v) =>
                    v == null || v.isEmpty ? AppStrings.passwordRequired : null,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Новый пароль',
                controller: newPwdCtrl,
                obscureText: true,
                validator: (v) {
                  if (v == null || v.isEmpty) return AppStrings.passwordRequired;
                  if (v.length < 6) return AppStrings.passwordTooShort;
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Отмена'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (!formKey.currentState!.validate()) return;
              Navigator.pop(context);
              final success = await ref
                  .read(profileNotifierProvider.notifier)
                  .changePassword(
                    currentPwdCtrl.text,
                    newPwdCtrl.text,
                  );
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success
                        ? 'Пароль изменён'
                        : 'Ошибка смены пароля'),
                    backgroundColor: success ? successColor : errorColor,
                  ),
                );
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: primaryColor,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
              elevation: 0,
            ),
            child: const Text(AppStrings.save),
          ),
        ],
      ),
    );
  }
}
