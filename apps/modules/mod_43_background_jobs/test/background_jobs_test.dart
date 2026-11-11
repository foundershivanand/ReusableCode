import 'package:test/test.dart';
import 'package:mod_43_background_jobs/mod_43_background_jobs.dart';

void main() {
  test('Instantiates BackgroundTaskConfig with default constraints', () {
    const config = BackgroundTaskConfig(
      taskId: 'sync_data',
      frequency: Duration(hours: 4),
    );
    expect(config.requiredNetwork, equals(NetworkType.connected));
    expect(config.requiresCharging, isFalse);
  });
}
