import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../data/models/models.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/dashboard_provider.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(dashboardProvider);

    return dashboardAsync.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => Center(child: Text('Error: $e')),
      data: (data) => _buildContent(context, ref, data),
    );
  }

  Widget _buildContent(BuildContext context, WidgetRef ref, Map<String, dynamic> data) {
    // If no room, show Create/Join screen
    if (data['room_id'] == null) {
      return _buildNoRoomScreen(context, ref, data);
    }

    final userName = data['user_name'] ?? 'User';
    final firstName = userName.split(' ').first;
    final pendingChores = data['pending_chores_count'] ?? 0;
    final totalExpenses = data['total_room_expenses'] ?? 0.0;
    final membersCount = data['members_count'] ?? 0;
    final inventoryCount = data['inventory_count'] ?? 0;
    final choreScore = data['chore_score'] ?? 100;
    final recentNotes = (data['recent_notes'] as List?)?.map((n) => NoteModel.fromJson(Map<String, dynamic>.from(n))).toList() ?? [];
    final roomId = data['room_id'];

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(dashboardProvider),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
        children: [
          // Greeting
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Hi $firstName', style: const TextStyle(fontSize: 26, fontWeight: FontWeight.w700)),
                    Text('$pendingChores tasks pending', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
                  ],
                ),
              ),
              _actionButton(context, Icons.receipt_long_outlined, 'Expense', () => context.go('/expenses')),
              const SizedBox(width: 8),
              _actionButton(context, Icons.add_task_rounded, 'Task', () => context.go('/chores'), filled: true),
            ],
          ),
          const SizedBox(height: 24),

          // Categories
          const Text('Categories', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Row(
            children: [
              _categoryCard('Expenses', Helpers.formatCurrency(totalExpenses), Icons.receipt_long_outlined, AppColors.pastelPink, () => context.go('/expenses')),
              const SizedBox(width: 10),
              _categoryCard('Chores', '$pendingChores Pending', Icons.check_box_outlined, AppColors.pastelGreen, () => context.go('/chores')),
              const SizedBox(width: 10),
              _categoryCard('Inventory', '$inventoryCount Items', Icons.inventory_2_outlined, AppColors.pastelBlue, () => context.go('/inventory')),
              const SizedBox(width: 10),
              _categoryCard('Roommates', '$membersCount Members', Icons.people_outline, AppColors.pastelPurple, () => context.go('/roommates')),
            ],
          ),
          const SizedBox(height: 28),

          // Stats row
          Row(
            children: [
              Expanded(
                child: AppCard(
                  padding: const EdgeInsets.all(16),
                  color: AppColors.pastelOrange,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.trending_up, color: Colors.orange, size: 20),
                      const SizedBox(height: 8),
                      Text(Helpers.formatCurrency(totalExpenses), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      const Text('Total Spent', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: AppCard(
                  padding: const EdgeInsets.all(16),
                  color: AppColors.pastelGreen,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Icon(Icons.pie_chart_outline, color: Colors.green, size: 20),
                      const SizedBox(height: 8),
                      Text('$choreScore%', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                      const Text('Chore Score', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          // Sticky Notes
          Row(
            children: [
              const Expanded(child: Text('Recent Notes', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
              if (recentNotes.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  margin: const EdgeInsets.only(right: 8),
                  decoration: BoxDecoration(color: AppColors.pastelOrange, borderRadius: BorderRadius.circular(8)),
                  child: Text('${recentNotes.length} New', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.orange)),
                ),
              GestureDetector(
                onTap: () => _showAddNote(context, ref, roomId),
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.add, size: 16, color: Colors.white),
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),

          if (recentNotes.isEmpty)
            Center(
              child: Padding(
                padding: const EdgeInsets.all(30),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.sticky_note_2_outlined, size: 40, color: AppColors.textLight),
                  const SizedBox(height: 10),
                  const Text('No sticky notes yet', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                ]),
              ),
            )
          else
            _DraggableNotesBoard(
              notes: recentNotes,
              onEdit: (note) => _showEditNote(context, ref, note),
              onDelete: (note) async {
                await NoteService().deleteNote(note.id);
                ref.invalidate(dashboardProvider);
              },
            ),

          const SizedBox(height: 28),

          // Notices section
          Builder(builder: (_) {
            final notices = (data['recent_notices'] as List?) ?? [];
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.campaign_outlined, size: 20, color: Colors.pink),
                  const SizedBox(width: 8),
                  const Expanded(child: Text('Notices', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                  if (notices.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.pastelPink, borderRadius: BorderRadius.circular(8)),
                      child: Text('${notices.length}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.pink)),
                    ),
                ]),
                const SizedBox(height: 10),
                if (notices.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('No notices yet', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  )
                else
                  ...notices.take(3).map((n) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: AppCard(
                      color: (n['important'] == true) ? AppColors.pastelPink : AppColors.background,
                      padding: const EdgeInsets.all(12),
                      child: Row(children: [
                        if (n['important'] == true) ...[
                          const Icon(Icons.priority_high, size: 16, color: AppColors.error),
                          const SizedBox(width: 6),
                        ],
                        Expanded(child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(n['title'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis),
                            if (n['body'] != null && (n['body'] as String).isNotEmpty)
                              Text(n['body'], style: const TextStyle(fontSize: 11, color: AppColors.textMuted), maxLines: 1, overflow: TextOverflow.ellipsis),
                          ],
                        )),
                        Text(n['author'] ?? '', style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
                      ]),
                    ),
                  )),
                GestureDetector(
                  onTap: () => context.go('/notices?tab=0'),
                  child: const Row(children: [
                    Spacer(),
                    Text('View all', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.pink)),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios, size: 12, color: Colors.pink),
                  ]),
                ),
              ],
            );
          }),
          const SizedBox(height: 24),

          // Polls section
          Builder(builder: (_) {
            final polls = (data['active_polls'] as List?) ?? [];
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  const Icon(Icons.poll_outlined, size: 20, color: Colors.purple),
                  const SizedBox(width: 8),
                  const Expanded(child: Text('Polls', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600))),
                  if (polls.isNotEmpty)
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: AppColors.pastelPurple, borderRadius: BorderRadius.circular(8)),
                      child: Text('${polls.length}', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.purple)),
                    ),
                ]),
                const SizedBox(height: 10),
                if (polls.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text('No active polls', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                  )
                else
                  ...polls.take(3).map((p) => Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: AppCard(
                      color: AppColors.pastelPurple,
                      padding: const EdgeInsets.all(12),
                      child: Row(children: [
                        const Icon(Icons.how_to_vote_outlined, size: 16, color: Colors.purple),
                        const SizedBox(width: 8),
                        Expanded(child: Text(p['question'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600), maxLines: 1, overflow: TextOverflow.ellipsis)),
                        Text(p['author'] ?? '', style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
                      ]),
                    ),
                  )),
                GestureDetector(
                  onTap: () => context.go('/notices?tab=1'),
                  child: const Row(children: [
                    Spacer(),
                    Text('View all', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.purple)),
                    SizedBox(width: 4),
                    Icon(Icons.arrow_forward_ios, size: 12, color: Colors.purple),
                  ]),
                ),
              ],
            );
          }),
        ],
      ),
    );
  }

  Widget _buildNoRoomScreen(BuildContext context, WidgetRef ref, Map<String, dynamic> data) {
    final userName = data['user_name'] ?? 'User';
    final roomNameCtrl = TextEditingController();
    final inviteCodeCtrl = TextEditingController();

    return Center(
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.pastelTeal, shape: BoxShape.circle),
              child: const Icon(Icons.home_outlined, size: 48, color: AppColors.primary),
            ),
            const SizedBox(height: 20),
            Text('Welcome, $userName!', style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
            const SizedBox(height: 8),
            const Text('Get started by creating a room or joining one', style: TextStyle(fontSize: 13, color: AppColors.textMuted), textAlign: TextAlign.center),
            const SizedBox(height: 32),

            // Create Room
            AppCard(
              color: AppColors.pastelGreen,
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Row(children: [
                  Icon(Icons.add_home_outlined, color: AppColors.success, size: 22),
                  SizedBox(width: 10),
                  Text('Create a Room', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ]),
                const SizedBox(height: 6),
                const Text('Start your own hostel room and invite roommates', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(height: 16),
                StatefulBuilder(builder: (ctx, setLocalState) {
                  return Column(children: [
                    TextField(
                      controller: roomNameCtrl,
                      decoration: InputDecoration(
                        hintText: 'Room name (e.g. The Printing House)',
                        prefixIcon: const Icon(Icons.meeting_room_outlined, size: 18),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      style: const TextStyle(fontSize: 13),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(width: double.infinity, child: ElevatedButton.icon(
                      onPressed: () async {
                        if (roomNameCtrl.text.trim().isEmpty) return;
                        try {
                          await RoomService().createRoom(roomNameCtrl.text.trim());
                          ref.invalidate(dashboardProvider);
                          await ref.read(authProvider.notifier).refresh();
                        } catch (e) {
                          if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: $e')));
                        }
                      },
                      icon: const Icon(Icons.add, size: 18),
                      label: const Text('Create Room'),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    )),
                  ]);
                }),
              ]),
            ),
            const SizedBox(height: 16),

            const Row(children: [
              Expanded(child: Divider()),
              Padding(padding: EdgeInsets.symmetric(horizontal: 16), child: Text('OR', style: TextStyle(fontSize: 12, color: AppColors.textMuted, fontWeight: FontWeight.w600))),
              Expanded(child: Divider()),
            ]),
            const SizedBox(height: 16),

            // Join Room
            AppCard(
              color: AppColors.pastelBlue,
              padding: const EdgeInsets.all(20),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Row(children: [
                  Icon(Icons.group_add_outlined, color: AppColors.info, size: 22),
                  SizedBox(width: 10),
                  Text('Join a Room', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                ]),
                const SizedBox(height: 6),
                const Text('Enter an invite code from your roommate', style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
                const SizedBox(height: 16),
                StatefulBuilder(builder: (ctx, setLocalState) {
                  return Column(children: [
                    TextField(
                      controller: inviteCodeCtrl,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        hintText: 'Invite code (e.g. PRINT123)',
                        prefixIcon: const Icon(Icons.vpn_key_outlined, size: 18),
                        filled: true,
                        fillColor: Colors.white,
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                      ),
                      style: const TextStyle(fontSize: 13, letterSpacing: 2, fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(width: double.infinity, child: ElevatedButton.icon(
                      onPressed: () async {
                        if (inviteCodeCtrl.text.trim().isEmpty) return;
                        try {
                          await RoomService().joinRoom(inviteCodeCtrl.text.trim());
                          ref.invalidate(dashboardProvider);
                          await ref.read(authProvider.notifier).refresh();
                        } catch (e) {
                          if (ctx.mounted) ScaffoldMessenger.of(ctx).showSnackBar(SnackBar(content: Text('Error: ${e.toString().replaceFirst("Exception: ", "")}')));
                        }
                      },
                      icon: const Icon(Icons.login, size: 18),
                      label: const Text('Join Room'),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.info, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                    )),
                  ]);
                }),
              ]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _actionButton(BuildContext context, IconData icon, String label, VoidCallback onTap, {bool filled = false}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: filled ? AppColors.primary : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: filled ? null : Border.all(color: AppColors.border),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: filled ? Colors.white : AppColors.textSecondary),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: filled ? Colors.white : AppColors.textSecondary)),
          ],
        ),
      ),
    );
  }

  Widget _categoryCard(String title, String subtitle, IconData icon, Color color, VoidCallback onTap) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 22, color: AppColors.textSecondary),
              const SizedBox(height: 10),
              Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
              Text(subtitle, style: const TextStyle(fontSize: 9, color: AppColors.textMuted), overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }

  void _showAddNote(BuildContext context, WidgetRef ref, dynamic roomId) {
    final contentCtrl = TextEditingController();
    String selectedColor = 'yellow';
    final colorOptions = AppColors.noteColors.keys.toList();

    AppBottomSheet.show(context, title: 'Add Note', child: StatefulBuilder(
      builder: (ctx, setModalState) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: contentCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Note content', prefixIcon: Icon(Icons.sticky_note_2_outlined), alignLabelWithHint: true),
          ),
          const SizedBox(height: 16),
          const Text('Color', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            children: colorOptions.map((c) => GestureDetector(
              onTap: () => setModalState(() => selectedColor = c),
              child: Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: AppColors.noteColors[c],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: selectedColor == c ? AppColors.primary : Colors.transparent, width: 2),
                ),
                child: selectedColor == c ? const Icon(Icons.check, size: 16, color: AppColors.primary) : null,
              ),
            )).toList(),
          ),
          const SizedBox(height: 24),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: () async {
              if (contentCtrl.text.trim().isEmpty) return;
              await NoteService().createNote(contentCtrl.text.trim(), selectedColor);
              if (context.mounted) Navigator.pop(context);
              ref.invalidate(dashboardProvider);
            },
            child: const Text('Add Note'),
          )),
        ],
      ),
    ));
  }

  void _showEditNote(BuildContext context, WidgetRef ref, NoteModel note) {
    final contentCtrl = TextEditingController(text: note.content);
    String selectedColor = note.color;
    final colorOptions = AppColors.noteColors.keys.toList();

    AppBottomSheet.show(context, title: 'Edit Note', child: StatefulBuilder(
      builder: (ctx, setModalState) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          TextField(
            controller: contentCtrl,
            maxLines: 3,
            decoration: const InputDecoration(labelText: 'Note content', prefixIcon: Icon(Icons.sticky_note_2_outlined), alignLabelWithHint: true),
          ),
          const SizedBox(height: 16),
          const Text('Color', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 10,
            children: colorOptions.map((c) => GestureDetector(
              onTap: () => setModalState(() => selectedColor = c),
              child: Container(
                width: 36, height: 36,
                decoration: BoxDecoration(
                  color: AppColors.noteColors[c],
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: selectedColor == c ? AppColors.primary : Colors.transparent, width: 2),
                ),
                child: selectedColor == c ? const Icon(Icons.check, size: 16, color: AppColors.primary) : null,
              ),
            )).toList(),
          ),
          const SizedBox(height: 24),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: () async {
              if (contentCtrl.text.trim().isEmpty) return;
              await NoteService().updateNote(note.id, content: contentCtrl.text.trim(), color: selectedColor);
              if (context.mounted) Navigator.pop(context);
              ref.invalidate(dashboardProvider);
            },
            child: const Text('Save Changes'),
          )),
        ],
      ),
    ));
  }
}

// Draggable notes board widget with smooth animations
class _DraggableNotesBoard extends StatefulWidget {
  final List<NoteModel> notes;
  final Function(NoteModel) onEdit;
  final Function(NoteModel) onDelete;

  const _DraggableNotesBoard({required this.notes, required this.onEdit, required this.onDelete});

  @override
  State<_DraggableNotesBoard> createState() => _DraggableNotesBoardState();
}

class _DraggableNotesBoardState extends State<_DraggableNotesBoard> {
  static const double _noteW = 140, _noteH = 145, _boardH = 400;
  final Map<int, Offset> _positions = {};
  int? _draggingNoteId;

  @override
  void initState() {
    super.initState();
    _initPositions();
  }

  @override
  void didUpdateWidget(covariant _DraggableNotesBoard oldWidget) {
    super.didUpdateWidget(oldWidget);
    for (int i = 0; i < widget.notes.length; i++) {
      if (!_positions.containsKey(widget.notes[i].id)) {
        _positions[widget.notes[i].id] = Offset(
          (i % 3) * 130.0 + (i % 2) * 15,
          (i ~/ 3) * 140.0 + (i % 2) * 20,
        );
      }
    }
  }

  void _initPositions() {
    for (int i = 0; i < widget.notes.length; i++) {
      _positions[widget.notes[i].id] = Offset(
        (i % 3) * 130.0 + (i % 2) * 15,
        (i ~/ 3) * 140.0 + (i % 2) * 20,
      );
    }
  }

  Offset _clamp(Offset pos, double boardWidth) {
    return Offset(
      pos.dx.clamp(0, (boardWidth - _noteW).clamp(0, double.infinity)),
      pos.dy.clamp(0, (_boardH - _noteH).clamp(0, double.infinity)),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isAdmin = CurrentUser.isAdmin;

    return LayoutBuilder(builder: (context, constraints) {
      final boardWidth = constraints.maxWidth;
      return GestureDetector(
        onVerticalDragUpdate: (_) {},
        child: Container(
          height: _boardH,
          decoration: BoxDecoration(
            color: AppColors.background,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
          ),
          clipBehavior: Clip.hardEdge,
          child: Stack(
            children: [
              CustomPaint(painter: _DotsPainter(), size: Size.infinite),
              ...widget.notes.map((note) {
                final pos = _clamp(_positions[note.id] ?? Offset.zero, boardWidth);
                final isDragging = _draggingNoteId == note.id;
                final noteColor = AppColors.noteColors[note.color] ?? AppColors.pastelYellow;
                return AnimatedPositioned(
                  duration: isDragging ? Duration.zero : const Duration(milliseconds: 200),
                  curve: Curves.easeOutCubic,
                  left: pos.dx,
                  top: pos.dy,
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onPanStart: (_) => setState(() => _draggingNoteId = note.id),
                    onPanUpdate: (details) {
                      setState(() {
                        final cur = _positions[note.id] ?? Offset.zero;
                        _positions[note.id] = _clamp(
                          Offset(cur.dx + details.delta.dx, cur.dy + details.delta.dy),
                          boardWidth,
                        );
                      });
                    },
                    onPanEnd: (_) => setState(() => _draggingNoteId = null),
                    onDoubleTap: () => widget.onEdit(note),
                    child: AnimatedScale(
                      scale: isDragging ? 1.06 : 1.0,
                      duration: const Duration(milliseconds: 150),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 150),
                        width: _noteW,
                        height: _noteH,
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: noteColor,
                          borderRadius: BorderRadius.circular(14),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(isDragging ? 0.18 : 0.08),
                              blurRadius: isDragging ? 18 : 10,
                              offset: Offset(2, isDragging ? 6 : 3),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(children: [
                              Container(
                                width: 20, height: 20,
                                decoration: BoxDecoration(color: AppColors.getAvatarColor(note.authorName), borderRadius: BorderRadius.circular(6)),
                                alignment: Alignment.center,
                                child: Text(Helpers.getInitials(note.authorName), style: const TextStyle(color: Colors.white, fontSize: 7, fontWeight: FontWeight.w600)),
                              ),
                              const SizedBox(width: 4),
                              Expanded(child: Text(note.authorName, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w500), overflow: TextOverflow.ellipsis)),
                              GestureDetector(
                                onTap: () => widget.onEdit(note),
                                child: const Icon(Icons.edit_outlined, size: 13, color: AppColors.textMuted),
                              ),
                              if (isAdmin) ...[
                                const SizedBox(width: 3),
                                GestureDetector(
                                  onTap: () => widget.onDelete(note),
                                  child: const Icon(Icons.close, size: 13, color: AppColors.error),
                                ),
                              ],
                            ]),
                            const SizedBox(height: 8),
                            Expanded(
                              child: Text(note.content, style: const TextStyle(fontSize: 12, fontStyle: FontStyle.italic, fontWeight: FontWeight.w500), maxLines: 4, overflow: TextOverflow.ellipsis),
                            ),
                            Row(children: [
                              const Icon(Icons.drag_indicator, size: 12, color: AppColors.textLight),
                              const Spacer(),
                              Text(Helpers.formatDateShort(note.createdAt), style: const TextStyle(fontSize: 8, color: AppColors.textMuted)),
                            ]),
                          ],
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ],
          ),
        ),
      );
    });
  }
}

class _DotsPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = AppColors.border..style = PaintingStyle.fill;
    const spacing = 20.0;
    for (double x = spacing; x < size.width; x += spacing) {
      for (double y = spacing; y < size.height; y += spacing) {
        canvas.drawCircle(Offset(x, y), 0.8, paint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
