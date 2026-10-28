import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/api/api_endpoints.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/user.dart';

class AuthNotifier extends StateNotifier<AsyncValue<User?>> {
  final ApiClient _apiClient;
  final SecureStorage _storage;

  AuthNotifier(this._apiClient, this._storage) : super(const AsyncValue.loading()) {
    _initialize();
  }

  Future<void> _initialize() async {
    try {
      final token = await _storage.getAccessToken();
      if (token == null || token.isEmpty) {
        state = const AsyncValue.data(null);
        return;
      }
      final response = await _apiClient.dio.get(ApiEndpoints.me);
      final user = User.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(user);
    } catch (e) {
      state = const AsyncValue.data(null);
    }
  }

  Future<void> login(String phone, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.login,
        data: {'phone': phone, 'password': password},
      );
      final data = response.data as Map<String, dynamic>;
      await _storage.saveTokens(
        data['access_token'] as String,
        data['refresh_token'] as String,
      );
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      state = AsyncValue.data(user);
    } on DioException catch (e) {
      state = AsyncValue.error(e.userMessage, StackTrace.current);
      rethrow;
    } catch (e) {
      state = AsyncValue.error(e.toString(), StackTrace.current);
      rethrow;
    }
  }

  Future<void> register(
    String name,
    String phone,
    String password,
    String role,
  ) async {
    state = const AsyncValue.loading();
    try {
      final response = await _apiClient.dio.post(
        ApiEndpoints.register,
        data: {
          'name': name,
          'phone': phone,
          'password': password,
          'role': role,
        },
      );
      final data = response.data as Map<String, dynamic>;
      await _storage.saveTokens(
        data['access_token'] as String,
        data['refresh_token'] as String,
      );
      final user = User.fromJson(data['user'] as Map<String, dynamic>);
      state = AsyncValue.data(user);
    } on DioException catch (e) {
      state = AsyncValue.error(e.userMessage, StackTrace.current);
      rethrow;
    } catch (e) {
      state = AsyncValue.error(e.toString(), StackTrace.current);
      rethrow;
    }
  }

  Future<void> logout() async {
    try {
      await _apiClient.dio.post(ApiEndpoints.logout);
    } catch (_) {}
    await _storage.clearTokens();
    state = const AsyncValue.data(null);
  }

  Future<void> updateUser(User user) async {
    state = AsyncValue.data(user);
  }

  Future<void> refreshProfile() async {
    try {
      final response = await _apiClient.dio.get(ApiEndpoints.me);
      final user = User.fromJson(response.data as Map<String, dynamic>);
      state = AsyncValue.data(user);
    } catch (_) {}
  }
}

final authProvider =
    StateNotifierProvider<AuthNotifier, AsyncValue<User?>>((ref) {
  final apiClient = ref.read(apiClientProvider);
  final storage = ref.read(secureStorageProvider);
  return AuthNotifier(apiClient, storage);
});
