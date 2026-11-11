class DeepLinkRouter {
  final Map<String, Function(Map<String, String> params)> _routes = {};

  void registerRoute(String path, Function(Map<String, String> params) handler) {
    _routes[path] = handler;
  }

  bool handleUri(Uri uri) {
    final handler = _routes[uri.path];
    if (handler != null) {
      handler(uri.queryParameters);
      return true;
    }
    return false;
  }
}
