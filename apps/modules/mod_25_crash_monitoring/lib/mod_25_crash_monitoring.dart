abstract class CrashReporter {
  void recordError(dynamic exception, StackTrace stack, {String? reason});
  void addBreadcrumb(String message);
}

class MockCrashReporter implements CrashReporter {
  final List<String> breadcrumbs = [];
  final List<Map<String, dynamic>> reportedErrors = [];

  @override
  void addBreadcrumb(String message) {
    breadcrumbs.add(message);
  }

  @override
  void recordError(dynamic exception, StackTrace stack, {String? reason}) {
    reportedErrors.add({"error": exception.toString(), "reason": reason});
  }
}
