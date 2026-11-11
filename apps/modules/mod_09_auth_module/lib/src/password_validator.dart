class PasswordValidationResult {
  final bool isValid;
  final List<String> errors;
  final int score; // 0 to 4 (entropy score)

  const PasswordValidationResult({
    required this.isValid,
    required this.errors,
    required this.score,
  });
}

class PasswordValidator {
  static PasswordValidationResult validate(String password) {
    final errors = <String>[];
    int score = 0;

    if (password.length < 12) {
      errors.add('Password must be at least 12 characters long');
    } else {
      score++;
    }

    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      errors.add('Password must contain at least one uppercase letter');
    } else {
      score++;
    }

    if (!RegExp(r'[a-z]').hasMatch(password)) {
      errors.add('Password must contain at least one lowercase letter');
    } else {
      score++;
    }

    if (!RegExp(r'[0-9]').hasMatch(password)) {
      errors.add('Password must contain at least one digit');
    }

    if (!RegExp(r'[!@#$%^&*(),.?":{}|<>]').hasMatch(password)) {
      errors.add('Password must contain at least one special character');
    } else {
      score++;
    }

    return PasswordValidationResult(
      isValid: errors.isEmpty,
      errors: List.unmodifiable(errors),
      score: score,
    );
  }
}
