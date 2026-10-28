import 'dart:io';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../storage/secure_storage.dart';
import 'api_endpoints.dart';

// Android emulator routes to host via 10.0.2.2; real device uses LAN IP
const _baseUrlAndroid = 'http://10.0.2.2:8000/api/v1';
const _baseUrlIOS = 'http://localhost:8000/api/v1';
// For a physical Android device on the same network use the host LAN IP:
// const _baseUrlAndroid = 'http://172.17.150.169:8000/api/v1';
const _uploadsAndroid = 'http://10.0.2.2:8000';
const _uploadsIOS = 'http://localhost:8000';

String get apiBaseUrl =>
    Platform.isAndroid ? _baseUrlAndroid : _baseUrlIOS;

String get uploadsBaseUrl =>
    Platform.isAndroid ? _uploadsAndroid : _uploadsIOS;

String resolveImageUrl(String? path) {
  if (path == null || path.isEmpty) return '';
  if (path.startsWith('http')) return path;
  return '$uploadsBaseUrl$path';
}

final secureStorageProvider = Provider<SecureStorage>((_) => SecureStorage());

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.read(secureStorageProvider);
  return ApiClient(storage);
});

class ApiClient {
  late final Dio dio;
  final SecureStorage _storage;

  ApiClient(this._storage) {
    dio = Dio(
      BaseOptions(
        baseUrl: apiBaseUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 20),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );
    dio.interceptors.add(_AuthInterceptor(_storage, dio));
  }
}

class _AuthInterceptor extends QueuedInterceptor {
  final SecureStorage _storage;
  final Dio _dio;
  bool _isRefreshing = false;

  _AuthInterceptor(this._storage, this._dio);

  @override
  void onRequest(
      RequestOptions options, RequestInterceptorHandler handler) async {
    final token = await _storage.getAccessToken();
    if (token != null && token.isNotEmpty) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  void onError(DioException err, ErrorInterceptorHandler handler) async {
    if (err.response?.statusCode == 401 && !_isRefreshing) {
      _isRefreshing = true;
      try {
        final refreshToken = await _storage.getRefreshToken();
        if (refreshToken != null && refreshToken.isNotEmpty) {
          final refreshDio = Dio(
            BaseOptions(
              baseUrl: apiBaseUrl,
              headers: {'Content-Type': 'application/json'},
            ),
          );
          final response = await refreshDio.post(
            ApiEndpoints.refresh,
            data: {'refresh_token': refreshToken},
          );
          final newAccessToken = response.data['access_token'] as String;
          final newRefreshToken =
              response.data['refresh_token'] as String? ?? refreshToken;
          await _storage.saveTokens(newAccessToken, newRefreshToken);

          final retryOptions = err.requestOptions;
          retryOptions.headers['Authorization'] = 'Bearer $newAccessToken';
          final retryResponse = await _dio.fetch(retryOptions);
          _isRefreshing = false;
          handler.resolve(retryResponse);
          return;
        }
      } catch (_) {
        await _storage.clearTokens();
      }
      _isRefreshing = false;
    }
    handler.next(err);
  }
}

// Convenience extension for parsing errors
extension DioErrorMessage on DioException {
  String get userMessage {
    if (response != null) {
      final data = response!.data;
      if (data is Map) {
        return data['detail']?.toString() ??
            data['message']?.toString() ??
            'Ошибка сервера ${response!.statusCode}';
      }
    }
    if (type == DioExceptionType.connectionTimeout ||
        type == DioExceptionType.receiveTimeout ||
        type == DioExceptionType.sendTimeout) {
      return 'Превышено время ожидания. Проверьте интернет-соединение.';
    }
    if (type == DioExceptionType.connectionError) {
      return 'Нет соединения с сервером';
    }
    return 'Что-то пошло не так';
  }
}
