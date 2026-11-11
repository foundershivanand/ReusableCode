class PerformanceTrace {
  final String name;
  final Stopwatch _stopwatch = Stopwatch();

  PerformanceTrace(this.name);

  void start() => _stopwatch.start();
  int stop() {
    _stopwatch.stop();
    return _stopwatch.elapsedMilliseconds;
  }
}
