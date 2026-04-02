import 'supabase_db_service.dart';

class NoticeService {
  // ── Notices ──
  Future<List<Map<String, dynamic>>> getNotices(int roomId) async {
    return await SupabaseDB.getNotices(roomId);
  }

  Future<void> addNotice(int roomId, String title, String body, bool important) async {
    final userName = CurrentUser.name ?? '';
    final userId = CurrentUser.id;
    await SupabaseDB.addNotice({
      'room_id': roomId,
      'title': title,
      'body': body,
      'author': userName,
      'important': important,
    });
    // Notify all room members
    final members = await SupabaseDB.getRoomMembers(roomId);
    await Future.wait(members.where((u) => u['id'].toString() != userId).map((u) =>
      SupabaseDB.addNotification({
        'user_id': u['id'].toString(),
        'title': important ? 'Important Notice' : 'New Notice',
        'message': '$userName posted: "$title"',
        'type': 'notice',
        'is_read': false,
      }),
    ));
  }

  Future<void> deleteNotice(int noticeId) async {
    await SupabaseDB.deleteNotice(noticeId);
  }

  // ── Polls ──
  Future<List<Map<String, dynamic>>> getPolls(int roomId) async {
    final polls = await SupabaseDB.getPolls(roomId);
    if (polls.isEmpty) return polls;
    // Fetch all poll options in parallel
    final allOptions = await Future.wait(
      polls.map((p) => SupabaseDB.getPollOptions(p['id'] as int).catchError((_) => <Map<String, dynamic>>[])),
    );
    for (int i = 0; i < polls.length; i++) {
      polls[i]['options'] = allOptions[i];
    }
    return polls;
  }

  Future<void> createPoll(int roomId, String question, List<String> options) async {
    final userName = CurrentUser.name ?? '';
    final userId = CurrentUser.id;
    final poll = await SupabaseDB.createPoll({
      'room_id': roomId,
      'question': question,
      'author': userName,
      'status': 'active',
    });
    final pollId = poll['id'] as int;
    final optionMaps = options.map((o) => {
      'poll_id': pollId,
      'text': o,
      'votes': <String>[],
    }).toList();
    await SupabaseDB.addPollOptions(optionMaps);
    // Notify all room members
    final members = await SupabaseDB.getRoomMembers(roomId);
    await Future.wait(members.where((u) => u['id'].toString() != userId).map((u) =>
      SupabaseDB.addNotification({
        'user_id': u['id'].toString(),
        'title': 'New Poll',
        'message': '$userName asked: "$question"',
        'type': 'poll',
        'is_read': false,
      }),
    ));
  }

  Future<void> vote(int pollId, int optionIndex) async {
    final userId = CurrentUser.id;
    if (userId == null) return;

    // Fetch current options for this poll
    final options = await SupabaseDB.getPollOptions(pollId);

    // Remove existing vote from all options
    for (var opt in options) {
      final votes = List<String>.from((opt['votes'] as List?) ?? []);
      if (votes.contains(userId)) {
        votes.remove(userId);
        await SupabaseDB.votePoll(opt['id'] as int, votes);
      }
    }

    // Add vote to selected option
    if (optionIndex < options.length) {
      final targetOpt = options[optionIndex];
      final votes = List<String>.from((targetOpt['votes'] as List?) ?? []);
      votes.add(userId);
      await SupabaseDB.votePoll(targetOpt['id'] as int, votes);
    }
  }

  Future<void> closePoll(int pollId) async {
    await SupabaseDB.closePoll(pollId);
  }

  Future<void> deletePoll(int pollId) async {
    await SupabaseDB.deletePoll(pollId);
  }
}
