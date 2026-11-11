import 'dart:async';
import 'auth_models.dart';
import 'token_storage.dart';
import 'token_refresh_coordinator.dart';

class AuthController {
  final SecureTokenStorage storage;
  final TokenRefreshCoordinator refreshCoordinator;
  
  AuthStatus _status = AuthStatus.unauthenticated;
  AuthUser? _currentUser;
  final StreamController<AuthStatus> _statusStream = StreamController<AuthStatus>.broadcast();

  AuthController({
    required this.storage,
    required this.refreshCoordinator,
  });

  AuthStatus get status => _status;
  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  Stream<AuthStatus> get statusStream => _statusStream.stream;

  Future<void> initialize() async {
    final tokens = await storage.getTokens();
    if (tokens != null && !tokens.isExpired) {
      _status = AuthStatus.authenticated;
    } else {
      _status = AuthStatus.unauthenticated;
    }
    _statusStream.add(_status);
  }

  Future<void> setAuthenticated({required AuthUser user, required AuthTokenPair tokens}) async {
    await storage.saveTokens(tokens);
    _currentUser = user;
    _status = AuthStatus.authenticated;
    _statusStream.add(_status);
  }

  Future<void> signOut() async {
    await storage.clearTokens();
    _currentUser = null;
    _status = AuthStatus.unauthenticated;
    _statusStream.add(_status);
  }

  void dispose() {
    _statusStream.close();
  }
}
