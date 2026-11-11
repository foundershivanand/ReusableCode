enum ErrorType {
  network,
  timeout,
  unauthorized,
  forbidden,
  notFound,
  conflict,
  rateLimited,
  serverError,
  validation,
  unexpected,
}

class AppError {
  final ErrorType type;
  final String userMessage;
  final String debugMessage;
  final StackTrace? stackTrace;

  const AppError({
    required this.type,
    required this.userMessage,
    required this.debugMessage,
    this.stackTrace,
  });

  factory AppError.fromStatusCode(int statusCode, {String? debugMessage}) {
    switch (statusCode) {
      case 400:
        return AppError(
          type: ErrorType.validation,
          userMessage: 'The request was invalid. Please check your inputs.',
          debugMessage: debugMessage ?? 'Bad Request 400',
        );
      case 401:
        return AppError(
          type: ErrorType.unauthorized,
          userMessage: 'Session expired. Please sign in again.',
          debugMessage: debugMessage ?? 'Unauthorized 401',
        );
      case 403:
        return AppError(
          type: ErrorType.forbidden,
          userMessage: 'You do not have permission to access this resource.',
          debugMessage: debugMessage ?? 'Forbidden 403',
        );
      case 404:
        return AppError(
          type: ErrorType.notFound,
          userMessage: 'The requested item could not be found.',
          debugMessage: debugMessage ?? 'Not Found 404',
        );
      case 429:
        return AppError(
          type: ErrorType.rateLimited,
          userMessage: 'Too many requests. Please slow down and try again shortly.',
          debugMessage: debugMessage ?? 'Too Many Requests 429',
        );
      case 500:
      case 502:
      case 503:
        return AppError(
          type: ErrorType.serverError,
          userMessage: 'Our servers are experiencing issues. Please try again later.',
          debugMessage: debugMessage ?? 'Server Error $statusCode',
        );
      default:
        return AppError(
          type: ErrorType.unexpected,
          userMessage: 'An unexpected error occurred. Please try again.',
          debugMessage: debugMessage ?? 'Status $statusCode',
        );
    }
  }

  static String sanitizeUserMessage(dynamic error) {
    final str = error.toString().toLowerCase();
    if (str.contains('socketexception') || str.contains('connection refused')) {
      return 'Unable to connect to the server. Please check your internet connection.';
    }
    if (str.contains('timeoutexception')) {
      return 'The connection timed out. Please check your network and try again.';
    }
    return 'Something went wrong. Please try again.';
  }
}
