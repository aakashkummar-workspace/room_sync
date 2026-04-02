import '../models/models.dart';
import 'supabase_db_service.dart';

class NotificationService {
  Future<List<NotificationModel>> getNotifications() async {
    final list = await SupabaseDB.getNotifications();
    return list.map((n) => NotificationModel.fromJson(n)).toList();
  }

  Future<int> getUnreadCount() async {
    return await SupabaseDB.getUnreadCount();
  }

  Future<void> markAllRead() async {
    await SupabaseDB.markAllRead();
  }

  Future<void> markRead(int id) async {
    await SupabaseDB.markNotificationRead(id);
  }
}
