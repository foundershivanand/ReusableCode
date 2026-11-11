import 'package:test/test.dart';
import 'package:mod_37_onboarding_engine/mod_37_onboarding_engine.dart';

void main() {
  test('Cycles through steps and marks complete', () {
    final controller = OnboardingController(steps: [
      const OnboardingStep(id: '1', title: 'Step 1', description: 'Desc 1'),
      const OnboardingStep(id: '2', title: 'Step 2', description: 'Desc 2'),
    ]);

    expect(controller.currentIndex, equals(0));
    controller.next();
    expect(controller.currentIndex, equals(1));
    expect(controller.isCompleted, isFalse);
    controller.next();
    expect(controller.isCompleted, isTrue);
  });
}
