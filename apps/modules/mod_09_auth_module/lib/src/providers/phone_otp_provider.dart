import '../auth_models.dart';
import 'auth_provider.dart';

class PhoneOtpProvider {
  static bool isValidE164(String phone) {
    return RegExp(r'^\+[1-9]\d{1,14}$').hasMatch(phone.trim());
  }

  Future<bool> sendOtp(String phoneNumber) async {
    if (!isValidE164(phoneNumber)) {
      throw ArgumentError('Invalid phone number. Must be in E.164 format (e.g. +1234567890)');
    }
    return true;
  }

  Future<AuthResult> verifyOtp({required String phoneNumber, required String otpCode}) async {
    if (otpCode.length != 6 || !RegExp(r'^\d{6}$').hasMatch(otpCode)) {
      return AuthResult.failure('OTP code must be exactly 6 digits');
    }
    final user = AuthUser(
      id: 'phone_user_789',
      phoneNumber: phoneNumber,
      isEmailVerified: false,
      linkedProviders: [AuthProviderType.phoneOtp],
      createdAt: DateTime.now(),
    );
    final tokens = AuthTokenPair(
      accessToken: 'acc_phone_789',
      refreshToken: 'ref_phone_789',
      accessTokenExpiresAt: DateTime.now().add(const Duration(hours: 1)),
    );
    return AuthResult.success(user: user, tokens: tokens);
  }
}
