import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../auth_models.dart';
import 'auth_provider.dart';

class AppleAuthProvider {
  static String generateNonce([int length = 32]) {
    final challenge = PkceChallenge.generate(length);
    return challenge.codeVerifier;
  }

  static String sha256Nonce(String rawNonce) {
    return sha256.convert(utf8.encode(rawNonce)).toString();
  }

  Future<AuthResult> signInWithApple({
    required String identityToken,
    required String rawNonce,
    String? givenName,
    String? familyName,
  }) async {
    if (identityToken.isEmpty) {
      return AuthResult.failure('Apple Identity Token cannot be empty');
    }
    final user = AuthUser(
      id: 'apple_user_456',
      displayName: givenName != null ? '$givenName $familyName'.trim() : 'Apple User',
      isEmailVerified: true,
      linkedProviders: [AuthProviderType.apple],
      createdAt: DateTime.now(),
    );
    final tokens = AuthTokenPair(
      accessToken: 'acc_apple_456',
      refreshToken: 'ref_apple_456',
      accessTokenExpiresAt: DateTime.now().add(const Duration(hours: 1)),
    );
    return AuthResult.success(user: user, tokens: tokens);
  }
}
