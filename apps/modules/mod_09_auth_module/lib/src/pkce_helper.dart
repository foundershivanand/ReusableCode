import 'dart:convert';
import 'dart:math';
import 'package:crypto/crypto.dart';

class PkceChallenge {
  final String codeVerifier;
  final String codeChallenge;
  final String state;

  const PkceChallenge({
    required this.codeVerifier,
    required this.codeChallenge,
    required this.state,
  });

  static PkceChallenge generate([int verifierLength = 64]) {
    final random = Random.secure();
    final verifierBytes = List<int>.generate(verifierLength, (_) => random.nextInt(256));
    final verifier = base64UrlEncode(verifierBytes).replaceAll('=', '');

    final challengeBytes = sha256.convert(utf8.encode(verifier)).bytes;
    final challenge = base64UrlEncode(challengeBytes).replaceAll('=', '');

    final stateBytes = List<int>.generate(32, (_) => random.nextInt(256));
    final state = base64UrlEncode(stateBytes).replaceAll('=', '');

    return PkceChallenge(
      codeVerifier: verifier,
      codeChallenge: challenge,
      state: state,
    );
  }
}
