import 'package:test/test.dart';
import 'package:mod_12_offline_first_sync/mod_12_offline_first_sync.dart';

void main() {
  test('Processes outbox queue successfully', () async {
    final engine = OutboxSyncEngine();
    engine.enqueue(SyncMutation(
      id: 'mut_1',
      endpoint: '/api/v1/notes',
      method: 'POST',
      payload: {'title': 'Hello Offline'},
    ));

    expect(engine.queueLength, equals(1));

    final count = await engine.processOutbox((mut) async => true);
    expect(count, equals(1));
    expect(engine.queueLength, equals(0));
  });

  test('Retries failed mutation up to maxRetries', () async {
    final engine = OutboxSyncEngine(maxRetries: 2);
    engine.enqueue(SyncMutation(
      id: 'mut_fail',
      endpoint: '/api/v1/sync',
      method: 'POST',
      payload: {},
    ));

    // Attempt 1: fails, re-enqueued with retryCount 1
    await engine.processOutbox((mut) async => false);
    expect(engine.queueLength, equals(1));

    // Attempt 2: fails, re-enqueued with retryCount 2
    await engine.processOutbox((mut) async => false);
    expect(engine.queueLength, equals(1));

    // Attempt 3: fails, exceeded maxRetries, dropped
    await engine.processOutbox((mut) async => false);
    expect(engine.queueLength, equals(0));
  });
}
