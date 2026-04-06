import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class LocalNotificationService {
  static final _plugin = FlutterLocalNotificationsPlugin();
  static bool _initialized = false;
  static int _lastKnownCount = 0;

  static Future<void> init() async {
    if (_initialized) return;
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const settings = InitializationSettings(android: androidSettings);
    await _plugin.initialize(settings);
    _initialized = true;
  }

  static Future<void> showIfNew(int unreadCount, String? latestTitle, String? latestMessage) async {
    if (!_initialized) await init();
    // Only show notification if count increased
    if (unreadCount > _lastKnownCount && latestTitle != null) {
      await _plugin.show(
        unreadCount,
        latestTitle,
        latestMessage ?? '',
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'casasync_notifications',
            'CasaSync Notifications',
            channelDescription: 'Notifications for CasaSync app',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
        ),
      );
    }
    _lastKnownCount = unreadCount;
  }

  static void resetCount() => _lastKnownCount = 0;
}
