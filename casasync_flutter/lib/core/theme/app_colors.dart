import 'package:flutter/material.dart';

class AppColors {
  static bool _isDark = false;
  static void setDark(bool dark) => _isDark = dark;

  // Primary
  static const Color primary = Color(0xFF2BBCC4);
  static const Color primaryLight = Color(0xFFE0F7FA);
  static const Color secondary = Color(0xFF1A2332);

  // Background
  static Color get background => _isDark ? const Color(0xFF0F1117) : const Color(0xFFFFFFFF);
  static Color get surface => _isDark ? const Color(0xFF1A1D27) : const Color(0xFFFFFFFF);
  static Color get cardBg => _isDark ? const Color(0xFF1E2130) : const Color(0xFFFFFFFF);
  static Color get inputBg => _isDark ? const Color(0xFF252836) : const Color(0xFFF8F9FC);

  // Text
  static Color get textPrimary => _isDark ? const Color(0xFFE8ECF1) : const Color(0xFF1A2332);
  static Color get textSecondary => _isDark ? const Color(0xFFBCC1CA) : const Color(0xFF4A5568);
  static Color get textMuted => _isDark ? const Color(0xFF6B7280) : const Color(0xFF9CA3AF);
  static Color get textLight => _isDark ? const Color(0xFF4A5568) : const Color(0xFFBCC1CA);

  // Border
  static Color get border => _isDark ? const Color(0xFF2D3142) : const Color(0xFFE8ECF1);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Pastels (slightly muted in dark mode)
  static Color get pastelPink => _isDark ? const Color(0xFF3D2A30) : const Color(0xFFFCE4EC);
  static Color get pastelGreen => _isDark ? const Color(0xFF1E3326) : const Color(0xFFE8F5E9);
  static Color get pastelBlue => _isDark ? const Color(0xFF1E2A3D) : const Color(0xFFE3F2FD);
  static Color get pastelYellow => _isDark ? const Color(0xFF3D3820) : const Color(0xFFFFF9C4);
  static Color get pastelPurple => _isDark ? const Color(0xFF2D2335) : const Color(0xFFF3E5F5);
  static Color get pastelOrange => _isDark ? const Color(0xFF3D3020) : const Color(0xFFFFF3E0);
  static Color get pastelTeal => _isDark ? const Color(0xFF1E3332) : const Color(0xFFE0F2F1);

  // Category colors
  static List<Color> get categoryColors => [
    pastelPink,
    pastelGreen,
    pastelBlue,
    pastelPurple,
  ];

  // Note colors
  static Map<String, Color> get noteColors => {
    'yellow': pastelYellow,
    'pink': pastelPink,
    'green': pastelGreen,
    'blue': pastelBlue,
    'purple': pastelPurple,
    'orange': pastelOrange,
  };

  // Gradient for login
  static const LinearGradient loginGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      Color(0xFFFFFFFF),
      Color(0xFFFFFFFF),
      Color(0xFFFFFFFF),
    ],
  );

  // Avatar colors
  static Color getAvatarColor(String name) {
    final colors = [
      const Color(0xFFFF6B6B),
      const Color(0xFF4ECDC4),
      const Color(0xFF45B7D1),
      const Color(0xFFFFA07A),
      const Color(0xFF98D8C8),
      const Color(0xFFC06C84),
      const Color(0xFF6C5CE7),
      const Color(0xFFFFD93D),
    ];
    return colors[name.codeUnitAt(0) % colors.length];
  }
}
