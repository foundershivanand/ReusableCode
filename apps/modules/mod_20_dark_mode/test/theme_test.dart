import 'package:test/test.dart';
import 'package:mod_20_dark_mode/mod_20_dark_mode.dart';

void main() {
  test('ThemeController resolves system theme correctly', () {
    final controller = ThemeController();
    expect(controller.isDark(true), isTrue);
    expect(controller.isDark(false), isFalse);

    controller.setPreference(ThemePreference.dark);
    expect(controller.isDark(false), isTrue);

    controller.setPreference(ThemePreference.light);
    expect(controller.isDark(true), isFalse);
  });
}
