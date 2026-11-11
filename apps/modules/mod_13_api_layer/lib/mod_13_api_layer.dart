library mod_13_api_layer;

import 'dart:async';
import 'dart:convert';
import 'dart:math';

class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;
  final int statusCode;

  const ApiResponse({
    required this.success,
    this.data,
    this.error,
    required this.statusCode,
  });

  factory ApiResponse.success(T data, [int statusCode = 200]) =>
      ApiResponse(success: true, data: data, statusCode: statusCode);

  factory ApiResponse.failure(String message, {int statusCode = 500, String? code, String? details}) =>
      ApiResponse(
        success: false,
        statusCode: statusCode,
        error: ApiError(message: message, code: code, details: details),
      );
}

class ApiError {
  final String message;
  final String? code;
  final String? details;

  const ApiError({required this.message, this.code, this.details});
}

class RetryPolicy {
  final int maxRetries;
  final Duration initialDelay;
  final Duration maxDelay;
  final double backoffMultiplier;

  const RetryPolicy({
    this.maxRetries = 3,
    this.initialDelay = const Duration(milliseconds: 500),
    this.maxDelay = const Duration(seconds: 5),
    this.backoffMultiplier = 2.0,
  });

  Duration getDelayForAttempt(int attempt) {
    final exponentialMs = initialDelay.inMilliseconds * pow(backoffMultiplier, attempt);
    final clampedMs = min(exponentialMs.toInt(), maxDelay.inMilliseconds);
    // Add jitter (up to 25% of clamped delay)
    final jitterMs = Random().nextInt((clampedMs * 0.25).toInt() + 1);
    return Duration(milliseconds: clampedMs + jitterMs);
  }
}

abstract class CertificatePinningValidator {
  bool validateCertificate(String host, String certSha256Fingerprint);
}

class StaticCertificatePinningValidator implements CertificatePinningValidator {
  final Map<String, Set<String>> pinnedFingerprints;

  StaticCertificatePinningValidator({required this.pinnedFingerprints});

  @override
  bool validateCertificate(String host, String certSha256Fingerprint) {
    final allowed = pinnedFingerprints[host];
    if (allowed == null || allowed.isEmpty) return false;
    return allowed.contains(certSha256Fingerprint);
  }
}
