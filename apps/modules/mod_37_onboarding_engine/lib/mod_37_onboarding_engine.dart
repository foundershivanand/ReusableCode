class OnboardingStep {
  final String title;
  final String description;
  final String assetPath;

  OnboardingStep({required this.title, required this.description, required this.assetPath});
}

class OnboardingController {
  final List<OnboardingStep> steps;
  int currentIndex = 0;

  OnboardingController({required this.steps});

  bool get isLastStep => currentIndex == steps.length - 1;
  void next() {
    if (!isLastStep) currentIndex++;
  }
}
