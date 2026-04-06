import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/helpers.dart';
import '../../data/models/models.dart';
import '../../providers/auth_provider.dart';
import '../../data/services/services.dart';
import '../../data/services/local_notification_service.dart';
import 'avatar_widget.dart';

class MainLayout extends ConsumerStatefulWidget {
  final Widget child;
  const MainLayout({super.key, required this.child});

  @override
  ConsumerState<MainLayout> createState() => _MainLayoutState();
}

class _MainLayoutState extends ConsumerState<MainLayout> {
  int _selectedIndex = 0;
  int _unreadCount = 0;
  List<NotificationModel> _notifications = [];
  Timer? _notifTimer;

  final _navItems = const [
    _NavItem(Icons.home_rounded, 'Home', '/'),
    _NavItem(Icons.receipt_long_outlined, 'Expenses', '/expenses'),
    _NavItem(Icons.people_outline, 'Roommates', '/roommates'),
    _NavItem(Icons.chat_bubble_outline, 'Messages', '/messages'),
  ];

  final _moreItems = const [
    _NavItem(Icons.check_box_outlined, 'Chores', '/chores'),
    _NavItem(Icons.inventory_2_outlined, 'Inventory', '/inventory'),
    _NavItem(Icons.pie_chart_outline, 'Analytics', '/analytics'),
    _NavItem(Icons.campaign_outlined, 'Notices', '/notices'),
    _NavItem(Icons.settings_outlined, 'Settings', '/settings'),
  ];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
    _notifTimer = Timer.periodic(const Duration(seconds: 30), (_) => _loadNotifications());
  }

  @override
  void dispose() {
    _notifTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadNotifications() async {
    _unreadCount = await NotificationService().getUnreadCount();
    _notifications = await NotificationService().getNotifications();
    // Show real notification in system bar if new ones appeared
    if (_notifications.isNotEmpty) {
      final latest = _notifications.first;
      await LocalNotificationService.showIfNew(_unreadCount, latest.title, latest.message);
    }
    if (mounted) setState(() {});
  }

  void _showNotifications() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.6),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(margin: EdgeInsets.only(top: 12), width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
              child: Row(children: [
                const Expanded(child: Text('Notifications', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700))),
                if (_unreadCount > 0)
                  TextButton(
                    onPressed: () async {
                      await NotificationService().markAllRead();
                      await _loadNotifications();
                      if (mounted) Navigator.pop(context);
                    },
                    child: const Text('Mark all read', style: TextStyle(fontSize: 12)),
                  ),
                IconButton(icon: const Icon(Icons.close_rounded, size: 20), onPressed: () => Navigator.pop(context)),
              ]),
            ),
            const Divider(height: 1),
            Flexible(
              child: _notifications.isEmpty
                  ? Padding(
                      padding: EdgeInsets.all(40),
                      child: Column(mainAxisSize: MainAxisSize.min, children: [
                        Icon(Icons.notifications_none, size: 48, color: AppColors.textLight),
                        SizedBox(height: 12),
                        Text('No notifications', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                      ]),
                    )
                  : ListView.separated(
                      shrinkWrap: true,
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      itemCount: _notifications.length,
                      separatorBuilder: (_, __) => const Divider(height: 1),
                      itemBuilder: (_, i) {
                        final n = _notifications[i];
                        final icon = n.type == 'expense' ? Icons.receipt_long : n.type == 'chore' ? Icons.task_alt : Icons.info_outline;
                        final iconColor = n.type == 'expense' ? Colors.pink : n.type == 'chore' ? AppColors.primary : AppColors.info;
                        return ListTile(
                          leading: Container(
                            padding: const EdgeInsets.all(8),
                            decoration: BoxDecoration(color: iconColor.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                            child: Icon(icon, size: 18, color: iconColor),
                          ),
                          title: Text(n.title, style: TextStyle(fontSize: 13, fontWeight: n.isRead ? FontWeight.w400 : FontWeight.w600)),
                          subtitle: Text(n.message, style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                          trailing: Text(Helpers.timeAgo(n.createdAt), style: TextStyle(fontSize: 10, color: AppColors.textLight)),
                          dense: true,
                          tileColor: n.isRead ? null : AppColors.pastelTeal.withOpacity(0.3),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  void _updateIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    for (int i = 0; i < _navItems.length; i++) {
      if (_navItems[i].path == location) {
        _selectedIndex = i;
        return;
      }
    }
    // Check if it's a "more" item
    for (var item in _moreItems) {
      if (item.path == location) {
        _selectedIndex = 4; // More tab
        return;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    _updateIndex(context);
    final user = ref.watch(authProvider).valueOrNull;

    final isOnDashboard = GoRouterState.of(context).matchedLocation == '/';

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) async {
        if (didPop) return;
        if (!isOnDashboard) {
          context.go('/');
          return;
        }
        final shouldExit = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            title: const Text('Exit App'),
            content: const Text('Do you want to exit the app?'),
            actions: [
              TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
              TextButton(onPressed: () => Navigator.pop(ctx, true), child: Text('Exit', style: TextStyle(color: AppColors.error))),
            ],
          ),
        );
        if (shouldExit == true && context.mounted) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Header
            Container(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
              child: Row(
                children: [
                  // Quote (shrinks on small screens)
                  Expanded(
                    child: Text(
                      '\u2728 Built for the way roommates actually live.',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontStyle: FontStyle.italic),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  const SizedBox(width: 8),
                  // Notification bell
                  Stack(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.notifications_outlined, size: 22),
                        onPressed: _showNotifications,
                      ),
                      if (_unreadCount > 0)
                        Positioned(
                          right: 6, top: 6,
                          child: Container(
                            padding: const EdgeInsets.all(4),
                            decoration: const BoxDecoration(color: AppColors.error, shape: BoxShape.circle),
                            child: Text('$_unreadCount', style: const TextStyle(fontSize: 8, color: Colors.white, fontWeight: FontWeight.w700)),
                          ),
                        ),
                    ],
                  ),
                  // Avatar
                  AvatarWidget(name: user?.name ?? '?', avatarUrl: user?.avatarUrl, size: 34),
                ],
              ),
            ),

            // Content
            Expanded(child: widget.child),
          ],
        ),
      ),

      // Bottom Nav
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border)),
          boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -2))],
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
            child: Row(
              children: [
                ..._navItems.asMap().entries.map((e) => _buildNavItem(e.value, e.key)),
                // More button
                Expanded(
                  child: GestureDetector(
                    onTap: () => _showMoreMenu(),
                    child: _buildNavIcon(
                      Icons.more_horiz,
                      'More',
                      _selectedIndex == 4,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),

    ),
    );
  }

  Widget _buildNavItem(_NavItem item, int index) {
    return Expanded(
      child: GestureDetector(
        onTap: () {
          setState(() => _selectedIndex = index);
          context.go(item.path);
        },
        behavior: HitTestBehavior.opaque,
        child: _buildNavIcon(item.icon, item.label, _selectedIndex == index),
      ),
    );
  }

  Widget _buildNavIcon(IconData icon, String label, bool active) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: active ? AppColors.primary : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, size: 20, color: active ? Colors.white : AppColors.textMuted),
        ),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: active ? AppColors.primary : AppColors.textMuted)),
      ],
    );
  }

  void _showMoreMenu() {
    final currentLocation = GoRouterState.of(context).matchedLocation;
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            Wrap(
              spacing: 16,
              runSpacing: 16,
              children: [
                ..._moreItems.map((item) => GestureDetector(
                  onTap: () {
                    Navigator.pop(ctx);
                    setState(() => _selectedIndex = 4);
                    context.go(item.path);
                  },
                  child: SizedBox(
                    width: 72,
                    child: Column(children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: currentLocation == item.path ? AppColors.primary : AppColors.background,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Icon(item.icon, size: 22, color: currentLocation == item.path ? Colors.white : AppColors.textMuted),
                      ),
                      const SizedBox(height: 6),
                      Text(item.label, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600), textAlign: TextAlign.center),
                    ]),
                  ),
                )),
                // Logout
                GestureDetector(
                  onTap: () async {
                    Navigator.pop(ctx);
                    await ref.read(authProvider.notifier).logout();
                    if (mounted) context.go('/login');
                  },
                  child: SizedBox(
                    width: 72,
                    child: Column(children: [
                      Container(
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(color: AppColors.pastelPink, borderRadius: BorderRadius.circular(16)),
                        child: const Icon(Icons.logout, size: 22, color: AppColors.error),
                      ),
                      const SizedBox(height: 6),
                      const Text('Logout', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.error)),
                    ]),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final String label;
  final String path;
  const _NavItem(this.icon, this.label, this.path);
}
