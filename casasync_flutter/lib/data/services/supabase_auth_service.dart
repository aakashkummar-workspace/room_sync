import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseAuthService {
  final _client = Supabase.instance.client;

  Future<Map<String, dynamic>> login(String email, String password) async {
    final response = await _client.auth.signInWithPassword(
      email: email,
      password: password,
    );
    if (response.user == null) throw Exception('Login failed');
    final profile = await _client
        .from('profiles')
        .select()
        .eq('id', response.user!.id)
        .single();
    return profile;
  }

  Future<Map<String, dynamic>> signup(
      String name, String email, String password) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
      data: {'name': name},
    );
    if (response.user == null) throw Exception('Signup failed');

    // Manually create profile (trigger may be disabled)
    try {
      await _client.from('profiles').upsert({
        'id': response.user!.id,
        'name': name,
        'email': email,
        'role': 'admin',
      });
    } catch (_) {
      // Profile might already exist from trigger
    }

    final profile = await _client
        .from('profiles')
        .select()
        .eq('id', response.user!.id)
        .single();
    return profile;
  }

  Future<Map<String, dynamic>?> getMe() async {
    final user = _client.auth.currentUser;
    if (user == null) return null;
    final profile = await _client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();
    return profile;
  }

  Future<Map<String, dynamic>> updateProfile(
      Map<String, dynamic> data) async {
    final user = _client.auth.currentUser;
    if (user == null) throw Exception('Not authenticated');
    await _client.from('profiles').update(data).eq('id', user.id);
    final profile = await _client
        .from('profiles')
        .select()
        .eq('id', user.id)
        .single();
    return profile;
  }

  Future<void> logout() async {
    await _client.auth.signOut();
  }

  bool get isLoggedIn => _client.auth.currentUser != null;
  String? get currentUserId => _client.auth.currentUser?.id;
}
