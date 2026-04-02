import 'dart:convert';
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/helpers.dart';

class AvatarWidget extends StatelessWidget {
  final String name;
  final String? avatarUrl;
  final double size;

  const AvatarWidget({
    super.key,
    required this.name,
    this.avatarUrl,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    if (avatarUrl != null && avatarUrl!.isNotEmpty) {
      // Check if it's a base64 data URL
      if (avatarUrl!.startsWith('data:image')) {
        final base64Data = avatarUrl!.split(',').last;
        return ClipRRect(
          borderRadius: BorderRadius.circular(size / 3),
          child: Image.memory(
            base64Decode(base64Data),
            width: size,
            height: size,
            fit: BoxFit.cover,
            errorBuilder: (_, __, ___) => _buildInitials(),
          ),
        );
      }
      return ClipRRect(
        borderRadius: BorderRadius.circular(size / 3),
        child: Image.network(
          avatarUrl!,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _buildInitials(),
        ),
      );
    }
    return _buildInitials();
  }

  Widget _buildInitials() {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.getAvatarColor(name),
        borderRadius: BorderRadius.circular(size / 3),
      ),
      alignment: Alignment.center,
      child: Text(
        Helpers.getInitials(name),
        style: TextStyle(
          color: Colors.white,
          fontSize: size * 0.4,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}
