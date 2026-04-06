import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../data/models/models.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/empty_state.dart';

class ChoresScreen extends ConsumerStatefulWidget {
  const ChoresScreen({super.key});

  @override
  ConsumerState<ChoresScreen> createState() => _ChoresScreenState();
}

class _ChoresScreenState extends ConsumerState<ChoresScreen> {
  final _choreService = ChoreService();
  List<ChoreModel> chores = [];
  List<Map<String, dynamic>> members = [];
  bool loading = true;
  int? roomId;
  dynamic currentUserId;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      roomId = CurrentUser.roomId;
      currentUserId = CurrentUser.id;
      if (roomId != null) {
        final results = await Future.wait([
          _choreService.getRoomChores(roomId!),
          SupabaseDB.getRoomMembers(roomId!),
        ]);
        chores = results[0] as List<ChoreModel>;
        members = results[1] as List<Map<String, dynamic>>;
      }
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  void _showAddChore() {
    final titleCtrl = TextEditingController();
    DateTime dueDate = DateTime.now().add(const Duration(days: 1));
    String? assignedTo;
    final otherMembers = members.where((m) => m['id']?.toString() != currentUserId?.toString()).toList();

    AppBottomSheet.show(context, title: 'New Task', child: StatefulBuilder(
      builder: (ctx, setModalState) => Column(
        children: [
          TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Task Name', prefixIcon: Icon(Icons.task_outlined))),
          const SizedBox(height: 14),
          GestureDetector(
            onTap: () async {
              final picked = await showDatePicker(
                context: context,
                initialDate: dueDate,
                firstDate: DateTime.now(),
                lastDate: DateTime.now().add(const Duration(days: 365)),
              );
              if (picked != null) setModalState(() => dueDate = picked);
            },
            child: InputDecorator(
              decoration: const InputDecoration(labelText: 'Due Date', prefixIcon: Icon(Icons.calendar_today)),
              child: Text(Helpers.formatDate(dueDate)),
            ),
          ),
          const SizedBox(height: 14),
          DropdownButtonFormField<String>(
            value: assignedTo,
            hint: const Text('Select Roommate'),
            items: otherMembers.where((m) => m['id'] != null).map((m) => DropdownMenuItem(value: m['id'].toString(), child: Text(m['name']?.toString() ?? ''))).toList(),
            onChanged: (v) => setModalState(() => assignedTo = v),
            decoration: const InputDecoration(labelText: 'Assign To', prefixIcon: Icon(Icons.person_outline)),
          ),
          const SizedBox(height: 24),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () async {
                if (titleCtrl.text.isEmpty || assignedTo == null) return;
                await _choreService.createChore(titleCtrl.text, assignedTo!, dueDate);
                if (mounted) Navigator.pop(context);
                _loadData();
                ref.invalidate(dashboardProvider);
              },
              child: const Text('Create Task'),
            ),
          ),
        ],
      ),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());

    final pending = chores.where((c) => c.isPending).toList();
    final completed = chores.where((c) => c.isCompleted).toList();
    final score = chores.isEmpty ? 100 : ((completed.length / chores.length) * 100).round();

    return RefreshIndicator(
      onRefresh: () async { setState(() => loading = true); await _loadData(); },
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Chores', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
              Text('Manage household tasks', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
            ])),
            ElevatedButton.icon(onPressed: _showAddChore, icon: const Icon(Icons.add, size: 18), label: const Text('New Task')),
          ]),
          const SizedBox(height: 20),

          // Stats
          Row(children: [
            _statCard('Pending', '${pending.length}', AppColors.pastelOrange),
            const SizedBox(width: 10),
            _statCard('Done', '${completed.length}', AppColors.pastelGreen),
            const SizedBox(width: 10),
            _statCard('Score', '$score%', AppColors.pastelPurple),
          ]),
          const SizedBox(height: 24),

          const Text('Active Tasks', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),

          if (pending.isEmpty)
            const EmptyState(icon: Icons.check_circle_outline, title: 'All tasks completed!')
          else
            ...pending.map((c) => _choreCard(c)),

          if (completed.isNotEmpty) ...[
            const SizedBox(height: 24),
            const Text('Completed', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            ...completed.map((c) => _choreCard(c)),
          ],
        ],
      ),
    );
  }

  Widget _choreCard(ChoreModel chore) {
    final isPending = chore.isPending;
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: AppCard(
        child: Row(
          children: [
            GestureDetector(
              onTap: () async {
                await _choreService.updateStatus(chore.id, isPending ? 'completed' : 'pending');
                _loadData();
                ref.invalidate(dashboardProvider);
              },
              child: Container(
                width: 28, height: 28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isPending ? Colors.transparent : AppColors.success,
                  border: Border.all(color: isPending ? AppColors.border : AppColors.success, width: 2),
                ),
                child: isPending ? null : const Icon(Icons.check, size: 16, color: Colors.white),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(chore.title, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14, decoration: isPending ? null : TextDecoration.lineThrough, color: isPending ? null : AppColors.textMuted)),
                Text('${chore.assignedToName} \u2022 ${Helpers.formatDateShort(chore.dueDate)}', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
              ]),
            ),
            if (isPending)
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                onPressed: () async {
                  await _choreService.deleteChore(chore.id);
                  _loadData();
                  ref.invalidate(dashboardProvider);
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _statCard(String title, String value, Color color) {
    return Expanded(child: AppCard(color: color, child: Column(children: [
      Text(title, style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
      const SizedBox(height: 4),
      Text(value, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
    ])));
  }
}
