import '../auth_models.dart';

abstract class AuthProvider {
  AuthProviderType get type;
  Future<AuthResult> authenticate();
}

class AuthResult {
  final bool success;
  final AuthUser? user;
  final AuthTokenPair? tokens;
  final String? errorMessage;

  const AuthResult({
    required this.success,
    this.user,
    this.tokens,
    this.errorMessage,
  });

  factory AuthResult.success({required AuthUser user, required AuthTokenPair tokens}) =>
      AuthResult(success: true, user: user, tokens: tokens);

  factory AuthResult.failure(String message) =>
      AuthResult(success: false, errorMessage: message);
}
