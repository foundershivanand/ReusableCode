import 'package:test/test.dart';
import 'package:mod_10_authorization_system/mod_10_authorization_system.dart';

void main() {
  test('Free user cannot access AI features without upgrade', () {
    expect(
      AuthorizationEngine.hasPermission(
        role: UserRole.freeUser,
        permission: Permission.accessAiFeatures,
      ),
      isFalse,
    );
  });

  test('Premium subscriber can access AI and export features', () {
    expect(
      AuthorizationEngine.hasPermission(
        role: UserRole.premiumSubscriber,
        permission: Permission.accessAiFeatures,
      ),
      isTrue,
    );
    expect(
      AuthorizationEngine.hasPermission(
        role: UserRole.premiumSubscriber,
        permission: Permission.exportData,
      ),
      isTrue,
    );
  });

  test('Enforce permission throws on unauthorized action', () {
    expect(
      () => AuthorizationEngine.enforcePermission(
        role: UserRole.guest,
        permission: Permission.createContent,
      ),
      throwsA(isA<StateError>()),
    );
  });
}
