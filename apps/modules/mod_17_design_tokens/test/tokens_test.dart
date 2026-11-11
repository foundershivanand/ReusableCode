import 'package:test/test.dart';
import 'package:mod_17_design_tokens/mod_17_design_tokens.dart';

void main() {
  test('Spacing tokens maintain harmonic scale', () {
    expect(AppSpacing.xs, equals(4.0));
    expect(AppSpacing.sm, equals(8.0));
    expect(AppSpacing.md, equals(16.0));
    expect(AppSpacing.lg, equals(24.0));
    expect(AppSpacing.xl, equals(32.0));
    expect(AppSpacing.xxl, equals(48.0));
  });
}
