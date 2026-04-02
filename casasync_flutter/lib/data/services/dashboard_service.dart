import 'supabase_db_service.dart';

class DashboardService {
  Future<Map<String, dynamic>> getSummary() async {
    // Ensure we have a current profile
    if (CurrentUser.profile == null) {
      final profile = await SupabaseDB.getCurrentProfile();
      if (profile == null) throw Exception('Not authenticated');
      CurrentUser.profile = profile;
    }

    final userId = CurrentUser.id;
    final roomId = CurrentUser.roomId;
    final userName = CurrentUser.name ?? '';

    if (roomId == null) {
      return {
        'user_name': userName,
        'room': null,
        'room_id': null,
        'room_members': <Map<String, dynamic>>[],
        'total_room_expenses': 0.0,
        'my_spending': 0.0,
        'liability': 0.0,
        'receivable': 0.0,
        'pending_chores_count': 0,
        'completed_chores_count': 0,
        'chore_score': 100,
        'inventory_count': 0,
        'members_count': 0,
        'recent_notes': <Map<String, dynamic>>[],
        'notifications_count': 0,
        'recent_notices': <Map<String, dynamic>>[],
        'active_polls': <Map<String, dynamic>>[],
      };
    }

    // Fetch all data in parallel
    final results = await Future.wait([
      SupabaseDB.getRoom(roomId),                // 0: room
      SupabaseDB.getRoomMembers(roomId),          // 1: members
      SupabaseDB.getExpenses(roomId),             // 2: expenses
      SupabaseDB.getChores(roomId),               // 3: chores
      SupabaseDB.getInventory(roomId),            // 4: inventory
      SupabaseDB.getNotes(roomId),                // 5: notes
      SupabaseDB.getUnreadCount(),                // 6: notif count
      SupabaseDB.getNotices(roomId),              // 7: notices
      SupabaseDB.getPolls(roomId),                // 8: polls
    ]);

    final room = results[0] as Map<String, dynamic>?;
    final members = results[1] as List<Map<String, dynamic>>;
    final expenses = results[2] as List<Map<String, dynamic>>;
    final chores = results[3] as List<Map<String, dynamic>>;
    final inventory = results[4] as List<Map<String, dynamic>>;
    final notes = results[5] as List<Map<String, dynamic>>;
    final notificationsCount = results[6] as int;
    final noticesList = results[7] as List<Map<String, dynamic>>;
    final pollsList = results[8] as List<Map<String, dynamic>>;

    // Expense calculations
    final totalExpenses = expenses.fold<double>(0, (sum, e) => sum + ((e['amount'] ?? 0) as num).toDouble());
    final myExpenses = expenses.where((e) => e['paid_by']?.toString() == userId);
    final mySpending = myExpenses.fold<double>(0, (sum, e) => sum + ((e['amount'] ?? 0) as num).toDouble());

    // Fetch all splits in parallel (instead of one-by-one)
    double liability = 0;
    double receivable = 0;
    if (expenses.isNotEmpty) {
      final splitFutures = expenses.map((e) => SupabaseDB.getSplits(e['id'] as int).catchError((_) => <Map<String, dynamic>>[]));
      final allSplits = await Future.wait(splitFutures);

      for (int i = 0; i < expenses.length; i++) {
        final e = expenses[i];
        final splits = allSplits[i];
        for (var s in splits) {
          final splitUserId = s['user_id']?.toString();
          final paidById = e['paid_by']?.toString();
          final isPaid = s['is_paid'] == true;
          final splitAmount = ((s['amount'] ?? 0) as num).toDouble();
          if (splitUserId == userId && !isPaid && paidById != userId) {
            liability += splitAmount;
          }
          if (paidById == userId && splitUserId != userId && !isPaid) {
            receivable += splitAmount;
          }
        }
      }
    }

    // Chore stats
    final pendingChores = chores.where((c) => c['status'] == 'pending').length;
    final completedChores = chores.where((c) => c['status'] == 'completed').length;
    final choreScore = chores.isEmpty ? 100 : ((completedChores / chores.length) * 100).round();

    // Notes sorted
    notes.sort((a, b) => (b['created_at'] ?? '').compareTo(a['created_at'] ?? ''));

    return {
      'user_name': userName,
      'room': room,
      'room_id': roomId,
      'room_members': members,
      'total_room_expenses': totalExpenses,
      'my_spending': mySpending,
      'liability': liability,
      'receivable': receivable,
      'pending_chores_count': pendingChores,
      'completed_chores_count': completedChores,
      'chore_score': choreScore,
      'inventory_count': inventory.length,
      'members_count': members.length,
      'recent_notes': notes,
      'notifications_count': notificationsCount,
      'recent_notices': noticesList.reversed.take(3).toList(),
      'active_polls': pollsList.where((p) => p['status'] == 'active').toList(),
    };
  }
}
