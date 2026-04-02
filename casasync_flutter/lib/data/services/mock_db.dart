import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class MockDB {
  static const String _dbKey = 'casasync_db';
  static const String _userKey = 'mock_user';
  static const String _tokenKey = 'token';

  static late SharedPreferences _prefs;

  static Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
    if (!_prefs.containsKey(_dbKey)) {
      await _resetToDefaults();
    }
  }

  static Map<String, dynamic> getDB() {
    final raw = _prefs.getString(_dbKey);
    if (raw == null) return _defaultDB();
    final db = jsonDecode(raw) as Map<String, dynamic>;
    // Ensure new keys exist for older databases
    final defaults = _defaultDB();
    for (final key in defaults.keys) {
      if (!db.containsKey(key)) {
        db[key] = defaults[key];
      }
    }
    return db;
  }

  static Future<void> saveDB(Map<String, dynamic> db) async {
    await _prefs.setString(_dbKey, jsonEncode(db));
  }

  static int nextId(List items) {
    if (items.isEmpty) return 1;
    final maxId = items.fold<int>(0, (max, item) {
      final id = item is Map ? (item['id'] ?? 0) : 0;
      return id > max ? id : max;
    });
    return maxId + 1;
  }

  static UserModel? getCurrentUser() {
    final raw = _prefs.getString(_userKey);
    if (raw == null) return null;
    return UserModel.fromJson(jsonDecode(raw));
  }

  static Future<void> setCurrentUser(UserModel user) async {
    await _prefs.setString(_userKey, jsonEncode(user.toJson()));
    await _prefs.setString(_tokenKey, 'mock_token_${user.id}');
  }

  static Future<void> clearCurrentUser() async {
    await _prefs.remove(_userKey);
    await _prefs.remove(_tokenKey);
  }

  static bool hasToken() {
    return _prefs.containsKey(_tokenKey) && _prefs.getString(_tokenKey) != null;
  }

  static Future<void> resetDB() async {
    await _resetToDefaults();
  }

  static Future<void> _resetToDefaults() async {
    await _prefs.setString(_dbKey, jsonEncode(_defaultDB()));
  }

  static Map<String, dynamic> _defaultDB() {
    return {
      'users': [
        {
          'id': 1,
          'name': 'Rahul Kumar',
          'email': 'user@casasync.com',
          'password': 'password123',
          'phone': null,
          'avatar_url': null,
          'role': 'admin',
          'room_id': 1,
          'created_at': DateTime.now().toIso8601String(),
        },
        {
          'id': 2,
          'name': 'Aakash',
          'email': 'aakash@gmail.com',
          'password': 'aakash123',
          'phone': null,
          'avatar_url': null,
          'role': 'member',
          'room_id': 1,
          'created_at': DateTime.now().toIso8601String(),
        },
      ],
      'rooms': [
        {
          'id': 1,
          'name': 'The Printing House',
          'invite_code': 'PRINT123',
          'created_by': 1,
          'created_at': DateTime.now().toIso8601String(),
        },
      ],
      'expenses': [],
      'chores': [],
      'inventory': [],
      'notes': [
        {
          'id': 1,
          'room_id': 1,
          'content': 'Room rent',
          'color': 'blue',
          'created_by': 1,
          'author_name': 'Rahul Kumar',
          'created_at': DateTime.now().subtract(const Duration(days: 7)).toIso8601String(),
        },
        {
          'id': 2,
          'room_id': 1,
          'content': 'Bye',
          'color': 'pink',
          'created_by': 1,
          'author_name': 'Rahul Kumar',
          'created_at': DateTime.now().subtract(const Duration(days: 7)).toIso8601String(),
        },
        {
          'id': 3,
          'room_id': 1,
          'content': 'Hi',
          'color': 'yellow',
          'created_by': 1,
          'author_name': 'Rahul Kumar',
          'created_at': DateTime.now().subtract(const Duration(days: 7)).toIso8601String(),
        },
      ],
      'messages': [],
      'house_rules': [],
      'notifications': [],
      'notices': [
        {'id': 1, 'room_id': 1, 'title': 'Kitchen Cleaning Schedule', 'body': 'New cleaning schedule starts Monday. Check the chore board for your assigned days.', 'author': 'Rahul Kumar', 'important': true, 'created_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String()},
        {'id': 2, 'room_id': 1, 'title': 'WiFi Password Changed', 'body': 'The new WiFi password has been updated. Check the group chat for details.', 'author': 'Rahul Kumar', 'important': false, 'created_at': DateTime.now().subtract(const Duration(days: 2)).toIso8601String()},
        {'id': 3, 'room_id': 1, 'title': 'Rent Due Reminder', 'body': 'Monthly rent is due by the 5th. Please settle your payments on time.', 'author': 'System', 'important': true, 'created_at': DateTime.now().subtract(const Duration(days: 3)).toIso8601String()},
      ],
      'polls': [
        {'id': 1, 'room_id': 1, 'question': 'Movie Night - Which day?', 'author': 'Rahul Kumar', 'options': [{'text': 'Friday', 'votes': [1]}, {'text': 'Saturday', 'votes': [2]}], 'status': 'active', 'created_at': DateTime.now().subtract(const Duration(days: 1)).toIso8601String()},
        {'id': 2, 'room_id': 1, 'question': 'Should we get a water purifier?', 'author': 'Rahul Kumar', 'options': [{'text': 'Yes', 'votes': [1, 2]}, {'text': 'No', 'votes': []}, {'text': 'Maybe later', 'votes': []}], 'status': 'active', 'created_at': DateTime.now().toIso8601String()},
      ],
    };
  }
}
