class TechStackPolicy {
  static const String minimumDartVersion = '3.0.0';
  static const String minimumFlutterVersion = '3.19.0';
  static const bool strictTypingRequired = true;
  static const bool noDirectHttpCallsInUI = true;
  static const bool zeroTrustBackendEnabled = true;

  static void verifyCompliance({
    required bool usesCleanArchitecture,
    required bool hasEncryptedStorage,
    required bool usesCertPinning,
  }) {
    if (!usesCleanArchitecture) {
      throw StateError('Violation: App must implement Clean Architecture presentation/domain/data separation.');
    }
    if (!hasEncryptedStorage) {
      throw StateError('Violation: Local storage must be hardware-backed or encrypted.');
    }
    if (!usesCertPinning) {
      throw StateError('Violation: API communication must implement SSL/TLS certificate pinning in production.');
    }
  }
}
