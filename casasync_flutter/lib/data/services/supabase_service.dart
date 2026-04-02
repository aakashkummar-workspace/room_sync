import 'package:supabase_flutter/supabase_flutter.dart';

class SupabaseService {
  static SupabaseClient get client => Supabase.instance.client;
  static SupabaseClient get db => client;
  static GoTrueClient get auth => client.auth;
  static SupabaseStorageClient get storage => client.storage;
}
