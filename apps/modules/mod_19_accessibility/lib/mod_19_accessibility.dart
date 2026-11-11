import 'package:flutter/material.dart';

class AccessibleHelper {
  static Widget makeAccessible({
    required Widget child,
    required String label,
    String? hint,
    bool isButton = false,
  }) {
    return Semantics(
      label: label,
      hint: hint,
      button: isButton,
      child: child,
    );
  }
}
