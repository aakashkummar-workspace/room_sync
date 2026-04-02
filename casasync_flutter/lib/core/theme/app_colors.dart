import 'package:flutter/material.dart';

class AppColors {
  // Primary
  static const Color primary = Color(0xFF2BBCC4);
  static const Color primaryLight = Color(0xFFE0F7FA);
  static const Color secondary = Color(0xFF1A2332);

  // Background
  static const Color background = Color(0xFFFFFFFF);
  static const Color surface = Color(0xFFFFFFFF);
  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color inputBg = Color(0xFFF8F9FC);

  // Text
  static const Color textPrimary = Color(0xFF1A2332);
  static const Color textSecondary = Color(0xFF4A5568);
  static const Color textMuted = Color(0xFF9CA3AF);
  static const Color textLight = Color(0xFFBCC1CA);

  // Border
  static const Color border = Color(0xFFE8ECF1);

  // Status
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // Pastels
  static const Color pastelPink = Color(0xFFFCE4EC);
  static const Color pastelGreen = Color(0xFFE8F5E9);
  static const Color pastelBlue = Color(0xFFE3F2FD);
  static const Color pastelYellow = Color(0xFFFFF9C4);
  static const Color pastelPurple = Color(0xFFF3E5F5);
  static const Color pastelOrange = Color(0xFFFFF3E0);
  static const Color pastelTeal = Color(0xFFE0F2F1);

  // Category colors
  static const List<Color> categoryColors = [
    pastelPink,
    pastelGreen,
    pastelBlue,
    pastelPurple,
  ];

  // Note colors
  static const Map<String, Color> noteColors = {
    'yellow': Color(0xFFFFF9C4),
    'pink': Color(0xFFFCE4EC),
    'green': Color(0xFFE8F5E9),
    'blue': Color(0xFFE3F2FD),
    'purple': Color(0xFFF3E5F5),
    'orange': Color(0xFFFFF3E0),
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
