import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/services/services.dart';

final dashboardServiceProvider = Provider((ref) => DashboardService());

final dashboardProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final service = ref.read(dashboardServiceProvider);
  return service.getSummary();
});
