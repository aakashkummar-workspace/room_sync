import 'package:supabase_flutter/supabase_flutter.dart';

/// Holds the current authenticated user's Supabase profile in memory.
/// Set by AuthService on login/signup/getMe; read by all other services.
class CurrentUser {
  static Map<String, dynamic>? profile;
  static String? get id => profile?['id']?.toString();
  static String? get name => profile?['name']?.toString();
  static int? get roomId => profile?['room_id'] as int?;
  static String? get role => profile?['role']?.toString();
  static String? get email => profile?['email']?.toString();
  static bool get isAdmin => role == 'admin';
  static void clear() => profile = null;
}

/// Central service for all Supabase database operations.
/// All data goes to Supabase — no local mock storage.
class SupabaseDB {
  static SupabaseClient get _client => Supabase.instance.client;
  static SupabaseClient get client => _client;
  static String? get currentUserId => _client.auth.currentUser?.id;

  // ─── AUTH ───
  static Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _client.auth.signInWithPassword(email: email, password: password);
    if (res.user == null) throw Exception('Invalid email or password');
    try {
      return await getProfile(res.user!.id);
    } catch (_) {
      // Profile might not exist — create it
      await _client.from('profiles').upsert({
        'id': res.user!.id,
        'name': res.user!.userMetadata?['name'] ?? email.split('@').first,
        'email': email,
        'role': 'admin',
      });
      return await getProfile(res.user!.id);
    }
  }

  static Future<Map<String, dynamic>> signup(String name, String email, String password) async {
    final res = await _client.auth.signUp(email: email, password: password, data: {'name': name});
    if (res.user == null) throw Exception('Signup failed');
    // Create profile (trigger may be disabled)
    await _client.from('profiles').upsert({'id': res.user!.id, 'name': name, 'email': email, 'role': 'admin'});
    return await getProfile(res.user!.id);
  }

  static Future<void> signOut() async => await _client.auth.signOut();

  static Future<Map<String, dynamic>> getProfile(String userId) async {
    return await _client.from('profiles').select().eq('id', userId).single();
  }

  static Future<Map<String, dynamic>?> getCurrentProfile() async {
    final uid = currentUserId;
    if (uid == null) return null;
    try {
      return await getProfile(uid);
    } catch (_) {
      return null;
    }
  }

  static Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final uid = currentUserId;
    if (uid == null) throw Exception('Not authenticated');
    await _client.from('profiles').update(data).eq('id', uid);
    return await getProfile(uid);
  }

  // ─── ROOMS ───
  static Future<Map<String, dynamic>> createRoom(String name, String inviteCode) async {
    final uid = currentUserId;
    if (uid == null) throw Exception('Not authenticated');
    final room = await _client.from('rooms').insert({'name': name, 'invite_code': inviteCode, 'created_by': uid}).select().single();
    await _client.from('profiles').update({'room_id': room['id'], 'role': 'admin'}).eq('id', uid);
    return room;
  }

  static Future<Map<String, dynamic>> joinRoom(String inviteCode) async {
    final uid = currentUserId;
    if (uid == null) throw Exception('Not authenticated');
    final rooms = await _client.from('rooms').select().ilike('invite_code', inviteCode);
    if (rooms.isEmpty) throw Exception('Invalid invite code');
    final room = rooms.first;
    await _client.from('profiles').update({'room_id': room['id'], 'role': 'member'}).eq('id', uid);
    return room;
  }

  static Future<void> updateRoom(int roomId, Map<String, dynamic> data) async {
    await _client.from('rooms').update(data).eq('id', roomId);
  }

  static Future<void> removeMember(String userId) async {
    await _client.from('profiles').update({'room_id': null, 'role': 'member'}).eq('id', userId);
  }

  static Future<List<Map<String, dynamic>>> getRoomMembers(int roomId) async {
    return await _client.from('profiles').select().eq('room_id', roomId);
  }

  static Future<Map<String, dynamic>?> getRoom(int roomId) async {
    try {
      return await _client.from('rooms').select().eq('id', roomId).single();
    } catch (_) {
      return null;
    }
  }

  // ─── EXPENSES ───
  static Future<Map<String, dynamic>> addExpense(Map<String, dynamic> expense) async {
    return await _client.from('expenses').insert(expense).select().single();
  }

  static Future<List<Map<String, dynamic>>> getExpenses(int roomId) async {
    return await _client.from('expenses').select().eq('room_id', roomId).order('created_at');
  }

  static Future<void> deleteExpense(int id) async {
    await _client.from('expenses').delete().eq('id', id);
  }

  // ─── EXPENSE SPLITS ───
  static Future<void> addSplits(List<Map<String, dynamic>> splits) async {
    await _client.from('expense_splits').insert(splits);
  }

  static Future<List<Map<String, dynamic>>> getSplits(int expenseId) async {
    return await _client.from('expense_splits').select().eq('expense_id', expenseId);
  }

  static Future<void> settleSplit(int splitId) async {
    await _client.from('expense_splits').update({'is_paid': true}).eq('id', splitId);
  }

  // ─── CHORES ───
  static Future<Map<String, dynamic>> addChore(Map<String, dynamic> chore) async {
    return await _client.from('chores').insert(chore).select().single();
  }

  static Future<List<Map<String, dynamic>>> getChores(int roomId) async {
    return await _client.from('chores').select().eq('room_id', roomId).order('created_at');
  }

  static Future<void> updateChoreStatus(int id, String status) async {
    await _client.from('chores').update({'status': status}).eq('id', id);
  }

  static Future<void> deleteChore(int id) async {
    await _client.from('chores').delete().eq('id', id);
  }

  // ─── INVENTORY ───
  static Future<Map<String, dynamic>> addInventoryItem(Map<String, dynamic> item) async {
    return await _client.from('inventory').insert(item).select().single();
  }

  static Future<List<Map<String, dynamic>>> getInventory(int roomId) async {
    return await _client.from('inventory').select().eq('room_id', roomId).order('created_at');
  }

  static Future<void> updateInventoryItem(int id, Map<String, dynamic> data) async {
    await _client.from('inventory').update(data).eq('id', id);
  }

  static Future<void> deleteInventoryItem(int id) async {
    await _client.from('inventory').delete().eq('id', id);
  }

  // ─── NOTES ───
  static Future<Map<String, dynamic>> addNote(Map<String, dynamic> note) async {
    return await _client.from('notes').insert(note).select().single();
  }

  static Future<List<Map<String, dynamic>>> getNotes(int roomId) async {
    return await _client.from('notes').select().eq('room_id', roomId).order('created_at');
  }

  static Future<void> updateNote(int id, Map<String, dynamic> data) async {
    await _client.from('notes').update(data).eq('id', id);
  }

  static Future<void> deleteNote(int id) async {
    await _client.from('notes').delete().eq('id', id);
  }

  // ─── MESSAGES ───
  static Future<Map<String, dynamic>> sendMessage(Map<String, dynamic> msg) async {
    return await _client.from('messages').insert(msg).select().single();
  }

  static Future<List<Map<String, dynamic>>> getMessages(int roomId) async {
    return await _client.from('messages').select().eq('room_id', roomId).order('created_at');
  }

  static Future<void> deleteMessage(int id) async {
    await _client.from('messages').delete().eq('id', id);
  }

  // ─── DIRECT MESSAGES ───
  static Future<Map<String, dynamic>> sendDM(Map<String, dynamic> msg) async {
    return await _client.from('direct_messages').insert(msg).select().single();
  }

  static Future<List<Map<String, dynamic>>> getDMs(String user1, String user2) async {
    // Get messages where sender/receiver matches either direction
    final msgs = await _client.from('direct_messages').select()
        .or('and(sender_id.eq.$user1,receiver_id.eq.$user2),and(sender_id.eq.$user2,receiver_id.eq.$user1)')
        .order('created_at');
    return msgs;
  }

  static Future<List<Map<String, dynamic>>> getDMConversations(String userId) async {
    // Get latest message per conversation partner
    final sent = await _client.from('direct_messages').select().eq('sender_id', userId).order('created_at', ascending: false);
    final received = await _client.from('direct_messages').select().eq('receiver_id', userId).order('created_at', ascending: false);
    return [...sent, ...received];
  }

  // ─── HOUSE RULES ───
  static Future<Map<String, dynamic>> addRule(Map<String, dynamic> rule) async {
    return await _client.from('house_rules').insert(rule).select().single();
  }

  static Future<List<Map<String, dynamic>>> getRules(int roomId) async {
    return await _client.from('house_rules').select().eq('room_id', roomId);
  }

  static Future<void> updateRule(int id, String text) async {
    await _client.from('house_rules').update({'rule_text': text}).eq('id', id);
  }

  static Future<void> deleteRule(int id) async {
    await _client.from('house_rules').delete().eq('id', id);
  }

  // ─── NOTIFICATIONS ───
  static Future<void> addNotification(Map<String, dynamic> notif) async {
    await _client.from('notifications').insert(notif);
  }

  static Future<List<Map<String, dynamic>>> getNotifications() async {
    final uid = currentUserId;
    if (uid == null) return [];
    return await _client.from('notifications').select().eq('user_id', uid).order('created_at', ascending: false);
  }

  static Future<int> getUnreadCount() async {
    final uid = currentUserId;
    if (uid == null) return 0;
    final res = await _client.from('notifications').select('id').eq('user_id', uid).eq('is_read', false);
    return res.length;
  }

  static Future<void> markAllRead() async {
    final uid = currentUserId;
    if (uid == null) return;
    await _client.from('notifications').update({'is_read': true}).eq('user_id', uid);
  }

  static Future<void> markNotificationRead(int id) async {
    await _client.from('notifications').update({'is_read': true}).eq('id', id);
  }

  // ─── NOTICES ───
  static Future<void> addNotice(Map<String, dynamic> notice) async {
    await _client.from('notices').insert(notice);
  }

  static Future<List<Map<String, dynamic>>> getNotices(int roomId) async {
    return await _client.from('notices').select().eq('room_id', roomId).order('created_at');
  }

  static Future<void> deleteNotice(int id) async {
    await _client.from('notices').delete().eq('id', id);
  }

  // ─── POLLS ───
  static Future<Map<String, dynamic>> createPoll(Map<String, dynamic> poll) async {
    return await _client.from('polls').insert(poll).select().single();
  }

  static Future<List<Map<String, dynamic>>> getPolls(int roomId) async {
    return await _client.from('polls').select().eq('room_id', roomId).order('created_at');
  }

  static Future<List<Map<String, dynamic>>> getPollOptions(int pollId) async {
    return await _client.from('poll_options').select().eq('poll_id', pollId);
  }

  static Future<void> addPollOptions(List<Map<String, dynamic>> options) async {
    await _client.from('poll_options').insert(options);
  }

  static Future<void> votePoll(int optionId, List<String> votes) async {
    await _client.from('poll_options').update({'votes': votes}).eq('id', optionId);
  }

  static Future<void> closePoll(int id) async {
    await _client.from('polls').update({'status': 'closed'}).eq('id', id);
  }

  static Future<void> deletePoll(int id) async {
    await _client.from('polls').delete().eq('id', id);
  }

  // ─── JOIN REQUESTS ───
  static Future<Map<String, dynamic>> createJoinRequest(Map<String, dynamic> data) async {
    return await _client.from('join_requests').insert(data).select().single();
  }

  static Future<List<Map<String, dynamic>>> getJoinRequests(int roomId) async {
    return await _client.from('join_requests').select().eq('room_id', roomId).eq('status', 'pending').order('created_at', ascending: false);
  }

  static Future<void> updateJoinRequestStatus(int requestId, String status) async {
    await _client.from('join_requests').update({'status': status}).eq('id', requestId);
  }

  static Future<Map<String, dynamic>?> getJoinRequestByEmail(String email, int roomId) async {
    final results = await _client.from('join_requests').select().eq('email', email).eq('room_id', roomId).order('created_at', ascending: false).limit(1);
    return results.isNotEmpty ? results.first : null;
  }

  static Future<List<Map<String, dynamic>>> getMyJoinRequests(String email) async {
    return await _client.from('join_requests').select().eq('email', email).order('created_at', ascending: false);
  }

  static Stream<List<Map<String, dynamic>>> listenJoinRequests(int roomId) {
    return _client.from('join_requests').stream(primaryKey: ['id']).eq('room_id', roomId);
  }

  // ─── STORAGE ───
  static Future<String> uploadAvatar(String fileName, List<int> bytes) async {
    final path = 'avatars/$currentUserId/$fileName';
    await _client.storage.from('avatars').uploadBinary(path, bytes as dynamic, fileOptions: const FileOptions(upsert: true));
    return _client.storage.from('avatars').getPublicUrl(path);
  }

  static Future<String> uploadMessageFile(String fileName, List<int> bytes) async {
    final path = 'messages/$currentUserId/${DateTime.now().millisecondsSinceEpoch}_$fileName';
    await _client.storage.from('messages').uploadBinary(path, bytes as dynamic);
    return _client.storage.from('messages').getPublicUrl(path);
  }
}
