class TamperSignals {
  static const List<String> suspiciousFiles = [
    '/system/app/Superuser.apk',
    '/sbin/su',
    '/system/bin/su',
    '/Applications/Cydia.app',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',
  ];

  static bool hasSuspiciousFiles(List<String> existingPaths) {
    return existingPaths.any((path) => suspiciousFiles.contains(path));
  }
}
