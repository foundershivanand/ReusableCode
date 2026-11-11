import 'package:test/test.dart';
import 'package:mod_02_tech_stack_standard/mod_02_tech_stack_standard.dart';

void main() {
  test('Compliance check passes with all security standards', () {
    expect(() => TechStackPolicy.verifyCompliance(
      usesCleanArchitecture: true,
      hasEncryptedStorage: true,
      usesCertPinning: true,
    ), returnsNormally);
  });

  test('Compliance check throws when security standard missing', () {
    expect(() => TechStackPolicy.verifyCompliance(
      usesCleanArchitecture: true,
      hasEncryptedStorage: false,
      usesCertPinning: true,
    ), throwsA(isA<StateError>()));
  });
}
