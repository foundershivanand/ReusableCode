import 'package:test/test.dart';
import 'package:mod_09_auth_module/mod_09_auth_module.dart';

void main() {
  group('Comprehensive Auth Suite Tests', () {
    test('PasswordValidator enforces 12 chars, uppercase, lowercase, numbers, symbols', () {
      final weak = PasswordValidator.validate('weak');
      expect(weak.isValid, isFalse);
      expect(weak.errors.length, greaterThanOrEqualTo(3));

      final strong = PasswordValidator.validate('StrongPass#2026!Secure');
      expect(strong.isValid, isTrue);
      expect(strong.errors, isEmpty);
      expect(strong.score, equals(4));
    });

    test('PKCE generates RFC 7636 compliant code challenge and verifier', () {
      final challenge = PkceChallenge.generate();
      expect(challenge.codeVerifier.length, greaterThanOrEqualTo(43));
      expect(challenge.codeChallenge.length, greaterThanOrEqualTo(43));
      expect(challenge.state.length, greaterThanOrEqualTo(32));
    });

    test('Single-Flight TokenRefreshCoordinator prevents duplicate concurrent refresh calls', () async {
      final storage = InMemoryTokenStorage();
      await storage.saveTokens(AuthTokenPair(
        accessToken: 'expired_acc',
        refreshToken: 'valid_refresh',
        accessTokenExpiresAt: DateTime.now().subtract(const Duration(minutes: 5)),
      ));

      int refreshCallCount = 0;
      final coordinator = TokenRefreshCoordinator(
        storage: storage,
        refreshFunction: (rt) async {
          refreshCallCount++;
          await Future.delayed(const Duration(milliseconds: 50));
          return AuthTokenPair(
            accessToken: 'refreshed_acc_$refreshCallCount',
            refreshToken: 'new_refresh',
            accessTokenExpiresAt: DateTime.now().add(const Duration(hours: 1)),
          );
        },
      );

      // Simulate 10 concurrent requests encountering 401
      final results = await Future.wait(List.generate(10, (_) => coordinator.getValidAccessToken()));

      expect(refreshCallCount, equals(1)); // Only 1 refresh executed!
      expect(results.every((token) => token == 'refreshed_acc_1'), isTrue);
    });

    test('PhoneOtpProvider validates E.164 phone format and 6-digit OTP', () async {
      expect(PhoneOtpProvider.isValidE164('+14155552671'), isTrue);
      expect(PhoneOtpProvider.isValidE164('14155552671'), isFalse);
      expect(PhoneOtpProvider.isValidE164('invalid'), isFalse);

      final provider = PhoneOtpProvider();
      final res = await provider.verifyOtp(phoneNumber: '+14155552671', otpCode: '123456');
      expect(res.success, isTrue);
      expect(res.user?.phoneNumber, equals('+14155552671'));
    });

    test('BiometricAuthProvider unlocks when hardware succeeds', () async {
      final bridge = MockBiometricBridge();
      final provider = BiometricAuthProvider(bridge: bridge);

      expect(await provider.unlockWithBiometrics(), isTrue);

      bridge.shouldSucceed = false;
      expect(await provider.unlockWithBiometrics(), isFalse);
    });
  });
}
