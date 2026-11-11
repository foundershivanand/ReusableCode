import 'package:test/test.dart';
import 'package:mod_25_crash_monitoring/mod_25_crash_monitoring.dart';

void main() {
  setUp(() => CrashMonitor.clear());

  test('Maintains rolling window of breadcrumbs', () {
    for (int i = 0; i < 60; i++) {
      CrashMonitor.addBreadcrumb('Action $i');
    }
    expect(CrashMonitor.breadcrumbs.length, equals(CrashMonitor.maxBreadcrumbs));
    expect(CrashMonitor.breadcrumbs.last.message, equals('Action 59'));
  });
}
