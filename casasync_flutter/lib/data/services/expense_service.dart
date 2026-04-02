import '../models/models.dart';
import 'supabase_db_service.dart';

class ExpenseService {
  Future<ExpenseModel> addExpense(String title, double amount, String category, {List<dynamic>? splitWithUserIds}) async {
    final userId = CurrentUser.id;
    final roomId = CurrentUser.roomId;
    final userName = CurrentUser.name ?? '';
    if (userId == null || roomId == null) throw Exception('Not authenticated');

    // Get room members
    final allMembers = await SupabaseDB.getRoomMembers(roomId);

    // If specific members selected, filter to those + current user; otherwise split with all
    final members = splitWithUserIds != null
        ? allMembers.where((u) => splitWithUserIds.contains(u['id']) || u['id'].toString() == userId).toList()
        : allMembers;
    final splitAmount = amount / members.length;

    // Insert expense
    final expense = await SupabaseDB.addExpense({
      'room_id': roomId,
      'title': title,
      'amount': amount,
      'category': category,
      'paid_by': userId,
      'paid_by_name': userName,
    });

    final expenseId = expense['id'] as int;

    // Insert splits
    final splits = members.map((u) => {
      'expense_id': expenseId,
      'user_id': u['id'].toString(),
      'user_name': u['name'] ?? '',
      'amount': splitAmount,
      'is_paid': u['id'].toString() == userId,
    }).toList();

    await SupabaseDB.addSplits(splits);

    // Create notifications for other members (parallel)
    await Future.wait(members.where((u) => u['id'].toString() != userId).map((u) =>
      SupabaseDB.addNotification({
        'user_id': u['id'].toString(),
        'title': 'New Expense',
        'message': '$userName added "$title" - \u20B9${amount.toStringAsFixed(0)}',
        'type': 'expense',
        'is_read': false,
      }),
    ));

    // Fetch the splits back for the model
    final fetchedSplits = await SupabaseDB.getSplits(expenseId);
    expense['splits'] = fetchedSplits;
    return ExpenseModel.fromJson(expense);
  }

  Future<List<ExpenseModel>> getRoomExpenses(int roomId) async {
    final expenses = await SupabaseDB.getExpenses(roomId);
    if (expenses.isEmpty) return [];
    // Fetch all splits in parallel
    final allSplits = await Future.wait(
      expenses.map((e) => SupabaseDB.getSplits(e['id'] as int).catchError((_) => <Map<String, dynamic>>[])),
    );
    for (int i = 0; i < expenses.length; i++) {
      expenses[i]['splits'] = allSplits[i];
    }
    return expenses.map((e) => ExpenseModel.fromJson(e)).toList();
  }

  Future<void> deleteExpense(int expenseId) async {
    await SupabaseDB.deleteExpense(expenseId);
  }

  Future<void> settleSplit(int splitId) async {
    await SupabaseDB.settleSplit(splitId);
  }
}
