import 'package:test/test.dart';
import 'package:mod_15_state_management/mod_15_state_management.dart';

void main() {
  test('UiState executes correct branch on when', () {
    const UiState<List<String>> state = UiSuccess(['Item 1', 'Item 2']);

    final result = state.when(
      initial: () => 'initial',
      loading: () => 'loading',
      success: (data) => 'success with ${data.length} items',
      empty: () => 'empty',
      error: (msg) => 'error: $msg',
    );

    expect(result, equals('success with 2 items'));
  });
}
