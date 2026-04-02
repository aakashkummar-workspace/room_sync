import '../models/models.dart';
import 'supabase_db_service.dart';

class InventoryService {
  Future<List<InventoryModel>> getInventory(int roomId) async {
    final items = await SupabaseDB.getInventory(roomId);
    return items.map((i) => InventoryModel.fromJson(i)).toList();
  }

  Future<InventoryModel> addItem(String name, int quantity, String category, {int? minQuantity}) async {
    final userId = CurrentUser.id;
    final roomId = CurrentUser.roomId;
    final userName = CurrentUser.name ?? '';
    if (userId == null || roomId == null) throw Exception('Not authenticated');

    final item = await SupabaseDB.addInventoryItem({
      'room_id': roomId,
      'name': name,
      'quantity': quantity,
      'category': category,
      'added_by': userId,
      'added_by_name': userName,
      if (minQuantity != null) 'min_quantity': minQuantity,
    });
    return InventoryModel.fromJson(item);
  }

  Future<void> deleteItem(int itemId) async {
    await SupabaseDB.deleteInventoryItem(itemId);
  }

  Future<InventoryModel> updateItem(int itemId, {int? quantity, String? name}) async {
    final data = <String, dynamic>{};
    if (quantity != null) data['quantity'] = quantity;
    if (name != null) data['name'] = name;
    await SupabaseDB.updateInventoryItem(itemId, data);
    // Re-fetch the item
    final roomId = CurrentUser.roomId;
    if (roomId == null) throw Exception('No room');
    final items = await SupabaseDB.getInventory(roomId);
    final updated = items.firstWhere((i) => i['id'] == itemId);
    return InventoryModel.fromJson(updated);
  }
}
