abstract class SecureStorageContract {
  Future<void> writeSecure(String key, String value);
  Future<String?> readSecure(String key);
  Future<void> deleteSecure(String key);
  Future<void> wipeAll();
}

class MockHardwareSecureEnclave implements SecureStorageContract {
  final Map<String, String> _storage = {};

  @override
  Future<void> writeSecure(String key, String value) async {
    _storage[key] = value;
  }

  @override
  Future<String?> readSecure(String key) async {
    return _storage[key];
  }

  @override
  Future<void> deleteSecure(String key) async {
    _storage.remove(key);
  }

  @override
  Future<void> wipeAll() async {
    _storage.clear();
  }
}
