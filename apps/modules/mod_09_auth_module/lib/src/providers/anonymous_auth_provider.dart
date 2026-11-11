import 'dart:math';
import '../auth_models.dart';
import 'auth_provider.dart';

class AnonymousAuthProvider {
  Future<AuthResult> signInAnonymously() async {
    final randId = Random.secure().nextInt(1000000);
    final user = AuthUser(
      id: 'anon_$randId',
      isAnonymous: true,
      linkedProviders: [AuthProviderType.anonymous],
      createdAt: DateTime.now(),
    );
    final tokens = AuthTokenPair(
      accessToken: 'acc_anon_$randId',
      refreshToken: 'ref_anon_$randId',
      accessTokenExpiresAt: DateTime.now().add(const Duration(days: 30)),
    );
    return AuthResult.success(user: user, tokens: tokens);
  }
}
