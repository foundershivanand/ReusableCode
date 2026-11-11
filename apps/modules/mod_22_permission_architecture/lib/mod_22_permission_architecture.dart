enum AppPermissionStatus { granted, denied, permanentlyDenied, restricted }

abstract class PermissionService {
  Future<AppPermissionStatus> checkPermission(String permissionType);
  Future<AppPermissionStatus> requestPermission(String permissionType);
}

class MockPermissionService implements PermissionService {
  final Map<String, AppPermissionStatus> _status = {};

  @override
  Future<AppPermissionStatus> checkPermission(String permissionType) async {
    return _status[permissionType] ?? AppPermissionStatus.denied;
  }

  @override
  Future<AppPermissionStatus> requestPermission(String permissionType) async {
    _status[permissionType] = AppPermissionStatus.granted;
    return AppPermissionStatus.granted;
  }
}
