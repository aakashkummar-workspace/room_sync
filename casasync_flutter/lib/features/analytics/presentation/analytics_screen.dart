import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../data/models/models.dart';
import '../../../shared/widgets/app_card.dart';

class AnalyticsScreen extends ConsumerStatefulWidget {
  const AnalyticsScreen({super.key});
  @override
  ConsumerState<AnalyticsScreen> createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends ConsumerState<AnalyticsScreen> {
  List<ExpenseModel> expenses = [];
  bool loading = true;

  @override
  void initState() { super.initState(); _loadData(); }

  Future<void> _loadData() async {
    try {
      final roomId = CurrentUser.roomId;
      if (roomId != null) expenses = await ExpenseService().getRoomExpenses(roomId);
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final total = expenses.fold<double>(0, (s, e) => s + e.amount);
    final categories = <String, double>{};
    for (var e in expenses) categories[e.category] = (categories[e.category] ?? 0) + e.amount;

    return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
      const Text('Analytics', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
      const Text('Spending insights', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
      const SizedBox(height: 20),

      // Stats
      Row(children: [
        _stat('Monthly Avg', total > 0 ? Helpers.formatCurrency(total) : '\u20B90', AppColors.pastelBlue, Icons.trending_up),
        const SizedBox(width: 10),
        _stat('Top Category', categories.isNotEmpty ? categories.entries.reduce((a, b) => a.value > b.value ? a : b).key : 'N/A', AppColors.pastelPink, Icons.category),
      ]),
      const SizedBox(height: 20),

      // Category breakdown
      const Text('Spending by Category', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      const SizedBox(height: 12),
      if (categories.isEmpty)
        const Center(child: Padding(padding: EdgeInsets.all(40), child: Text('No data yet', style: TextStyle(color: AppColors.textMuted))))
      else
        ...categories.entries.map((e) {
          final pct = total > 0 ? (e.value / total) : 0.0;
          return Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text(e.key, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              Text(Helpers.formatCurrency(e.value), style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
            ]),
            const SizedBox(height: 6),
            ClipRRect(borderRadius: BorderRadius.circular(6), child: LinearProgressIndicator(value: pct, minHeight: 8, backgroundColor: AppColors.border, color: AppColors.primary)),
          ]));
        }),

      const SizedBox(height: 24),
      AppCard(color: AppColors.pastelGreen, child: Row(children: [
        Container(padding: const EdgeInsets.all(12), decoration: BoxDecoration(color: Colors.white.withOpacity(0.6), borderRadius: BorderRadius.circular(14)),
          child: const Icon(Icons.insights, color: AppColors.success)),
        const SizedBox(width: 14),
        const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Efficiency Score', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
          Text('85%', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
        ])),
      ])),
    ]);
  }

  Widget _stat(String t, String v, Color c, IconData ic) => Expanded(child: AppCard(color: c, child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
    Icon(ic, size: 20, color: AppColors.textSecondary),
    const SizedBox(height: 8),
    Text(v, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700), overflow: TextOverflow.ellipsis),
    Text(t, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
  ])));
}
