import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../data/services/services.dart';
import '../../../data/models/models.dart';
import '../../../shared/widgets/avatar_widget.dart';

class MessagesScreen extends ConsumerStatefulWidget {
  const MessagesScreen({super.key});
  @override
  ConsumerState<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends ConsumerState<MessagesScreen> with SingleTickerProviderStateMixin {
  late TabController _tabCtrl;

  // Room chat state
  final _service = MessageService();
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<MessageModel> messages = [];
  bool loading = true;
  int? roomId;
  String roomName = '';
  Timer? _poll;

  // DM state
  List<Map<String, dynamic>> members = [];
  String? _dmPartnerId;
  String _dmPartnerName = '';
  List<Map<String, dynamic>> _dmMessages = [];
  final _dmMsgCtrl = TextEditingController();
  final _dmScrollCtrl = ScrollController();
  Timer? _dmPoll;

  @override
  void initState() {
    super.initState();
    _tabCtrl = TabController(length: 2, vsync: this);
    _init();
  }

  Future<void> _init() async {
    try {
      roomId = CurrentUser.roomId;
      if (roomId != null) {
        final results = await Future.wait([
          SupabaseDB.getRoom(roomId!),
          SupabaseDB.getRoomMembers(roomId!),
        ]);
        roomName = (results[0] as Map<String, dynamic>?)?['name'] ?? '';
        members = List<Map<String, dynamic>>.from(results[1] as List);
        await _loadMessages();
      }
    } catch (_) {}
    if (mounted) setState(() => loading = false);
    _poll = Timer.periodic(const Duration(seconds: 3), (_) => _loadMessages());
  }

  Future<void> _loadMessages() async {
    if (roomId == null) return;
    final msgs = await _service.getMessages(roomId!);
    if (mounted && msgs.length != messages.length) {
      setState(() => messages = msgs);
      _scrollToBottom(_scrollCtrl);
    }
  }

  void _scrollToBottom(ScrollController ctrl) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ctrl.hasClients) ctrl.animateTo(ctrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || roomId == null) return;
    _msgCtrl.clear();
    await _service.sendMessage(roomId!, text);
    await _loadMessages();
  }

  // DM methods
  void _openDM(Map<String, dynamic> member) {
    setState(() {
      _dmPartnerId = member['id'].toString();
      _dmPartnerName = member['name'] ?? '';
      _dmMessages = [];
    });
    _loadDMs();
    _dmPoll?.cancel();
    _dmPoll = Timer.periodic(const Duration(seconds: 3), (_) => _loadDMs());
  }

  Future<void> _loadDMs() async {
    if (_dmPartnerId == null || CurrentUser.id == null) return;
    try {
      final msgs = await SupabaseDB.getDMs(CurrentUser.id!, _dmPartnerId!);
      msgs.sort((a, b) => (a['created_at'] ?? '').compareTo(b['created_at'] ?? ''));
      if (mounted && msgs.length != _dmMessages.length) {
        setState(() => _dmMessages = msgs);
        _scrollToBottom(_dmScrollCtrl);
      }
    } catch (_) {}
  }

  Future<void> _sendDM() async {
    final text = _dmMsgCtrl.text.trim();
    if (text.isEmpty || _dmPartnerId == null) return;
    _dmMsgCtrl.clear();
    try {
      await SupabaseDB.sendDM({
        'sender_id': CurrentUser.id,
        'sender_name': CurrentUser.name ?? '',
        'receiver_id': _dmPartnerId,
        'receiver_name': _dmPartnerName,
        'content': text,
        'room_id': roomId,
      });
      await _loadDMs();
    } catch (_) {}
  }

  @override
  void dispose() {
    _poll?.cancel();
    _dmPoll?.cancel();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    _dmMsgCtrl.dispose();
    _dmScrollCtrl.dispose();
    _tabCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());

    return Column(children: [
      // Header
      Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Messages', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            Text(roomName, style: TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ])),
          Container(padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: AppColors.pastelGreen, borderRadius: BorderRadius.circular(12)),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [
              CircleAvatar(radius: 4, backgroundColor: AppColors.success),
              SizedBox(width: 6),
              Text('Live', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)),
            ]),
          ),
        ]),
      ),
      const SizedBox(height: 8),

      // Tabs
      Container(
        margin: const EdgeInsets.symmetric(horizontal: 16),
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(color: AppColors.inputBg, borderRadius: BorderRadius.circular(14)),
        child: TabBar(
          controller: _tabCtrl,
          onTap: (_) => setState(() {}),
          indicator: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
          indicatorSize: TabBarIndicatorSize.tab,
          dividerColor: Colors.transparent,
          labelColor: Colors.white,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
          unselectedLabelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500),
          tabs: const [
            Tab(text: 'Room Chat'),
            Tab(text: 'Private'),
          ],
        ),
      ),
      const SizedBox(height: 8),

      // Tab content
      Expanded(
        child: TabBarView(
          controller: _tabCtrl,
          children: [
            _buildRoomChat(),
            _buildPrivateTab(),
          ],
        ),
      ),
    ]);
  }

  // ─── ROOM CHAT TAB ───
  Widget _buildRoomChat() {
    final currentUserId = CurrentUser.id;
    return Column(children: [
      Expanded(child: ListView.builder(
        controller: _scrollCtrl,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        itemCount: messages.length,
        itemBuilder: (_, i) {
          final msg = messages[i];
          final isMe = msg.senderId?.toString() == currentUserId;
          final showDate = i == 0 || !Helpers.isSameDay(messages[i - 1].createdAt, msg.createdAt);
          return Column(children: [
            if (showDate) Padding(
              padding: const EdgeInsets.symmetric(vertical: 12),
              child: Text(Helpers.isToday(msg.createdAt) ? 'Today' : Helpers.formatDateShort(msg.createdAt),
                style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ),
            _buildMessageBubble(msg, isMe),
          ]);
        },
      )),
      _buildChatInput(_msgCtrl, _sendMessage),
    ]);
  }

  // ─── PRIVATE TAB ───
  Widget _buildPrivateTab() {
    if (_dmPartnerId != null) return _buildDMChat();
    return _buildMemberList();
  }

  Widget _buildMemberList() {
    final currentUserId = CurrentUser.id;
    final otherMembers = members.where((m) => m['id'].toString() != currentUserId).toList();

    if (otherMembers.isEmpty) {
      return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.people_outline, size: 48, color: AppColors.textLight),
        const SizedBox(height: 12),
        Text('No other members in this room', style: TextStyle(fontSize: 14, color: AppColors.textMuted)),
      ]));
    }

    return ListView.builder(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      itemCount: otherMembers.length,
      itemBuilder: (_, i) {
        final m = otherMembers[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 8),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          child: ListTile(
            leading: AvatarWidget(name: m['name'] ?? '', avatarUrl: m['avatar_url'], size: 42),
            title: Text(m['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
            subtitle: Text(m['role'] == 'admin' ? 'Admin' : 'Member', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
            trailing: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(10)),
              child: const Icon(Icons.chat_outlined, size: 18, color: Colors.white),
            ),
            onTap: () => _openDM(m),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        );
      },
    );
  }

  Widget _buildDMChat() {
    final currentUserId = CurrentUser.id;
    return Column(children: [
      // DM Header with back button
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        child: Row(children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 18),
            onPressed: () {
              _dmPoll?.cancel();
              setState(() { _dmPartnerId = null; _dmMessages = []; });
            },
          ),
          AvatarWidget(name: _dmPartnerName, size: 32),
          const SizedBox(width: 10),
          Expanded(child: Text(_dmPartnerName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600))),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: AppColors.pastelPurple, borderRadius: BorderRadius.circular(8)),
            child: Text('Private', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Colors.purple)),
          ),
        ]),
      ),
      // DM Messages
      Expanded(child: _dmMessages.isEmpty
        ? Center(child: Text('No messages yet. Say hi!', style: TextStyle(color: AppColors.textMuted)))
        : ListView.builder(
            controller: _dmScrollCtrl,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            itemCount: _dmMessages.length,
            itemBuilder: (_, i) {
              final m = _dmMessages[i];
              final isMe = m['sender_id']?.toString() == currentUserId;
              final msg = MessageModel(
                id: m['id'] ?? 0,
                roomId: roomId ?? 0,
                senderId: m['sender_id'],
                senderName: m['sender_name'] ?? '',
                content: m['content'] ?? '',
                createdAt: m['created_at'] != null ? DateTime.parse(m['created_at']) : DateTime.now(),
              );
              final showDate = i == 0 || !Helpers.isSameDay(
                DateTime.parse(_dmMessages[i - 1]['created_at'] ?? DateTime.now().toIso8601String()),
                msg.createdAt,
              );
              return Column(children: [
                if (showDate) Padding(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  child: Text(Helpers.isToday(msg.createdAt) ? 'Today' : Helpers.formatDateShort(msg.createdAt),
                    style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                ),
                _buildMessageBubble(msg, isMe),
              ]);
            },
          ),
      ),
      _buildChatInput(_dmMsgCtrl, _sendDM),
    ]);
  }

  // ─── SHARED WIDGETS ───
  Widget _buildMessageBubble(MessageModel msg, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[AvatarWidget(name: msg.senderName, size: 28), const SizedBox(width: 8)],
          Flexible(child: Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isMe ? AppColors.secondary : AppColors.cardBg,
              borderRadius: BorderRadius.only(
                topLeft: const Radius.circular(18),
                topRight: const Radius.circular(18),
                bottomLeft: Radius.circular(isMe ? 18 : 4),
                bottomRight: Radius.circular(isMe ? 4 : 18),
              ),
              border: isMe ? null : Border.all(color: AppColors.border),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(msg.content, style: TextStyle(fontSize: 14, color: isMe ? Colors.white : AppColors.textPrimary)),
              const SizedBox(height: 4),
              Text(Helpers.formatTime(msg.createdAt), style: TextStyle(fontSize: 9, color: isMe ? Colors.white54 : AppColors.textMuted)),
            ]),
          )),
          if (isMe) ...[const SizedBox(width: 8), AvatarWidget(name: msg.senderName, size: 28)],
        ],
      ),
    );
  }

  Widget _buildChatInput(TextEditingController ctrl, VoidCallback onSend) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 8, 16),
      decoration: BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.border))),
      child: SafeArea(top: false, child: Row(children: [
        Expanded(child: TextField(
          controller: ctrl,
          onSubmitted: (_) => onSend(),
          decoration: InputDecoration(
            hintText: 'Type a message...',
            hintStyle: const TextStyle(fontSize: 13),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: AppColors.border)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide(color: AppColors.border)),
          ),
        )),
        const SizedBox(width: 8),
        FloatingActionButton.small(
          onPressed: onSend,
          backgroundColor: AppColors.primary,
          child: const Icon(Icons.send_rounded, size: 18),
        ),
      ])),
    );
  }
}
