import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/avatar_widget.dart';

class RoommatesScreen extends ConsumerStatefulWidget {
  const RoommatesScreen({super.key});
  @override
  ConsumerState<RoommatesScreen> createState() => _RoommatesScreenState();
}

class _RoommatesScreenState extends ConsumerState<RoommatesScreen> {
  List<Map<String, dynamic>> members = [];
  List<Map<String, dynamic>> credentials = [];
  String inviteCode = '';
  String roomName = '';
  bool loading = true;
  bool copied = false;
  int? roomId;

  @override
  void initState() { super.initState(); _loadData(); }

  Future<void> _loadData() async {
    try {
      roomId = CurrentUser.roomId;
      if (roomId != null) {
        // Fetch room, members, and credentials in parallel
        final futures = <Future>[
          SupabaseDB.getRoom(roomId!),
          SupabaseDB.getRoomMembers(roomId!),
          if (CurrentUser.isAdmin) RoomService().getMemberCredentials(roomId!),
        ];
        final results = await Future.wait(futures);
        final room = results[0] as Map<String, dynamic>?;
        inviteCode = room?['invite_code'] ?? '';
        roomName = room?['name'] ?? '';
        members = List<Map<String, dynamic>>.from(results[1] as List);
        if (CurrentUser.isAdmin && results.length > 2) {
          credentials = List<Map<String, dynamic>>.from(results[2] as List);
        }
      }
    } catch (_) {}
    if (mounted) setState(() => loading = false);
  }

  void _showMemberDetail(Map<String, dynamic> member) {
    final isAdmin = CurrentUser.isAdmin;
    final isMe = member['id']?.toString() == CurrentUser.id;

    // Find credentials for this member
    Map<String, dynamic>? cred;
    if (isAdmin) {
      final matches = credentials.where((c) => c['id']?.toString() == member['id']?.toString()).toList();
      if (matches.isNotEmpty) cred = matches.first;
    }

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 32),
          child: Column(children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 16),
            Row(children: [
              const Expanded(child: Text('Member Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
              IconButton(icon: const Icon(Icons.close, size: 20), onPressed: () => Navigator.pop(context)),
            ]),
            const SizedBox(height: 16),

            // Profile header
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.pastelGreen, borderRadius: BorderRadius.circular(16)),
              child: Row(children: [
                AvatarWidget(name: member['name'] ?? '', avatarUrl: member['avatar_url'], size: 52),
                const SizedBox(width: 14),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text(member['name'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                    if (isMe) ...[const SizedBox(width: 8), Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2), decoration: BoxDecoration(color: Colors.white.withOpacity(0.7), borderRadius: BorderRadius.circular(6)), child: const Text('You', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600)))],
                  ]),
                  Text(member['role'] == 'admin' ? '\u2B50 Admin' : 'Teammate', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                ])),
              ]),
            ),
            const SizedBox(height: 20),

            // Info rows
            _detailRow(Icons.mail_outline, 'Email', member['email'] ?? ''),
            _detailRow(Icons.phone_outlined, 'Phone', member['phone'] ?? 'Not added'),
            _detailRow(Icons.circle_outlined, 'Role', member['role'] ?? 'member'),
            _detailRow(Icons.calendar_today_outlined, 'Joined', member['created_at'] != null ? Helpers.formatDate(DateTime.parse(member['created_at'])) : 'N/A'),

            // Credentials (admin only)
            if (isAdmin && cred != null) ...[
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.pastelYellow,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.orange.withOpacity(0.3)),
                ),
                child: StatefulBuilder(builder: (ctx, setLocalState) {
                  bool showPwd = false;
                  return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Row(children: [
                      Icon(Icons.key, size: 16, color: Colors.orange),
                      SizedBox(width: 8),
                      Text('Login Credentials', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: Colors.orange)),
                    ]),
                    const SizedBox(height: 14),
                    // Email
                    Row(children: [
                      const SizedBox(width: 70, child: Text('Email', style: TextStyle(fontSize: 12, color: AppColors.textMuted))),
                      Expanded(child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                        child: Text(cred!['email'] ?? '', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),
                      )),
                    ]),
                    const SizedBox(height: 8),
                    // Password
                    Row(children: [
                      const SizedBox(width: 70, child: Text('Password', style: TextStyle(fontSize: 12, color: AppColors.textMuted))),
                      Expanded(child: StatefulBuilder(builder: (ctx2, setPwdState) {
                        return GestureDetector(
                          onTap: () => setPwdState(() => showPwd = !showPwd),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(8)),
                            child: Row(children: [
                              Expanded(child: Text(showPwd ? (cred!['password'] ?? '') : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500, fontFamily: 'monospace'))),
                              Icon(showPwd ? Icons.visibility_off : Icons.visibility, size: 16, color: AppColors.textMuted),
                            ]),
                          ),
                        );
                      })),
                    ]),
                    const SizedBox(height: 12),
                    // Copy button
                    SizedBox(width: double.infinity, child: OutlinedButton.icon(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: 'Email: ${cred!['email']}\nPassword: ${cred!['password']}'));
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Credentials copied!'), duration: Duration(seconds: 2)));
                      },
                      icon: const Icon(Icons.copy, size: 14),
                      label: const Text('Copy Credentials', style: TextStyle(fontSize: 11)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.orange,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        padding: const EdgeInsets.symmetric(vertical: 10),
                      ),
                    )),
                  ]);
                }),
              ),
            ],

            // Remove button (admin only, not self)
            if (isAdmin && !isMe) ...[
              const SizedBox(height: 20),
              SizedBox(width: double.infinity, child: OutlinedButton.icon(
                onPressed: () {
                  Navigator.pop(context);
                  // TODO: implement remove member
                },
                icon: const Icon(Icons.person_remove, size: 16),
                label: const Text('Remove from Room'),
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: const BorderSide(color: AppColors.error), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)), padding: const EdgeInsets.symmetric(vertical: 12)),
              )),
            ],
          ]),
        ),
      ),
    );
  }

  Widget _detailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppColors.inputBg, borderRadius: BorderRadius.circular(10)),
          child: Icon(icon, size: 16, color: AppColors.textMuted),
        ),
        const SizedBox(width: 12),
        SizedBox(width: 60, child: Text(label, style: const TextStyle(fontSize: 12, color: AppColors.textMuted))),
        Expanded(child: Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500))),
      ]),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final currentId = CurrentUser.id;

    return RefreshIndicator(
      onRefresh: () async { setState(() => loading = true); await _loadData(); },
      child: ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
        const Text('Roommates', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
        const Text('Manage your household members', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
        const SizedBox(height: 16),

        // Invite code
        AppCard(color: AppColors.pastelTeal, child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Invite Code', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            Text(inviteCode, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700, color: AppColors.primary)),
          ])),
          IconButton(
            icon: Icon(copied ? Icons.check : Icons.copy, color: AppColors.primary),
            onPressed: () {
              Clipboard.setData(ClipboardData(text: inviteCode));
              setState(() => copied = true);
              Future.delayed(const Duration(seconds: 2), () { if (mounted) setState(() => copied = false); });
            },
          ),
        ])),
        const SizedBox(height: 20),

        // Members
        ...members.asMap().entries.map((entry) {
          final i = entry.key;
          final m = entry.value;
          final isCurrentUser = m['id']?.toString() == currentId;
          final bgColor = AppColors.categoryColors[i % AppColors.categoryColors.length];

          return Padding(padding: const EdgeInsets.only(bottom: 12), child: GestureDetector(
            onTap: () => _showMemberDetail(m),
            child: AppCard(color: bgColor, child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(children: [
                AvatarWidget(name: m['name'] ?? '', avatarUrl: m['avatar_url'], size: 44),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Text(m['name'] ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    if (isCurrentUser) ...[const SizedBox(width: 8), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: Colors.white.withOpacity(0.6), borderRadius: BorderRadius.circular(8)), child: const Text('You', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600)))],
                  ]),
                  Text(m['role'] == 'admin' ? '\u2B50 Admin' : 'Teammate', style: TextStyle(fontSize: 12, color: m['role'] == 'admin' ? Colors.orange : AppColors.textMuted)),
                ])),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                const Icon(Icons.mail_outline, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(m['email'] ?? '', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.phone_outlined, size: 14, color: AppColors.textMuted),
                const SizedBox(width: 6),
                Text(m['phone'] ?? 'Not added', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              ]),
            ],
          ))));
        }),
      ]),
    );
  }
}
