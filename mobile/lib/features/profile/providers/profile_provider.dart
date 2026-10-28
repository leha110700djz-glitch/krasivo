import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../features/auth/providers/auth_provider.dart';
import '../../../shared/models/user.dart';

class ProfileNotifier extends StateNotifier<AsyncValue<void>> {
  final ApiClient _apiClient;
  final Ref _ref;

  ProfileNotifier(this._apiClient, this._ref)
      : super(const AsyncValue.data(null));

  Future<bool> updateProfile({
    String? name,
    String? email,
    String? bio,
  }) async {
    state = const AsyncValue.loading();
    try {
      final data = <String, dynamic>{};
      if (name != null) data['name'] = name;
      if (email != null) data['email'] = email;
      if (bio != null) data['bio'] = bio;

      final response = await _apiClient.dio.put(
        ApiEndpoints.updateProfile,
        data: data,
      );
      final user = User.fromJson(response.data as Map<String, dynamic>);
      _ref.read(authProvider.notifier).updateUser(user);
      state = const AsyncValue.data(null);
      return true;
    } on DioException catch (e) {
      state = AsyncValue.error(e.userMessage, StackTrace.current);
      return false;
    } catch (e) {
      state = AsyncValue.error('Ошибка обновления профиля', StackTrace.current);
      return false;
    }
  }

  Future<bool> uploadAvatar(XFile imageFile) async {
    state = const AsyncValue.loading();
    try {
      final formData = FormData.fromMap({
        'avatar': await MultipartFile.fromFile(
          imageFile.path,
          filename: imageFile.name,
        ),
      });

      final response = await _apiClient.dio.post(
        ApiEndpoints.uploadAvatar,
        data: formData,
        options: Options(contentType: 'multipart/form-data'),
      );
      final user = User.fromJson(response.data as Map<String, dynamic>);
      _ref.read(authProvider.notifier).updateUser(user);
      state = const AsyncValue.data(null);
      return true;
    } on DioException catch (e) {
      state = AsyncValue.error(e.userMessage, StackTrace.current);
      return false;
    } catch (e) {
      state = AsyncValue.error('Ошибка загрузки аватара', StackTrace.current);
      return false;
    }
  }

  Future<bool> changePassword(
      String currentPassword, String newPassword) async {
    state = const AsyncValue.loading();
    try {
      await _apiClient.dio.put(
        '/profile/password',
        data: {
          'current_password': currentPassword,
          'new_password': newPassword,
        },
      );
      state = const AsyncValue.data(null);
      return true;
    } on DioException catch (e) {
      state = AsyncValue.error(e.userMessage, StackTrace.current);
      return false;
    } catch (e) {
      state = AsyncValue.error('Ошибка смены пароля', StackTrace.current);
      return false;
    }
  }
}

final profileNotifierProvider =
    StateNotifierProvider<ProfileNotifier, AsyncValue<void>>((ref) {
  final apiClient = ref.read(apiClientProvider);
  return ProfileNotifier(apiClient, ref);
});
