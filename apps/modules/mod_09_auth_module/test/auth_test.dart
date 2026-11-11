import 'package:test/test.dart';
import 'package:mod_09_auth_module/mod_09_auth_module.dart';

void main() {
  test('PKCE generates valid verifier and challenge', () {
    final verifier = PkceHelper.generateCodeVerifier(64);
    expect(verifier.isNotEmpty, isTrue);

    final challenge = PkceHelper.generateCodeChallenge(verifier);
    expect(challenge.isNotEmpty, isTrue);
    expect(challenge, isNot(equals(verifier)));
  });

  test('Secure token storage retains and clears tokens', () async {
    final storage = InMemorySecureTokenStorage();
    await storage.saveTokens(accessToken: 'access_123', refreshToken: 'refresh_456');

    expect(await storage.getAccessToken(), equals('access_123'));
    expect(await storage.getRefreshToken(), equals('refresh_456'));

    await storage.clearTokens();
    expect(await storage.getAccessToken(), isNull);
  });
}
