import '../auth_models.dart';
import '../password_validator.dart';
import 'auth_provider.dart';

class EmailAuthProvider {
  final Future<AuthResult> Function(String email, String password) onSignIn;
  final Future<AuthResult> Function(String email, String password) onSignUp;

  EmailAuthProvider({required this.onSignIn, required this.onSignUp});

  Future<AuthResult> signIn(String email, String password) async {
    if (email.trim().isEmpty || password.isEmpty) {
      return AuthResult.failure('Email and password cannot be empty');
    }
    return onSignIn(email.trim(), password);
  }

  Future<AuthResult> signUp(String email, String password) async {
    final validation = PasswordValidator.validate(password);
    if (!validation.isValid) {
      return AuthResult.failure(validation.errors.first);
    }
    return onSignUp(email.trim(), password);
  }
}
