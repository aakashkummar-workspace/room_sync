import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../data/services/notice_service.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/app_bottom_sheet.dart';
import '../../../shared/widgets/empty_state.dart';

class NoticesScreen extends ConsumerStatefulWidget {
  final int initialTab;
  const NoticesScreen({super.key, this.initialTab = 0});
  @override
  ConsumerState<NoticesScreen> createState() => _NoticesScreenState();
}

class _NoticesScreenState extends ConsumerState<NoticesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;
  final _service = NoticeService();
  List<Map<String, dynamic>> notices = [];
  List<Map<String, dynamic>> polls = [];
  bool loading = true;
  int? roomId;
  bool isAdmin = false;
  String? currentUserId;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this, initialIndex: widget.initialTab);
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      roomId = CurrentUser.roomId;
      isAdmin = CurrentUser.isAdmin;
      currentUserId = CurrentUser.id;
      if (roomId != null) {
        final results = await Future.wait([
          _service.getNotices(roomId!),
          _service.getPolls(roomId!),
        ]);
        notices = results[0] as List<Map<String, dynamic>>;
        polls = results[1] as List<Map<String, dynamic>>;
      }
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  @override
  void dispose() { _tabCtrl.dispose(); super.dispose(); }

  void _showAddNotice() {
    final titleCtrl = TextEditingController();
    final bodyCtrl = TextEditingController();
    bool important = false;

    AppBottomSheet.show(context, title: 'New Notice', child: StatefulBuilder(
      builder: (ctx, setModalState) => Column(children: [
        TextField(controller: titleCtrl, decoration: const InputDecoration(labelText: 'Title', prefixIcon: Icon(Icons.title))),
        const SizedBox(height: 14),
        TextField(controller: bodyCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Description', prefixIcon: Icon(Icons.description_outlined), alignLabelWithHint: true)),
        const SizedBox(height: 14),
        CheckboxListTile(
          value: important,
          onChanged: (v) => setModalState(() => important = v!),
          title: const Text('Mark as Important', style: TextStyle(fontSize: 13)),
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
          activeColor: AppColors.error,
        ),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: () async {
            if (titleCtrl.text.isEmpty) return;
            await _service.addNotice(roomId!, titleCtrl.text, bodyCtrl.text, important);
            if (mounted) Navigator.pop(context);
            _loadData();
          },
          child: const Text('Post Notice'),
        )),
      ]),
    ));
  }

  void _showCreatePoll() {
    final questionCtrl = TextEditingController();
    final optionCtrls = [TextEditingController(), TextEditingController()];

    AppBottomSheet.show(context, title: 'Create Poll', child: StatefulBuilder(
      builder: (ctx, setModalState) => Column(children: [
        TextField(controller: questionCtrl, decoration: const InputDecoration(labelText: 'Question', prefixIcon: Icon(Icons.poll_outlined))),
        const SizedBox(height: 14),
        ...optionCtrls.asMap().entries.map((e) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Row(children: [
            Expanded(child: TextField(controller: e.value, decoration: InputDecoration(labelText: 'Option ${e.key + 1}', prefixIcon: const Icon(Icons.radio_button_unchecked, size: 18)))),
            if (e.key >= 2) IconButton(icon: const Icon(Icons.remove_circle_outline, color: AppColors.error, size: 20), onPressed: () => setModalState(() => optionCtrls.removeAt(e.key))),
          ]),
        )),
        TextButton.icon(
          onPressed: () => setModalState(() => optionCtrls.add(TextEditingController())),
          icon: const Icon(Icons.add, size: 16),
          label: const Text('Add Option', style: TextStyle(fontSize: 12)),
        ),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: () async {
            final options = optionCtrls.map((c) => c.text.trim()).where((t) => t.isNotEmpty).toList();
            if (questionCtrl.text.isEmpty || options.length < 2) return;
            await _service.createPoll(roomId!, questionCtrl.text, options);
            if (mounted) Navigator.pop(context);
            _loadData();
          },
          child: const Text('Create Poll'),
        )),
      ]),
    ));
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());

    return Column(children: [
      // Header
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Row(children: [
          const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Notices', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
            Text('Announcements & polls', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
          ])),
          PopupMenuButton<String>(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.add, size: 18, color: Colors.white),
            ),
            onSelected: (v) { if (v == 'notice') _showAddNotice(); else _showCreatePoll(); },
            itemBuilder: (_) => [
              const PopupMenuItem(value: 'notice', child: Row(children: [Icon(Icons.campaign, size: 18), SizedBox(width: 8), Text('New Notice')])),
              const PopupMenuItem(value: 'poll', child: Row(children: [Icon(Icons.poll, size: 18), SizedBox(width: 8), Text('Create Poll')])),
            ],
          ),
        ]),
      ),
      const SizedBox(height: 16),

      // Tabs
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(color: AppColors.background, borderRadius: BorderRadius.circular(12)),
        child: TabBar(
          controller: _tabCtrl,
          onTap: (_) => setState(() {}),
          indicator: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          tabs: [
            Tab(text: 'Notices (${notices.length})'),
            Tab(text: 'Polls (${polls.length})'),
          ],
        ),
      ),
      const SizedBox(height: 12),

      // Content
      Expanded(
        child: TabBarView(
          controller: _tabCtrl,
          children: [
            // Notices tab
            notices.isEmpty
                ? const EmptyState(icon: Icons.campaign_outlined, title: 'No notices yet')
                : RefreshIndicator(
                    onRefresh: () async { setState(() => loading = true); await _loadData(); },
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      itemCount: notices.length,
                      itemBuilder: (_, i) {
                        final n = notices[notices.length - 1 - i]; // newest first
                        final important = n['important'] == true;
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: AppCard(
                            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              if (important) Container(width: 3, height: 60, margin: const EdgeInsets.only(right: 12), decoration: BoxDecoration(color: AppColors.error, borderRadius: BorderRadius.circular(2))),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Row(children: [
                                  Expanded(child: Text(n['title'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14))),
                                  if (important) Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                    decoration: BoxDecoration(color: AppColors.pastelPink, borderRadius: BorderRadius.circular(6)),
                                    child: const Text('Important', style: TextStyle(fontSize: 8, fontWeight: FontWeight.w600, color: AppColors.error)),
                                  ),
                                ]),
                                const SizedBox(height: 6),
                                Text(n['body'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                                const SizedBox(height: 8),
                                Row(children: [
                                  Text('By ${n['author']}', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                                  const Spacer(),
                                  if (n['created_at'] != null)
                                    Text(Helpers.timeAgo(DateTime.parse(n['created_at'])), style: const TextStyle(fontSize: 10, color: AppColors.textLight)),
                                  if (isAdmin) ...[
                                    const SizedBox(width: 8),
                                    GestureDetector(
                                      onTap: () async { await _service.deleteNotice(n['id']); _loadData(); },
                                      child: const Icon(Icons.delete_outline, size: 16, color: AppColors.error),
                                    ),
                                  ],
                                ]),
                              ])),
                            ]),
                          ),
                        );
                      },
                    ),
                  ),

            // Polls tab
            polls.isEmpty
                ? const EmptyState(icon: Icons.poll_outlined, title: 'No polls yet')
                : RefreshIndicator(
                    onRefresh: () async { setState(() => loading = true); await _loadData(); },
                    child: ListView.builder(
                      padding: const EdgeInsets.fromLTRB(16, 0, 16, 100),
                      itemCount: polls.length,
                      itemBuilder: (_, i) {
                        final p = polls[polls.length - 1 - i];
                        final options = (p['options'] as List?) ?? [];
                        final totalVotes = options.fold<int>(0, (sum, o) => sum + ((o['votes'] as List?)?.length ?? 0));
                        final isClosed = p['status'] == 'closed';
                        final hasVoted = options.any((o) => ((o['votes'] as List?) ?? []).contains(currentUserId));

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 14),
                          child: AppCard(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Expanded(child: Text(p['question'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15))),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                  decoration: BoxDecoration(
                                    color: isClosed ? AppColors.pastelPink : AppColors.pastelGreen,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(isClosed ? 'Closed' : 'Active', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: isClosed ? AppColors.error : AppColors.success)),
                                ),
                              ]),
                              const SizedBox(height: 4),
                              Text('By ${p['author']} \u2022 $totalVotes votes', style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
                              const SizedBox(height: 14),

                              ...options.asMap().entries.map((entry) {
                                final optIdx = entry.key;
                                final opt = entry.value;
                                final votes = ((opt['votes'] as List?) ?? []);
                                final voteCount = votes.length;
                                final pct = totalVotes > 0 ? voteCount / totalVotes : 0.0;
                                final myVote = votes.contains(currentUserId);

                                return GestureDetector(
                                  onTap: (isClosed || hasVoted) ? null : () async {
                                    await _service.vote(p['id'], optIdx);
                                    _loadData();
                                  },
                                  child: Container(
                                    margin: const EdgeInsets.only(bottom: 8),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(children: [
                                          Icon(
                                            myVote ? Icons.check_circle : (hasVoted || isClosed) ? Icons.radio_button_unchecked : Icons.radio_button_unchecked,
                                            size: 18,
                                            color: myVote ? AppColors.primary : AppColors.textMuted,
                                          ),
                                          const SizedBox(width: 8),
                                          Expanded(child: Text(opt['text'] ?? '', style: TextStyle(fontSize: 13, fontWeight: myVote ? FontWeight.w600 : FontWeight.w400))),
                                          Text('$voteCount', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                                          const SizedBox(width: 4),
                                          Text('(${(pct * 100).toInt()}%)', style: const TextStyle(fontSize: 10, color: AppColors.textMuted)),
                                        ]),
                                        const SizedBox(height: 4),
                                        ClipRRect(
                                          borderRadius: BorderRadius.circular(4),
                                          child: LinearProgressIndicator(
                                            value: pct,
                                            minHeight: 6,
                                            backgroundColor: AppColors.border,
                                            color: myVote ? AppColors.primary : AppColors.pastelTeal,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                );
                              }),

                              if (isAdmin && !isClosed) ...[
                                const SizedBox(height: 8),
                                Row(mainAxisAlignment: MainAxisAlignment.end, children: [
                                  TextButton(
                                    onPressed: () async { await _service.closePoll(p['id']); _loadData(); },
                                    child: const Text('Close Poll', style: TextStyle(fontSize: 11, color: AppColors.warning)),
                                  ),
                                  const SizedBox(width: 8),
                                  TextButton(
                                    onPressed: () async { await _service.deletePoll(p['id']); _loadData(); },
                                    child: const Text('Delete', style: TextStyle(fontSize: 11, color: AppColors.error)),
                                  ),
                                ]),
                              ],
                            ]),
                          ),
                        );
                      },
                    ),
                  ),
          ],
        ),
      ),
    ]);
  }
}
