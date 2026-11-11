import 'package:test/test.dart';
import 'package:mod_11_local_data_system/mod_11_local_data_system.dart';

void main() {
  test('InMemoryEncryptedStore stores and retrieves values', () async {
    final store = InMemoryEncryptedStore();
    await store.setString('user_token', 'enc_secret_abc');
    await store.setBool('is_onboarded', true);

    expect(await store.getString('user_token'), equals('enc_secret_abc'));
    expect(await store.getBool('is_onboarded'), isTrue);

    await store.delete('user_token');
    expect(await store.getString('user_token'), isNull);
  });
}
