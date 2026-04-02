import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import '../../../core/theme/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/theme_provider.dart';
import '../../../data/services/services.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/avatar_widget.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});
  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool notifications = true;
  Map<String, dynamic>? room;
  bool loadingRoom = true;

  @override
  void initState() {
    super.initState();
    _loadRoom();
  }

  Future<void> _loadRoom() async {
    try {
      final roomId = CurrentUser.roomId;
      if (roomId != null) {
        room = await SupabaseDB.getRoom(roomId);
      }
    } catch (_) {}
    if (mounted) setState(() => loadingRoom = false);
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final user = authState.valueOrNull;
    final themeNotifier = ref.read(themeModeProvider.notifier);
    final isDark = ref.watch(themeModeProvider) == ThemeMode.dark;

    return ListView(padding: const EdgeInsets.fromLTRB(16, 8, 16, 100), children: [
      const Text('Settings', style: TextStyle(fontSize: 24, fontWeight: FontWeight.w700)),
      const Text('Manage your preferences', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
      const SizedBox(height: 24),

      // Profile card
      AppCard(child: Column(children: [
        AvatarWidget(name: user?.name ?? '?', avatarUrl: user?.avatarUrl, size: 72),
        const SizedBox(height: 12),
        Text(user?.name ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        Text(user?.email ?? '', style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
        const SizedBox(height: 16),
        SizedBox(width: double.infinity, child: OutlinedButton(
          onPressed: () => _showEditProfile(user),
          style: OutlinedButton.styleFrom(shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14))),
          child: const Text('Edit Profile'),
        )),
      ])),
      const SizedBox(height: 20),

      // Room Settings (admin only)
      if (CurrentUser.isAdmin && room != null) ...[
        const Text('Room', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
        const SizedBox(height: 10),
        AppCard(padding: EdgeInsets.zero, child: Column(children: [
          ListTile(
            leading: const Icon(Icons.meeting_room_outlined, size: 20),
            title: const Text('Room Name', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(room?['name'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
              const SizedBox(width: 4),
              const Icon(Icons.edit_outlined, size: 16, color: AppColors.textMuted),
            ]),
            onTap: () => _showEditRoom('name', room?['name'] ?? ''),
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.vpn_key_outlined, size: 20),
            title: const Text('Invite Code', style: TextStyle(fontSize: 13, color: AppColors.textMuted)),
            trailing: Row(mainAxisSize: MainAxisSize.min, children: [
              Text(room?['invite_code'] ?? '', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, letterSpacing: 1)),
              const SizedBox(width: 4),
              const Icon(Icons.edit_outlined, size: 16, color: AppColors.textMuted),
            ]),
            onTap: () => _showEditRoom('invite_code', room?['invite_code'] ?? ''),
          ),
        ])),
        const SizedBox(height: 20),
      ],

      // Preferences
      const Text('Preferences', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
      const SizedBox(height: 10),
      AppCard(padding: EdgeInsets.zero, child: Column(children: [
        SwitchListTile(
          title: const Text('Notifications', style: TextStyle(fontSize: 14)),
          secondary: const Icon(Icons.notifications_outlined, size: 20),
          value: notifications,
          onChanged: (v) => setState(() => notifications = v),
          activeColor: AppColors.primary,
        ),
        const Divider(height: 1),
        SwitchListTile(
          title: const Text('Dark Mode', style: TextStyle(fontSize: 14)),
          secondary: const Icon(Icons.dark_mode_outlined, size: 20),
          value: isDark,
          onChanged: (_) => themeNotifier.toggle(),
          activeColor: AppColors.primary,
        ),
      ])),
      const SizedBox(height: 20),

      // Account
      const Text('Account', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.textMuted)),
      const SizedBox(height: 10),
      AppCard(padding: EdgeInsets.zero, child: Column(children: [
        _infoRow('Name', user?.name ?? ''),
        const Divider(height: 1),
        _infoRow('Email', user?.email ?? ''),
        const Divider(height: 1),
        _infoRow('Phone', user?.phone ?? 'Not set'),
        const Divider(height: 1),
        _infoRow('Role', user?.role ?? 'member'),
      ])),
      const SizedBox(height: 32),

      // Logout
      SizedBox(width: double.infinity, child: ElevatedButton.icon(
        onPressed: () async {
          await ref.read(authProvider.notifier).logout();
          if (mounted) context.go('/login');
        },
        icon: const Icon(Icons.logout, size: 18),
        label: const Text('Logout'),
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.error,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      )),
    ]);
  }

  Widget _infoRow(String label, String value) {
    return Padding(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14), child: Row(children: [
      Text(label, style: const TextStyle(fontSize: 13, color: AppColors.textMuted)),
      const Spacer(),
      Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
    ]));
  }

  void _showEditRoom(String field, String currentValue) {
    final ctrl = TextEditingController(text: currentValue);
    final label = field == 'name' ? 'Room Name' : 'Invite Code';

    showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => Container(
      padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 32),
      decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
        const SizedBox(height: 20),
        Text('Edit $label', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
        const SizedBox(height: 20),
        TextField(
          controller: ctrl,
          textCapitalization: field == 'invite_code' ? TextCapitalization.characters : TextCapitalization.words,
          decoration: InputDecoration(
            labelText: label,
            prefixIcon: Icon(field == 'name' ? Icons.meeting_room_outlined : Icons.vpn_key_outlined),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: () async {
            final val = ctrl.text.trim();
            if (val.isEmpty) return;
            try {
              final roomId = CurrentUser.roomId;
              if (roomId == null) return;
              await SupabaseDB.updateRoom(roomId, {field: val});
              setState(() => room?[field] = val);
              if (mounted) Navigator.pop(context);
              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$label updated')));
            } catch (e) {
              if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
            }
          },
          child: const Text('Save'),
        )),
      ]),
    ));
  }

  void _showEditProfile(dynamic user) {
    if (user == null) return;
    final nameCtrl = TextEditingController(text: user.name);
    final phoneCtrl = TextEditingController(text: user.phone ?? '');
    String? newAvatarBase64;

    showModalBottomSheet(context: context, isScrollControlled: true, backgroundColor: Colors.transparent, builder: (_) => StatefulBuilder(
      builder: (ctx, setModalState) => Container(
        padding: EdgeInsets.fromLTRB(20, 12, 20, MediaQuery.of(context).viewInsets.bottom + 32),
        decoration: const BoxDecoration(color: Colors.white, borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
        child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          const SizedBox(height: 20),
          const Text('Edit Profile', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
          const SizedBox(height: 20),

          // Avatar with change button
          Stack(
            children: [
              if (newAvatarBase64 != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(24),
                  child: Image.memory(base64Decode(newAvatarBase64!.split(',').last), width: 80, height: 80, fit: BoxFit.cover),
                )
              else
                AvatarWidget(name: user.name, avatarUrl: user.avatarUrl, size: 80),
              Positioned(
                bottom: 0, right: 0,
                child: GestureDetector(
                  onTap: () async {
                    final picker = ImagePicker();
                    final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 400, imageQuality: 70);
                    if (picked != null) {
                      final bytes = await picked.readAsBytes();
                      final base64Str = 'data:image/jpeg;base64,${base64Encode(bytes)}';
                      setModalState(() => newAvatarBase64 = base64Str);
                    }
                  },
                  child: Container(
                    padding: const EdgeInsets.all(6),
                    decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                    child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name', prefixIcon: Icon(Icons.person_outline))),
          const SizedBox(height: 14),
          TextField(
            decoration: InputDecoration(labelText: 'Email', prefixIcon: const Icon(Icons.mail_outline), enabled: false, hintText: user.email),
            controller: TextEditingController(text: user.email),
          ),
          const SizedBox(height: 14),
          TextField(controller: phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone', prefixIcon: Icon(Icons.phone_outlined))),
          const SizedBox(height: 24),
          SizedBox(width: double.infinity, child: ElevatedButton(
            onPressed: () async {
              final updates = <String, dynamic>{'name': nameCtrl.text, 'phone': phoneCtrl.text};
              if (newAvatarBase64 != null) updates['avatar_url'] = newAvatarBase64;
              await ref.read(authProvider.notifier).updateProfile(updates);
              await ref.read(authProvider.notifier).refresh();
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('Save Changes'),
          )),
        ])),
      ),
    ));
  }
}
