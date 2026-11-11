class EnvManager {
  final Map<String, String> _values;

  EnvManager(Map<String, String> values) : _values = Map.unmodifiable(values);

  String get(String key, {String? defaultValue}) {
    final val = _values[key] ?? defaultValue;
    if (val == null) {
      throw StateError('Missing required environment variable: $key');
    }
    return val;
  }

  int getInt(String key, {int? defaultValue}) {
    final val = _values[key];
    if (val == null) {
      if (defaultValue != null) return defaultValue;
      throw StateError('Missing required integer environment variable: $key');
    }
    return int.parse(val);
  }

  bool getBool(String key, {bool defaultValue = false}) {
    final val = _values[key]?.toLowerCase();
    if (val == null) return defaultValue;
    return val == 'true' || val == '1';
  }

  static EnvManager parseDotEnv(String content) {
    final map = <String, String>{};
    final lines = content.split('
');
    for (final line in lines) {
      final trimmed = line.trim();
      if (trimmed.isEmpty || trimmed.startsWith('#')) continue;
      final eqIndex = trimmed.indexOf('=');
      if (eqIndex != -1) {
        final key = trimmed.substring(0, eqIndex).trim();
        var value = trimmed.substring(eqIndex + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        map[key] = value;
      }
    }
    return EnvManager(map);
  }
}
