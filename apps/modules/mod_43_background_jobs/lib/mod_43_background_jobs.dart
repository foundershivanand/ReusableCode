abstract class BackgroundJobScheduler {
  Future<void> schedulePeriodicSync(String jobId, Duration frequency);
  Future<void> cancelJob(String jobId);
}

class MockBackgroundJobScheduler implements BackgroundJobScheduler {
  @override
  Future<void> schedulePeriodicSync(String jobId, Duration frequency) async {}

  @override
  Future<void> cancelJob(String jobId) async {}
}
