abstract class SecureTokenStorage {
  Future<void> saveTokens(AuthTokenPair tokens);
  Future<AuthTokenPair?> getTokens();
  Future<void> clearTokens();
}

class InMemoryTokenStorage implements SecureTokenStorage {
  AuthTokenPair? _tokens;

  @override
  Future<void> saveTokens(AuthTokenPair tokens) async {
    _tokens = tokens;
  }

  @override
  Future<AuthTokenPair?> getTokens() async => _tokens;

  @override
  Future<void> clearTokens() async {
    _tokens = null;
  }
}
