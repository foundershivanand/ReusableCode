import 'package:meta/meta.dart';

enum AuthStatus {
  unauthenticated,
  authenticating,
  authenticated,
  biometricLocked,
  mfaRequired,
  error
}

enum AuthProviderType {
  emailPassword,
  google,
  apple,
  phoneOtp,
  anonymous,
  customOAuth
}

@immutable
class AuthUser {
  final String id;
  final String? email;
  final String? phoneNumber;
  final String? displayName;
  final String? photoUrl;
  final bool isEmailVerified;
  final bool isAnonymous;
  final List<AuthProviderType> linkedProviders;
  final DateTime createdAt;

  const AuthUser({
    required this.id,
    this.email,
    this.phoneNumber,
    this.displayName,
    this.photoUrl,
    this.isEmailVerified = false,
    this.isAnonymous = false,
    this.linkedProviders = const [],
    required this.createdAt,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'email': email,
    'phoneNumber': phoneNumber,
    'displayName': displayName,
    'photoUrl': photoUrl,
    'isEmailVerified': isEmailVerified,
    'isAnonymous': isAnonymous,
    'linkedProviders': linkedProviders.map((p) => p.name).toList(),
    'createdAt': createdAt.toIso8601String(),
  };
}

@immutable
class AuthTokenPair {
  final String accessToken;
  final String refreshToken;
  final DateTime accessTokenExpiresAt;
  final String tokenType;

  const AuthTokenPair({
    required this.accessToken,
    required this.refreshToken,
    required this.accessTokenExpiresAt,
    this.tokenType = 'Bearer',
  });

  bool get isExpired => DateTime.now().isAfter(accessTokenExpiresAt);
  bool get willExpireSoon => DateTime.now().add(const Duration(minutes: 2)).isAfter(accessTokenExpiresAt);
}
