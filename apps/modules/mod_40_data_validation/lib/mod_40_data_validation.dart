class InputValidators {
  static final RegExp _emailRegExp = RegExp(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$");

  static bool isValidEmail(String email) => _emailRegExp.hasMatch(email);

  static bool isValidPassword(String password) => password.length >= 12;
}
