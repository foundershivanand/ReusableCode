import 'package:flutter/material.dart';

class FactoryThemeManager {
  static ThemeData get lightTheme {
    return ThemeData(
      brightness: Brightness.light,
      primaryColor: const Color(0xFF6200EE),
      scaffoldBackgroundColor: const Color(0xFFF8F9FA),
      useMaterial3: true,
    );
  }

  static ThemeData get darkTheme {
    return ThemeData(
      brightness: Brightness.dark,
      primaryColor: const Color(0xFFBB86FC),
      scaffoldBackgroundColor: const Color(0xFF121212),
      useMaterial3: true,
    );
  }
}
