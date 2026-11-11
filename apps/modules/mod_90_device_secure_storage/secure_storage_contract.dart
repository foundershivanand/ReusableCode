abstract class HardwareSecureVault {
  Future<void> writeSecure({required String key, required String value});
  Future<String?> readSecure({required String key});
  Future<void> deleteSecure({required String key});
}
