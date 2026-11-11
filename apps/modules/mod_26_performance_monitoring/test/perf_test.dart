import 'package:test/test.dart';
import 'package:mod_26_performance_monitoring/mod_26_performance_monitoring.dart';

void main() {
  test('Records trace duration', () async {
    final watchdog = PerformanceWatchdog();
    watchdog.startTrace('screen_load');
    await Future.delayed(const Duration(milliseconds: 20));
    final duration = watchdog.stopTrace('screen_load');

    expect(duration, isNotNull);
    expect(duration!, greaterThanOrEqualTo(15));
  });
}
