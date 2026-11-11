import 'dart:convert';
import 'package:crypto/crypto.dart';

class PurchaseSecurityVerifier {
  static bool verifyWebhookSignature({
    required String payload,
    required String signatureHeader,
    required String webhookSecret,
  }) {
    final key = utf8.encode(webhookSecret);
    final bytes = utf8.encode(payload);
    final hmacSha256 = Hmac(sha256, key);
    final digest = hmacSha256.convert(bytes);
    final expectedSignature = digest.toString();

    return expectedSignature == signatureHeader;
  }
}
