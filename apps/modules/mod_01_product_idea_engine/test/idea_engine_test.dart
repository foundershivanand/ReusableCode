import 'package:test/test.dart';
import 'package:mod_01_product_idea_engine/mod_01_product_idea_engine.dart';

void main() {
  group('ProductIdeaEngine Tests', () {
    test('Validates high-scoring product idea', () {
      final idea = ProductIdea(
        id: 'app-001',
        name: 'PulseZen',
        problem: 'Burnout in engineers',
        solution: 'Micro-break biometric timer',
        targetAudience: 'Software Engineers',
        monetization: MonetizationModel.subscription,
        platform: TargetPlatform.both,
      );

      final score = IdeaValidator.evaluate(
        idea: idea,
        marketDemandScore: 9,
        competitionScore: 4,
        techFeasibilityScore: 9,
        willingnessToPayScore: 8,
      );

      expect(score.isViable, isTrue);
      expect(score.score, greaterThanOrEqualTo(70.0));
      expect(score.risks, isEmpty);
    });

    test('Rejects low feasibility idea', () {
      final idea = ProductIdea(
        id: 'app-002',
        name: 'MindReader',
        problem: 'Cannot read minds',
        solution: 'Direct brain-wave decoding via phone camera',
        targetAudience: 'Everyone',
        monetization: MonetizationModel.oneTimePurchase,
        platform: TargetPlatform.both,
      );

      final score = IdeaValidator.evaluate(
        idea: idea,
        marketDemandScore: 10,
        competitionScore: 1,
        techFeasibilityScore: 2,
        willingnessToPayScore: 10,
      );

      expect(score.isViable, isFalse);
      expect(score.risks, contains(contains('High technical risk')));
    });
  });
}
