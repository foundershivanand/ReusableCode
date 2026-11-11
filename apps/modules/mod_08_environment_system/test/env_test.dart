import 'package:test/test.dart';
import 'package:mod_08_environment_system/mod_08_environment_system.dart';

void main() {
  test('Parses dotenv content correctly', () {
    const raw = '''
    # Configuration
    API_URL=https://api.example.com
    TIMEOUT_SEC=30
    ENABLE_FEATURE=true
    QUOTED_VAL="secret_value"
    ''';

    final env = EnvManager.parseDotEnv(raw);
    expect(env.get('API_URL'), equals('https://api.example.com'));
    expect(env.getInt('TIMEOUT_SEC'), equals(30));
    expect(env.getBool('ENABLE_FEATURE'), isTrue);
    expect(env.get('QUOTED_VAL'), equals('secret_value'));
  });

  test('Throws on missing key without default', () {
    final env = EnvManager({});
    expect(() => env.get('NON_EXISTENT'), throwsA(isA<StateError>()));
  });
}
