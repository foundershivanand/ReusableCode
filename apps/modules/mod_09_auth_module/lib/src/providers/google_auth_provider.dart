import '../auth_models.dart';
import 'auth_provider.dart';

class GoogleAuthProvider {
  final String clientId;
  final String? serverClientId;

  GoogleAuthProvider({required this.clientId, this.serverClientId});

  Future<AuthResult> signInWithIdToken({required String idToken, String? rawNonce}) async {
    if (idToken.isEmpty) {
      return AuthResult.failure('Google ID token cannot be empty');
    }
    // In production, token is sent to backend for cryptographic verification
    final user = AuthUser(
      id: 'google_user_123',
      email: 'user@gmail.com',
      displayName: 'Google User',
      isEmailVerified: true,
      linkedProviders: [AuthProviderType.google],
      createdAt: DateTime.now(),
    );
    final tokens = AuthTokenPair(
      accessToken: 'acc_goog_123',
      refreshToken: 'ref_goog_123',
      accessTokenExpiresAt: DateTime.now().add(const Duration(hours: 1)),
    );
    return AuthResult.success(user: user, tokens: tokens);
  }
}
