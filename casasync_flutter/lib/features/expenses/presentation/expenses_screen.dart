import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/constants/app_constants.dart';
import '../../../data/services/services.dart';
import '../../../data/models/models.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/empty_state.dart';

class ExpensesScreen extends ConsumerStatefulWidget {
  const ExpensesScreen({super.key});

  @override
  ConsumerState<ExpensesScreen> createState() => _ExpensesScreenState();
}

class _ExpensesScreenState extends ConsumerState<ExpensesScreen> {
  final _expenseService = ExpenseService();
  List<ExpenseModel> expenses = [];
  bool loading = true;
  int? roomId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      roomId = CurrentUser.roomId;
      if (roomId != null) {
        expenses = await _expenseService.getRoomExpenses(roomId!);
      }
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  void _showAddExpense() async {
    // Load members
    List<Map<String, dynamic>> members = [];
    try {
      if (roomId != null) {
        members = await SupabaseDB.getRoomMembers(roomId!);
      }
    } catch (_) {}

    if (!mounted) return;

    final titleCtrl = TextEditingController();
    final amountCtrl = TextEditingController();
    String category = 'General';
    final currentUserId = CurrentUser.id;
    final currentUserName = CurrentUser.name;
    // By default select all members except current user
    Set<String> selectedMembers = members
        .where((m) => m['id']?.toString() != currentUserId)
        .map((m) => m['id'].toString())
        .toSet();

    AppBottomSheet.show(context, title: 'Add Expense', child: StatefulBuilder(
      builder: (ctx, setModalState) {
        final totalSplitWith = selectedMembers.length + 1; // +1 for current user
        final amount = double.tryParse(amountCtrl.text) ?? 0;
        final perPerson = totalSplitWith > 0 && amount > 0 ? amount / totalSplitWith : 0.0;

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title', prefixIcon: Icon(Icons.receipt_outlined))),
            const SizedBox(height: 14),
            TextField(
              controller: amountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Amount', prefixIcon: Icon(Icons.currency_rupee)),
              onChanged: (_) => setModalState(() {}),
            ),
            const SizedBox(height: 14),
            DropdownButtonFormField<String>(
              value: category,
              items: AppConstants.expenseCategories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => setModalState(() => category = v!),
              decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category_outlined)),
            ),
            const SizedBox(height: 20),

            // Split with members
            const Text('Split with', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
            const SizedBox(height: 4),
            Text('Select roommates to split this expense', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            const SizedBox(height: 10),

            // Current user (always included, can't deselect)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              margin: const EdgeInsets.only(bottom: 6),
              decoration: BoxDecoration(
                color: AppColors.pastelTeal,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary, width: 1.5),
              ),
              child: Row(children: [
                const Icon(Icons.check_circle, size: 20, color: AppColors.primary),
                const SizedBox(width: 10),
                Text(currentUserName ?? 'You', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                const Spacer(),
                const Text('You (Paid)', style: TextStyle(fontSize: 10, color: AppColors.textMuted)),
              ]),
            ),

            // Other members (toggleable)
            ...members.where((m) => m['id']?.toString() != currentUserId).map((m) {
              final memberId = m['id'].toString();
              final isSelected = selectedMembers.contains(memberId);
              return GestureDetector(
                onTap: () => setModalState(() {
                  if (isSelected) {
                    selectedMembers.remove(memberId);
                  } else {
                    selectedMembers.add(memberId);
                  }
                }),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                  margin: const EdgeInsets.only(bottom: 6),
                  decoration: BoxDecoration(
                    color: isSelected ? AppColors.pastelGreen : AppColors.background,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: isSelected ? AppColors.success : AppColors.border),
                  ),
                  child: Row(children: [
                    Icon(isSelected ? Icons.check_circle : Icons.radio_button_unchecked, size: 20, color: isSelected ? AppColors.success : AppColors.textMuted),
                    const SizedBox(width: 10),
                    Text(m['name']?.toString() ?? '', style: TextStyle(fontSize: 13, fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400)),
                  ]),
                ),
              );
            }),

            // Split info
            if (amount > 0) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: AppColors.pastelOrange, borderRadius: BorderRadius.circular(12)),
                child: Row(children: [
                  const Icon(Icons.info_outline, size: 16, color: Colors.orange),
                  const SizedBox(width: 8),
                  Text(
                    'Split $totalSplitWith ways: \u20B9${perPerson.toStringAsFixed(0)} each',
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                  ),
                ]),
              ),
            ],

            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () async {
                  final amt = double.tryParse(amountCtrl.text);
                  if (titleCtrl.text.isEmpty || amt == null || amt <= 0) return;
                  await _expenseService.addExpense(
                    titleCtrl.text, amt, category,
                    splitWithUserIds: selectedMembers.toList(),
                  );
                  if (mounted) Navigator.pop(context);
                  _loadData();
                  ref.invalidate(dashboardProvider);
                },
                child: const Text('Add Expense'),
              ),
            ),
          ],
        );
      },
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());

    final myId = CurrentUser.id;
    final isAdmin = CurrentUser.isAdmin;
    final totalSpent = expenses.fold<double>(0, (s, e) => s + e.amount);

    // Calculate liability (what I owe others) and receivable (what others owe me)
    double liability = 0;
    double receivable = 0;
    for (var e in expenses) {
      for (var s in e.splits) {
        if (s.userId?.toString() == myId && !s.isPaid && e.paidBy?.toString() != myId) {
          liability += s.amount;
        }
        if (e.paidBy?.toString() == myId && s.userId?.toString() != myId && !s.isPaid) {
          receivable += s.amount;
        }
      }
    }

    return RefreshIndicator(
      onRefresh: () async { setState(() => loading = true); await _loadData(); },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          // Header
          Row(
            children: [
              const Expanded(child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Expenses', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
                  Text('Track and manage shared spending', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
                ],
              )),
              ElevatedButton.icon(
                onPressed: _showAddExpense,
                icon: const Icon(Icons.add, size: 18),
                label: const Text('Add Expense'),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Stats row 1
          Row(children: [
            _statCard('Total Spent', Helpers.formatCurrency(totalSpent), AppColors.pastelBlue, Icons.account_balance_wallet),
            const SizedBox(width: 10),
            _statCard('Transactions', '${expenses.length}', AppColors.pastelGreen, Icons.swap_horiz),
          ]),
          const SizedBox(height: 10),

          // Stats row 2 — Liability & Receivable
          Row(children: [
            _statCard('You Owe', Helpers.formatCurrency(liability), AppColors.pastelPink, Icons.arrow_downward),
            const SizedBox(width: 10),
            _statCard('Owed to You', Helpers.formatCurrency(receivable), AppColors.pastelOrange, Icons.arrow_upward),
          ]),
          const SizedBox(height: 24),

          // Transactions
          const Text('Transactions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),

          if (expenses.isEmpty)
            const EmptyState(icon: Icons.receipt_long_outlined, title: 'No expenses yet', subtitle: 'Add your first expense to start tracking')
          else
            ...expenses.reversed.map((e) {
              // Find current user's split in this expense
              final mySplit = e.splits.where((s) => s.userId?.toString() == myId).toList();
              final myShare = mySplit.isNotEmpty ? mySplit.first.amount : 0.0;
              final iPayedThis = e.paidBy?.toString() == myId;

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppCard(
                  child: Column(
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(color: AppColors.pastelPink, borderRadius: BorderRadius.circular(12)),
                            child: const Icon(Icons.receipt, size: 18, color: Colors.pink),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(e.title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                                Text('${Helpers.formatDateShort(e.createdAt)} \u2022 Paid by ${iPayedThis ? "You" : e.paidByName}', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                              ],
                            ),
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text(Helpers.formatCurrency(e.amount), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                decoration: BoxDecoration(color: AppColors.pastelOrange, borderRadius: BorderRadius.circular(8)),
                                child: Text(e.category, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600)),
                              ),
                            ],
                          ),
                          if (isAdmin)
                            IconButton(
                              icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.error),
                              onPressed: () async {
                                await _expenseService.deleteExpense(e.id);
                                ref.invalidate(dashboardProvider);
                                _loadData();
                              },
                            ),
                        ],
                      ),
                      // Split details
                      const SizedBox(height: 10),
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(10)),
                        child: Column(
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Split ${e.splits.length} ways', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                                Text('Your share: ${Helpers.formatCurrency(myShare)}', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primary)),
                              ],
                            ),
                            const SizedBox(height: 6),
                            ...e.splits.map((s) => Padding(
                              padding: const EdgeInsets.only(top: 4),
                              child: Row(children: [
                                Icon(s.isPaid ? Icons.check_circle : Icons.radio_button_unchecked, size: 14, color: s.isPaid ? AppColors.success : AppColors.warning),
                                const SizedBox(width: 6),
                                Expanded(child: Text(
                                  s.userId?.toString() == myId ? '${s.userName} (You)' : s.userName,
                                  style: TextStyle(fontSize: 11, color: s.userId?.toString() == myId ? AppColors.textPrimary : AppColors.textSecondary, fontWeight: s.userId?.toString() == myId ? FontWeight.w600 : FontWeight.w400),
                                )),
                                Text(Helpers.formatCurrency(s.amount), style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500)),
                                const SizedBox(width: 6),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                                  decoration: BoxDecoration(
                                    color: s.isPaid ? AppColors.pastelGreen : AppColors.pastelPink,
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(s.isPaid ? 'Paid' : 'Pending', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w600, color: s.isPaid ? AppColors.success : AppColors.error)),
                                ),
                              ]),
                            )),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              );
            }),
        ],
      ),
    );
  }

  Widget _statCard(String title, String value, Color color, IconData icon) {
    return Expanded(
      child: AppCard(
        color: color,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: 20, color: AppColors.textSecondary),
            const SizedBox(height: 8),
            Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            Text(title, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
          ],
        ),
      ),
    );
  }
}
