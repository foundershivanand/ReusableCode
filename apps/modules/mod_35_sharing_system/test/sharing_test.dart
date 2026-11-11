import 'package:test/test.dart';
import 'package:mod_35_sharing_system/mod_35_sharing_system.dart';

void main() {
  test('Formats share message with URL', () {
    const content = ShareContent(text: 'Check out this app!', url: 'https://app.link/123');
    expect(content.formattedMessage, equals('Check out this app!

https://app.link/123'));
  });
}
