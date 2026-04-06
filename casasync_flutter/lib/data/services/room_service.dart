import '../models/models.dart';
import '../../core/utils/helpers.dart';
import 'supabase_db_service.dart';

class RoomService {
  Future<Map<String, dynamic>> getRoomDetails(int roomId) async {
    final room = await SupabaseDB.getRoom(roomId);
    if (room == null) throw Exception('Room not found');

    final memberMaps = await SupabaseDB.getRoomMembers(roomId);
    final members = memberMaps.map((u) => UserModel.fromJson(u)).toList();

    return {
      'room': RoomModel.fromJson(room),
      'members': members,
    };
  }

  Future<RoomModel> createRoom(String name, {String? code}) async {
    code ??= Helpers.generateInviteCode(name);
    final room = await SupabaseDB.createRoom(name, code);

    // Refresh the current user profile (room_id was updated)
    final profile = await SupabaseDB.getCurrentProfile();
    if (profile != null) CurrentUser.profile = profile;

    return RoomModel.fromJson(room);
  }

  Future<RoomModel> joinRoom(String inviteCode) async {
    final room = await SupabaseDB.joinRoom(inviteCode);

    // Refresh the current user profile (room_id was updated)
    final profile = await SupabaseDB.getCurrentProfile();
    if (profile != null) CurrentUser.profile = profile;

    return RoomModel.fromJson(room);
  }

  Future<List<Map<String, dynamic>>> getMemberCredentials(int roomId) async {
    // With Supabase, we cannot access passwords. Return basic member info.
    final members = await SupabaseDB.getRoomMembers(roomId);
    return members.map((u) => {
      'id': u['id'],
      'name': u['name'],
      'email': u['email'],
      'role': u['role'],
    }).toList();
  }
}
