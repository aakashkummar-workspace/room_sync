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

class _MessagesScreenState extends ConsumerState<MessagesScreen> {
  final _service = MessageService();
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();
  List<MessageModel> messages = [];
  bool loading = true;
  int? roomId;
  String roomName = '';
  Timer? _poll;

  @override
  void initState() { super.initState(); _init(); }

  Future<void> _init() async {
    try {
      roomId = CurrentUser.roomId;
      if (roomId != null) {
        final room = await SupabaseDB.getRoom(roomId!);
        roomName = room?['name'] ?? '';
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
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 200), curve: Curves.easeOut);
    });
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || roomId == null) return;
    _msgCtrl.clear();
    await _service.sendMessage(roomId!, text);
    await _loadMessages();
  }

  @override
  void dispose() { _poll?.cancel(); _msgCtrl.dispose(); _scrollCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (loading) return const Center(child: CircularProgressIndicator());
    final currentUserId = CurrentUser.id;

    return Column(children: [
      // Header
      Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
        child: Row(children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Messages', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700)),
            Text('$roomName \u2022 ${messages.length} messages', style: const TextStyle(fontSize: 12, color: AppColors.textMuted)),
          ])),
          Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: AppColors.pastelGreen, borderRadius: BorderRadius.circular(12)),
            child: const Row(mainAxisSize: MainAxisSize.min, children: [
              CircleAvatar(radius: 4, backgroundColor: AppColors.success),
              SizedBox(width: 6),
              Text('Live', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.success)),
            ]),
          ),
        ]),
      ),

      // Messages
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
                style: const TextStyle(fontSize: 11, color: AppColors.textMuted)),
            ),
            Align(
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
                      color: isMe ? AppColors.secondary : Colors.white,
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
            ),
          ]);
        },
      )),

      // Input
      Container(
        padding: const EdgeInsets.fromLTRB(16, 8, 8, 16),
        decoration: BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: AppColors.border))),
        child: SafeArea(top: false, child: Row(children: [
          Expanded(child: TextField(
            controller: _msgCtrl,
            onSubmitted: (_) => _sendMessage(),
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
            onPressed: _sendMessage,
            backgroundColor: AppColors.primary,
            child: const Icon(Icons.send_rounded, size: 18),
          ),
        ])),
      ),
    ]);
  }
}
