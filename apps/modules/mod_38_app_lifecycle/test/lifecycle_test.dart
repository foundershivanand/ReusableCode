import 'package:test/test.dart';
import 'package:mod_38_app_lifecycle/mod_38_app_lifecycle.dart';

void main() {
  test('Executes suspend hooks when paused', () async {
    final guardian = LifecycleGuardian();
    bool hookRan = false;
    guardian.addSuspendHook(() async => hookRan = true);

    await guardian.handleStateChange(AppExecutionState.paused);
    expect(hookRan, isTrue);
    expect(guardian.currentState, equals(AppExecutionState.paused));
  });
}
