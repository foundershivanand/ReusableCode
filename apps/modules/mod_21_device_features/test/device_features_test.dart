import 'package:test/test.dart';
import 'package:mod_21_device_features/mod_21_device_features.dart';

void main() {
  test('MockDeviceHaptics records triggered pattern', () async {
    final haptics = MockDeviceHaptics();
    await haptics.trigger(HapticPattern.success);
    expect(haptics.lastPattern, equals(HapticPattern.success));
  });

  test('MockSecureClipboard copies and retrieves data', () async {
    final clipboard = MockSecureClipboard();
    await clipboard.copySensitive('sensitive_token');
    expect(await clipboard.paste(), equals('sensitive_token'));
    clipboard.clear();
    expect(await clipboard.paste(), isNull);
  });
}
