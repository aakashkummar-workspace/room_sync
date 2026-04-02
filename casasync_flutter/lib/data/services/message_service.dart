import '../models/models.dart';
import 'supabase_db_service.dart';

class MessageService {
  Future<List<MessageModel>> getMessages(int roomId) async {
    final messages = await SupabaseDB.getMessages(roomId);
    final result = messages.map((m) => MessageModel.fromJson(m)).toList();
    result.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return result;
  }

  Future<MessageModel> sendMessage(int roomId, String content) async {
    final userId = CurrentUser.id;
    final userName = CurrentUser.name ?? '';
    if (userId == null) throw Exception('Not authenticated');

    final msg = await SupabaseDB.sendMessage({
      'room_id': roomId,
      'sender_id': userId,
      'sender_name': userName,
      'content': content,
    });
    return MessageModel.fromJson(msg);
  }

  Future<MessageModel> sendMessageWithFile(int roomId, String fileName, String fileData, {String? content}) async {
    final userId = CurrentUser.id;
    final userName = CurrentUser.name ?? '';
    if (userId == null) throw Exception('Not authenticated');

    final msg = await SupabaseDB.sendMessage({
      'room_id': roomId,
      'sender_id': userId,
      'sender_name': userName,
      'content': content ?? fileName,
      'file_url': fileData,
      'file_name': fileName,
    });
    return MessageModel.fromJson(msg);
  }

  Future<void> deleteMessage(int messageId) async {
    await SupabaseDB.deleteMessage(messageId);
  }
}
