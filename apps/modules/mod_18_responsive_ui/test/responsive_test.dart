import 'package:test/test.dart';
import 'package:mod_18_responsive_ui/mod_18_responsive_ui.dart';

void main() {
  test('Correctly identifies compact, medium, and expanded devices', () {
    expect(Breakpoints.getDeviceType(390), equals(DeviceType.compact));
    expect(Breakpoints.getDeviceType(768), equals(DeviceType.medium));
    expect(Breakpoints.getDeviceType(1024), equals(DeviceType.expanded));
    expect(Breakpoints.isTablet(768), isTrue);
    expect(Breakpoints.isTablet(390), isFalse);
  });
}
