# Module 01: Product Idea Engine

The **Product Idea Engine** ensures that every app built in the factory undergoes strict market validation, scoring, and lifecycle tracking before writing any code.

## Key Features
- **Strict Validation Rubric**: Evaluates market demand, competition density, willingness to pay, and technical feasibility.
- **Finite State Machine**: Tracks app stages from `idea` -> `market_research` -> `mvp_definition` -> `launch` -> `scale`.
- **Zero Hallucination Scorecard**: Computes composite viability scores (0-100) with pass/fail gates.

## Usage
```dart
final idea = ProductIdea(
  id: 'app-001',
  name: 'FocusPulse',
  problem: 'Knowledge workers suffer from distraction without physical feedback',
  solution: 'Haptic-driven Pomodoro timer with biometric stress detection',
  targetAudience: 'Remote workers, software developers',
  monetization: MonetizationModel.subscription,
  platform: TargetPlatform.both,
);

final score = IdeaValidator.evaluate(idea, marketDemand: 8, competition: 5, techFeasibility: 9);
if (score.isViable) {
  ideaStateMachine.transition(idea.id, AppStage.mvpDefinition);
}
```
