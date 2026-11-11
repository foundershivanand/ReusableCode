import 'package:test/test.dart';
import 'package:mod_22_permission_architecture/mod_22_permission_architecture.dart';

class MockPermissionGateway implements PermissionGateway {
  PermissionStatus status = PermissionStatus.denied;

  @override
  Future<PermissionStatus> checkStatus(AppPermission permission) async => status;

  @override
  Future<PermissionStatus> request(AppPermission permission) async {
    status = PermissionStatus.granted;
    return status;
  }

  @override
  Future<bool> openAppSettings() async => true;
}

void main() {
  test('Requests permission after user accepts rationale', () async {
    final gateway = MockPermissionGateway();
    final manager = ContextualPermissionManager(gateway);

    final res = await manager.requestWithRationale(
      permission: AppPermission.camera,
      showRationaleDialog: () async => true,
    );

    expect(res.isGranted, isTrue);
    expect(res.showedRationale, isTrue);
  });
}
