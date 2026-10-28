import 'package:dio/dio.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../api/api_client.dart';
import '../api/api_endpoints.dart';

/// Handles Firebase Cloud Messaging token registration and
/// foreground message callbacks.
///
/// Call [PushHandler.init] once from main() after Firebase is initialized.
class PushHandler {
  PushHandler._();

  /// Initialize FCM: request permission, get token, register it with the backend.
  static Future<void> init(ProviderContainer container) async {
    try {
      final messaging = FirebaseMessaging.instance;

      // Request permission (iOS requires explicit request)
      final settings = await messaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        debugPrint('[Push] Permission denied by user');
        return;
      }

      // Get FCM token
      final token = await messaging.getToken();
      if (token == null) {
        debugPrint('[Push] FCM token is null');
        return;
      }
      debugPrint('[Push] FCM token: $token');

      // Register token with the backend
      await _registerToken(container, token);

      // Listen for token refreshes
      messaging.onTokenRefresh.listen((newToken) async {
        debugPrint('[Push] Token refreshed: $newToken');
        await _registerToken(container, newToken);
      });

      // Handle foreground messages
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint(
          '[Push] Foreground message: ${message.notification?.title}',
        );
        // TODO: show in-app notification banner
      });

      // Handle notification tap when app is in background / terminated
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint(
          '[Push] Notification opened app: ${message.notification?.title}',
        );
        // TODO: navigate based on message.data
      });
    } catch (e) {
      debugPrint('[Push] Initialization error: $e');
    }
  }

  static Future<void> _registerToken(
      ProviderContainer container, String token) async {
    try {
      final client = container.read(apiClientProvider);
      await client.dio.post(
        ApiEndpoints.registerPush,
        data: {
          'token': token,
          'platform': defaultTargetPlatform == TargetPlatform.iOS
              ? 'ios'
              : 'android',
        },
      );
      debugPrint('[Push] Token registered successfully');
    } on DioException catch (e) {
      // 401 means user not logged in yet — this is expected; token will be
      // re-registered after login via a separate call.
      if (e.response?.statusCode != 401) {
        debugPrint('[Push] Token registration failed: ${e.userMessage}');
      }
    } catch (e) {
      debugPrint('[Push] Token registration error: $e');
    }
  }
}

/// Background message handler — must be a top-level function.
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('[Push] Background message: ${message.notification?.title}');
}
