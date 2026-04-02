import '../models/models.dart';
import 'supabase_db_service.dart';

class NoteService {
  Future<List<NoteModel>> getRoomNotes(int roomId) async {
    final notes = await SupabaseDB.getNotes(roomId);
    return notes.map((n) => NoteModel.fromJson(n)).toList();
  }

  Future<NoteModel> createNote(String content, String color) async {
    final userId = CurrentUser.id;
    final roomId = CurrentUser.roomId;
    final userName = CurrentUser.name ?? '';
    if (userId == null || roomId == null) throw Exception('Not authenticated');

    final note = await SupabaseDB.addNote({
      'room_id': roomId,
      'content': content,
      'color': color,
      'created_by': userId,
      'author_name': userName,
    });
    return NoteModel.fromJson(note);
  }

  Future<NoteModel> updateNote(int noteId, {String? content, String? color}) async {
    final data = <String, dynamic>{};
    if (content != null) data['content'] = content;
    if (color != null) data['color'] = color;
    await SupabaseDB.updateNote(noteId, data);
    // Re-fetch
    final roomId = CurrentUser.roomId;
    if (roomId == null) throw Exception('No room');
    final notes = await SupabaseDB.getNotes(roomId);
    final updated = notes.firstWhere((n) => n['id'] == noteId);
    return NoteModel.fromJson(updated);
  }

  Future<void> deleteNote(int noteId) async {
    await SupabaseDB.deleteNote(noteId);
  }
}
