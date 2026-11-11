class RemoteConfigService {
  final Map<String, dynamic> _config = {};

  void setDefaults(Map<String, dynamic> defaults) {
    _config.addAll(defaults);
  }

  String getString(String key, {String defaultValue = ""}) {
    return _config[key] as String? ?? defaultValue;
  }

  bool getBool(String key, {bool defaultValue = false}) {
    return _config[key] as bool? ?? defaultValue;
  }
}
