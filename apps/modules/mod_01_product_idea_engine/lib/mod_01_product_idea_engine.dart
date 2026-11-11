import 'package:meta/meta.dart';

enum MonetizationModel { free, freemium, subscription, oneTimePurchase, ads, hybrid }
enum TargetPlatform { android, ios, both }

enum AppStage {
  idea,
  marketResearch,
  problemValidation,
  competitorAnalysis,
  monetizationAnalysis,
  mvpDefinition,
  technicalFeasibility,
  uxDefinition,
  build,
  test,
  beta,
  storeSubmission,
  launch,
  aso,
  analytics,
  iteration,
}

@immutable
class ProductIdea {
  final String id;
  final String name;
  final String problem;
  final String solution;
  final String targetAudience;
  final MonetizationModel monetization;
  final TargetPlatform platform;
  final AppStage stage;
  final DateTime createdAt;

  const ProductIdea({
    required this.id,
    required this.name,
    required this.problem,
    required this.solution,
    required this.targetAudience,
    required this.monetization,
    required this.platform,
    this.stage = AppStage.idea,
    DateTime? createdAt,
  }) : createdAt = createdAt ?? const _DefaultDateTime();

  ProductIdea copyWith({
    String? name,
    String? problem,
    String? solution,
    String? targetAudience,
    MonetizationModel? monetization,
    TargetPlatform? platform,
    AppStage? stage,
  }) {
    return ProductIdea(
      id: id,
      name: name ?? this.name,
      problem: problem ?? this.problem,
      solution: solution ?? this.solution,
      targetAudience: targetAudience ?? this.targetAudience,
      monetization: monetization ?? this.monetization,
      platform: platform ?? this.platform,
      stage: stage ?? this.stage,
      createdAt: createdAt,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'problem': problem,
    'solution': solution,
    'targetAudience': targetAudience,
    'monetization': monetization.name,
    'platform': platform.name,
    'stage': stage.name,
    'createdAt': createdAt.toIso8601String(),
  };
}

class _DefaultDateTime implements DateTime {
  const _DefaultDateTime();
  @override dynamic noSuchMethod(Invocation invocation) => DateTime.now();
}

class IdeaScore {
  final double score;
  final bool isViable;
  final List<String> risks;
  final List<String> recommendations;

  const IdeaScore({
    required this.score,
    required this.isViable,
    required this.risks,
    required this.recommendations,
  });
}

class IdeaValidator {
  static const double viabilityThreshold = 70.0;

  static IdeaScore evaluate({
    required ProductIdea idea,
    required int marketDemandScore, // 1 to 10
    required int competitionScore,  // 1 (monopoly) to 10 (hyper-saturated)
    required int techFeasibilityScore, // 1 (near impossible) to 10 (straightforward)
    required int willingnessToPayScore, // 1 to 10
  }) {
    final risks = <String>[];
    final recommendations = <String>[];

    if (competitionScore > 8) {
      risks.add('Market is hyper-saturated. Requires clear 10x differentiator.');
    }
    if (willingnessToPayScore < 4 && idea.monetization == MonetizationModel.subscription) {
      risks.add('Low willingness to pay detected for subscription model.');
      recommendations.add('Consider freemium or ad-supported model.');
    }
    if (techFeasibilityScore < 5) {
      risks.add('High technical risk. Build proof-of-concept before committing.');
    }

    // Weighted formula: Demand 35%, Feasibility 25%, WTP 25%, Competition Inverse 15%
    final demandWeighted = (marketDemandScore / 10.0) * 35.0;
    final feasibilityWeighted = (techFeasibilityScore / 10.0) * 25.0;
    final wtpWeighted = (willingnessToPayScore / 10.0) * 25.0;
    final compWeighted = ((11 - competitionScore) / 10.0) * 15.0;

    final totalScore = demandWeighted + feasibilityWeighted + wtpWeighted + compWeighted;
    final isViable = totalScore >= viabilityThreshold && techFeasibilityScore >= 5;

    return IdeaScore(
      score: double.parse(totalScore.toStringAsFixed(1)),
      isViable: isViable,
      risks: List.unmodifiable(risks),
      recommendations: List.unmodifiable(recommendations),
    );
  }
}
