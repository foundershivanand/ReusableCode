class FeatureFlagManager {
  final Map<String, bool> _flags = {};

  void updateFlags(Map<String, bool> flags) {
    _flags.addAll(flags);
  }

  bool isEnabled(String flagKey, {bool defaultValue = false}) {
    return _flags[flagKey] ?? defaultValue;
  }
}
