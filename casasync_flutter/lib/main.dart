import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'core/theme/app_theme.dart';
import 'providers/theme_provider.dart';
import 'router/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Status bar style
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.dark,
  ));

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://btoffumxzlhyundmfapc.supabase.co',
    anonKey:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2ZmdW14emxoeXVuZG1mYXBjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MTcwMTgsImV4cCI6MjA4MTA5MzAxOH0.cU34sLRqfn5fPyEiK8HmNALJ1pCHKpiCkNkcetGzz4M',
  );

  runApp(const ProviderScope(child: CasaSyncApp()));
}

class CasaSyncApp extends ConsumerWidget {
  const CasaSyncApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final themeMode = ref.watch(themeModeProvider);

    return MaterialApp.router(
      title: 'CasaSync',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: themeMode,
      routerConfig: router,
    );
  }
}
