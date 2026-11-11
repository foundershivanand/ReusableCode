import 'dart:async';
import 'auth_models.dart';
import 'token_storage.dart';

typedef TokenRefreshFunction = Future<AuthTokenPair> Function(String refreshToken);

class TokenRefreshCoordinator {
  final SecureTokenStorage storage;
  final TokenRefreshFunction refreshFunction;
  
  Completer<AuthTokenPair>? _inFlightRefresh;

  TokenRefreshCoordinator({
    required this.storage,
    required this.refreshFunction,
  });

  Future<String> getValidAccessToken() async {
    final tokens = await storage.getTokens();
    if (tokens == null) {
      throw StateError('No authentication tokens found. User is unauthenticated.');
    }

    if (!tokens.willExpireSoon) {
      return tokens.accessToken;
    }

    // Mutex / Single-Flight Lock: If a refresh is already in progress, wait for it
    if (_inFlightRefresh != null) {
      final refreshed = await _inFlightRefresh!.future;
      return refreshed.accessToken;
    }

    _inFlightRefresh = Completer<AuthTokenPair>();
    try {
      final newTokens = await refreshFunction(tokens.refreshToken);
      await storage.saveTokens(newTokens);
      _inFlightRefresh!.complete(newTokens);
      return newTokens.accessToken;
    } catch (e, stack) {
      _inFlightRefresh!.completeError(e, stack);
      await storage.clearTokens();
      rethrow;
    } finally {
      _inFlightRefresh = null;
    }
  }
}
