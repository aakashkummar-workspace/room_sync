import '../models/models.dart';
import 'supabase_db_service.dart';

class ChoreService {
  Future<ChoreModel> createChore(String title, dynamic assignedTo, DateTime dueDate) async {
    final userId = CurrentUser.id;
    final roomId = CurrentUser.roomId;
    final userName = CurrentUser.name ?? '';
    if (userId == null || roomId == null) throw Exception('Not authenticated');

    // Look up assignee name
    final members = await SupabaseDB.getRoomMembers(roomId);
    final assignee = members.firstWhere(
      (u) => u['id'].toString() == assignedTo.toString(),
      orElse: () => {'name': 'Unknown'},
    );

    final chore = await SupabaseDB.addChore({
      'room_id': roomId,
      'title': title,
      'assigned_to': assignedTo.toString(),
      'assigned_to_name': assignee['name'] ?? 'Unknown',
      'created_by': userId,
      'due_date': dueDate.toIso8601String(),
      'status': 'pending',
    });

    // Create notification
    if (assignedTo.toString() != userId) {
      await SupabaseDB.addNotification({
        'user_id': assignedTo.toString(),
        'title': 'New Task',
        'message': '$userName assigned you "$title"',
        'type': 'chore',
        'is_read': false,
      });
    }

    return ChoreModel.fromJson(chore);
  }

  Future<List<ChoreModel>> getRoomChores(int roomId) async {
    final chores = await SupabaseDB.getChores(roomId);
    return chores.map((c) => ChoreModel.fromJson(c)).toList();
  }

  Future<ChoreModel> updateStatus(int choreId, String status) async {
    await SupabaseDB.updateChoreStatus(choreId, status);
    // Fetch updated chore — re-query from the list
    final roomId = CurrentUser.roomId;
    if (roomId == null) throw Exception('No room');
    final chores = await SupabaseDB.getChores(roomId);
    final updated = chores.firstWhere((c) => c['id'] == choreId);
    return ChoreModel.fromJson(updated);
  }

  Future<void> deleteChore(int choreId) async {
    await SupabaseDB.deleteChore(choreId);
  }
}
