import '../pkce_helper.dart';
import 'auth_provider.dart';

class OAuthPkceProvider {
  final String authorizationEndpoint;
  final String tokenEndpoint;
  final String clientId;
  final List<String> scopes;

  OAuthPkceProvider({
    required this.authorizationEndpoint,
    required this.tokenEndpoint,
    required this.clientId,
    this.scopes = const ['openid', 'profile', 'email'],
  });

  PkceChallenge createChallenge() => PkceChallenge.generate();

  Uri buildAuthorizationUri({required PkceChallenge challenge, required String redirectUri}) {
    return Uri.parse(authorizationEndpoint).replace(queryParameters: {
      'response_type': 'code',
      'client_id': clientId,
      'redirect_uri': redirectUri,
      'scope': scopes.join(' '),
      'code_challenge': challenge.codeChallenge,
      'code_challenge_method': 'S256',
      'state': challenge.state,
    });
  }
}
