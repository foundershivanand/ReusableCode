abstract class BiometricHardwareBridge {
  Future<bool> canAuthenticateWithBiometrics();
  Future<bool> authenticateWithBiometrics({required String localizedReason});
}

class MockBiometricBridge implements BiometricHardwareBridge {
  bool isSupported = true;
  bool shouldSucceed = true;

  @override
  Future<bool> canAuthenticateWithBiometrics() async => isSupported;

  @override
  Future<bool> authenticateWithBiometrics({required String localizedReason}) async => shouldSucceed;
}

class BiometricAuthProvider {
  final BiometricHardwareBridge bridge;

  BiometricAuthProvider({required this.bridge});

  Future<bool> unlockWithBiometrics({String reason = 'Scan fingerprint or face to authenticate'}) async {
    final canAuth = await bridge.canAuthenticateWithBiometrics();
    if (!canAuth) return false;
    return bridge.authenticateWithBiometrics(localizedReason: reason);
  }
}
