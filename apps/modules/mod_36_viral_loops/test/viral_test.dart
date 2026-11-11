import 'package:test/test.dart';
import 'package:mod_36_viral_loops/mod_36_viral_loops.dart';

void main() {
  test('Generates and validates 8-char referral code', () {
    final code = ReferralEngine.generateReferralCode('user_99');
    expect(code.length, equals(8));
    expect(ReferralEngine.validateReferralCode(code), isTrue);
  });
}
