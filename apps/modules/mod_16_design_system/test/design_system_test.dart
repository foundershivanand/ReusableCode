import 'package:flutter_test/flutter_test.dart';
import 'package:mod_16_design_system/mod_16_design_system.dart';

void main() {
  test('AppButtonProps retains configuration', () {
    final props = AppButtonProps(
      label: 'Submit',
      onPressed: () {},
      variant: ButtonVariant.primary,
      isLoading: false,
    );
    expect(props.label, equals('Submit'));
    expect(props.variant, equals(ButtonVariant.primary));
    expect(props.isLoading, isFalse);
  });
}
