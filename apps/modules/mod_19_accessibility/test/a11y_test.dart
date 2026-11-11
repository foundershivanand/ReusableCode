import 'package:test/test.dart';
import 'package:mod_19_accessibility/mod_19_accessibility.dart';

void main() {
  test('Validates black and white contrast exceeds 7.0 for AAA', () {
    final blackLum = A11yStandards.calculateLuminance(0, 0, 0);
    final whiteLum = A11yStandards.calculateLuminance(255, 255, 255);
    final ratio = A11yStandards.contrastRatio(blackLum, whiteLum);

    expect(ratio, greaterThanOrEqualTo(20.0));
    expect(A11yStandards.isWcagAAANormalText(ratio), isTrue);
  });
}
