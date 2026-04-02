import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../features/auth/presentation/login_screen.dart';
import '../features/dashboard/presentation/dashboard_screen.dart';
import '../features/expenses/presentation/expenses_screen.dart';
import '../features/chores/presentation/chores_screen.dart';
import '../features/inventory/presentation/inventory_screen.dart';
import '../features/roommates/presentation/roommates_screen.dart';
import '../features/messages/presentation/messages_screen.dart';
import '../features/analytics/presentation/analytics_screen.dart';
import '../features/notices/presentation/notices_screen.dart';
import '../features/settings/presentation/settings_screen.dart';
import '../shared/widgets/main_layout.dart';

/// Notifier that converts auth state changes into GoRouter refreshes.
class AuthChangeNotifier extends ChangeNotifier {
  AuthChangeNotifier(Ref ref) {
    ref.listen(authProvider, (_, __) => notifyListeners());
  }
}

final _authChangeProvider = Provider((ref) => AuthChangeNotifier(ref));

final routerProvider = Provider<GoRouter>((ref) {
  final authChangeNotifier = ref.read(_authChangeProvider);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: authChangeNotifier,
    redirect: (context, state) {
      final authState = ref.read(authProvider);
      final isLoggedIn = authState.valueOrNull != null;
      final isLoading = authState.isLoading;
      final isLoginPage = state.matchedLocation == '/login';

      // While loading, don't redirect — stay where we are
      if (isLoading) return null;

      if (!isLoggedIn && !isLoginPage) return '/login';
      if (isLoggedIn && isLoginPage) return '/';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => MainLayout(child: child),
        routes: [
          GoRoute(path: '/', builder: (context, state) => const DashboardScreen()),
          GoRoute(path: '/expenses', builder: (context, state) => const ExpensesScreen()),
          GoRoute(path: '/chores', builder: (context, state) => const ChoresScreen()),
          GoRoute(path: '/inventory', builder: (context, state) => const InventoryScreen()),
          GoRoute(path: '/roommates', builder: (context, state) => const RoommatesScreen()),
          GoRoute(path: '/messages', builder: (context, state) => const MessagesScreen()),
          GoRoute(path: '/analytics', builder: (context, state) => const AnalyticsScreen()),
          GoRoute(path: '/notices', builder: (context, state) => const NoticesScreen()),
          GoRoute(path: '/settings', builder: (context, state) => const SettingsScreen()),
        ],
      ),
    ],
  );
});
