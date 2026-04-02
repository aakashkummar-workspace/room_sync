import '../models/models.dart';
import 'supabase_db_service.dart';

class AuthService {
  Future<UserModel> login(String email, String password) async {
    final profile = await SupabaseDB.login(email, password);
    CurrentUser.profile = profile;
    return _profileToUser(profile);
  }

  Future<UserModel> signup(String name, String email, String password) async {
    final profile = await SupabaseDB.signup(name, email, password);
    CurrentUser.profile = profile;
    return _profileToUser(profile);
  }

  Future<UserModel?> getMe() async {
    final profile = await SupabaseDB.getCurrentProfile();
    if (profile == null) return null;
    CurrentUser.profile = profile;
    return _profileToUser(profile);
  }

  Future<UserModel> updateProfile(Map<String, dynamic> data) async {
    final supabaseData = <String, dynamic>{};
    if (data.containsKey('name')) supabaseData['name'] = data['name'];
    if (data.containsKey('phone')) supabaseData['phone'] = data['phone'];
    if (data.containsKey('avatar_url')) supabaseData['avatar_url'] = data['avatar_url'];
    final profile = await SupabaseDB.updateProfile(supabaseData);
    CurrentUser.profile = profile;
    return _profileToUser(profile);
  }

  Future<void> logout() async {
    await SupabaseDB.signOut();
    CurrentUser.clear();
  }

  /// Convert a Supabase profile map to a UserModel.
  UserModel _profileToUser(Map<String, dynamic> profile) {
    return UserModel(
      id: profile['id'],
      name: profile['name'] ?? profile['email'] ?? '',
      email: profile['email'] ?? '',
      phone: profile['phone'],
      avatarUrl: profile['avatar_url'],
      role: profile['role'] ?? 'member',
      roomId: profile['room_id'] is int ? profile['room_id'] : null,
      createdAt: profile['created_at'] != null
          ? DateTime.tryParse(profile['created_at'])
          : null,
    );
  }
}
