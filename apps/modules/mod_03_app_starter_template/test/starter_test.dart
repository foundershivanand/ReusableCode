import 'package:flutter_test/flutter_test.dart';
import 'package:mod_03_app_starter_template/mod_03_app_starter_template.dart';

abstract class AuthService {
  bool get isAuthenticated;
}

class MockAuthService implements AuthService {
  @override
  bool get isAuthenticated => true;
}

void main() {
  test('Service Locator registers and resolves singletons', () {
    final locator = AppServiceLocator.instance;
    locator.registerSingleton<AuthService>(MockAuthService());

    final auth = locator.resolve<AuthService>();
    expect(auth.isAuthenticated, isTrue);
  });
}
