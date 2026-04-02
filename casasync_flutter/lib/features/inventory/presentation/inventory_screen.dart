import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/services/services.dart';
import '../../../data/models/models.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/empty_state.dart';

class InventoryScreen extends ConsumerStatefulWidget {
  const InventoryScreen({super.key});
  @override
  ConsumerState<InventoryScreen> createState() => _InventoryScreenState();
}

class _InventoryScreenState extends ConsumerState<InventoryScreen> {
  final _service = InventoryService();
  List<InventoryModel> items = [];
  bool loading = true;
  int? roomId;

  @override
  void initState() { super.initState(); _loadData(); }

  Future<void> _loadData() async {
    try {
      roomId = CurrentUser.roomId;
      if (roomId != null) items = await _service.getInventory(roomId!);
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  void _showAddItem() {
    final nameCtrl = TextEditingController();
    final qtyCtrl = TextEditingController(text: '1');
    final minQtyCtrl = TextEditingController(text: '3');
    AppBottomSheet.show(context, title: 'Add Item', child: Column(children: [
      TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Item Name', prefixIcon: Icon(Icons.inventory_2_outlined))),
      const SizedBox(height: 14),
      TextField(controller: qtyCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Quantity', prefixIcon: Icon(Icons.numbers))),
      const SizedBox(height: 14),
      TextField(controller: minQtyCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Low Stock Alert', prefixIcon: Icon(Icons.warning_amber_outlined))),
      const SizedBox(height: 24),
      SizedBox(width: double.infinity, child: ElevatedButton(
        onPressed: () async {
          if (nameCtrl.text.isEmpty) return;
          await _service.addItem(nameCtrl.text, int.tryParse(qtyCtrl.text) ?? 1, 'General', minQuantity: int.tryParse(minQtyCtrl.text) ?? 3);
          if (mounted) Navigator.pop(context);
          _loadData(); ref.invalidate(dashboardProvider);
        },
        child: const Text('Add Item'),
      )),
    ]));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final low = items.where((i) => i.quantity <= i.minQuantity && i.quantity > 0).length;
    final out = items.where((i) => i.quantity <= 0).length;
    final isAdmin = CurrentUser.isAdmin;

    return RefreshIndicator(
      onRefresh: () async { setState(() => loading = true); await _loadData(); },
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
        Row(children: [
          const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Inventory', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
            Text('Track shared supplies', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
          ])),
          ElevatedButton.icon(onPressed: _showAddItem, icon: const Icon(Icons.add, size: 18), label: const Text('Add Item')),
        ]),
        const SizedBox(height: 20),
        Row(children: [
          _stat('Total', '${items.length}', AppColors.pastelBlue),
          const SizedBox(width: 10),
          _stat('Low Stock', '$low', AppColors.pastelOrange),
          const SizedBox(width: 10),
          _stat('Out', '$out', AppColors.pastelPink),
        ]),
        const SizedBox(height: 24),
        if (items.isEmpty)
          const EmptyState(icon: Icons.inventory_2_outlined, title: 'No items yet')
        else
          ...items.map((item) => Padding(padding: const EdgeInsets.only(bottom: 10), child: AppCard(child: Row(children: [
            Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: AppColors.pastelTeal, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.inventory_2, size: 18, color: AppColors.primary)),
            const SizedBox(width: 12),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(item.name, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
              Text(item.stockStatus, style: TextStyle(fontSize: 11, color: item.quantity <= 0 ? AppColors.error : item.quantity <= item.minQuantity ? AppColors.warning : AppColors.success)),
            ])),
            Row(mainAxisSize: MainAxisSize.min, children: [
              IconButton(icon: const Icon(Icons.remove_circle_outline, size: 20), onPressed: item.quantity > 0 ? () async {
                await _service.updateItem(item.id, quantity: item.quantity - 1); _loadData();
              } : null),
              Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.w700)),
              IconButton(icon: const Icon(Icons.add_circle_outline, size: 20), onPressed: () async {
                await _service.updateItem(item.id, quantity: item.quantity + 1); _loadData();
              }),
              if (isAdmin)
                IconButton(icon: const Icon(Icons.delete_outline, size: 20, color: AppColors.error), onPressed: () async {
                  await _service.deleteItem(item.id); ref.invalidate(dashboardProvider); _loadData();
                }),
            ]),
          ])))),
      ]),
    );
  }

  Widget _stat(String t, String v, Color c) => Expanded(child: AppCard(color: c, child: Column(children: [
    Text(t, style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
    const SizedBox(height: 4),
    Text(v, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
  ])));
}
