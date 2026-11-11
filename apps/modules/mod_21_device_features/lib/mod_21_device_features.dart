library mod_21_device_features;

import 'dart:async';

enum HapticFeedbackType {
  lightImpact,
  mediumImpact,
  heavyImpact,
  selectionClick,
  successNotification,
  warningNotification,
  errorNotification
}

abstract class HapticEngine {
  Future<void> trigger(HapticFeedbackType type);
}

class SystemHapticEngine implements HapticEngine {
  @override
  Future<void> trigger(HapticFeedbackType type) async {
    // Bridges to native HapticFeedback
  }
}

abstract class SecureClipboardVault {
  Future<void> copyWithAutoClear(String sensitiveText, {Duration clearAfter = const Duration(seconds: 60)});
  Future<String?> read();
  Future<void> clear();
}

class InMemorySecureClipboard implements SecureClipboardVault {
  String? _content;
  Timer? _clearTimer;

  @override
  Future<void> copyWithAutoClear(String sensitiveText, {Duration clearAfter = const Duration(seconds: 60)}) async {
    _clearTimer?.cancel();
    _content = sensitiveText;
    _clearTimer = Timer(clearAfter, () {
      _content = null;
    });
  }

  @override
  Future<String?> read() async => _content;

  @override
  Future<void> clear() async {
    _clearTimer?.cancel();
    _content = null;
  }
}
