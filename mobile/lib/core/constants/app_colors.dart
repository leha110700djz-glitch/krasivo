import 'package:flutter/material.dart';

const primaryColor = Color(0xFF6D28D9);
const primaryLight = Color(0xFF8B5CF6);
const primaryDark = Color(0xFF5B21B6);
const accentColor = Color(0xFFF59E0B);
const accentLight = Color(0xFFFBBF24);
const backgroundColor = Color(0xFFF9FAFB);
const surfaceColor = Colors.white;
const textPrimary = Color(0xFF111827);
const textSecondary = Color(0xFF6B7280);
const textHint = Color(0xFF9CA3AF);
const dividerColor = Color(0xFFE5E7EB);
const errorColor = Color(0xFFEF4444);
const successColor = Color(0xFF10B981);
const warningColor = Color(0xFFF59E0B);

const cardShadow = [
  BoxShadow(
    color: Color(0x0F000000),
    blurRadius: 12,
    offset: Offset(0, 4),
  ),
];

const primaryGradient = LinearGradient(
  begin: Alignment.topLeft,
  end: Alignment.bottomRight,
  colors: [primaryColor, primaryLight],
);

const heroGradient = LinearGradient(
  begin: Alignment.topCenter,
  end: Alignment.bottomCenter,
  colors: [Color(0xFF6D28D9), Color(0xFF8B5CF6)],
);
