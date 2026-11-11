import 'dart:convert';
import 'package:crypto/crypto.dart';
import 'package:test/test.dart';
import 'package:mod_30_purchase_security/mod_30_purchase_security.dart';

void main() {
  test('Verifies valid HMAC webhook signature', () {
    const secret = 'webhook_secret_key_123';
    const payload = '{"event": "purchase_success", "user_id": "u456"}';

    final hmac = Hmac(sha256, utf8.encode(secret));
    final expectedSig = hmac.convert(utf8.encode(payload)).toString();

    final isValid = PurchaseSecurityVerifier.verifyWebhookSignature(
      payload: payload,
      signatureHeader: expectedSig,
      webhookSecret: secret,
    );

    expect(isValid, isTrue);
  });

  test('Rejects invalid signature', () {
    final isValid = PurchaseSecurityVerifier.verifyWebhookSignature(
      payload: '{"test": true}',
      signatureHeader: 'tampered_signature',
      webhookSecret: 'secret',
    );
    expect(isValid, isFalse);
  });
}
