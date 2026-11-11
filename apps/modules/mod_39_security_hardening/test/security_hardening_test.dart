import 'package:test/test.dart';
import 'package:mod_39_security_hardening/mod_39_security_hardening.dart';

void main() {
  test('DeviceIntegrityReport detects compromised environment', () {
    const reportClean = DeviceIntegrityReport(
      isJailbrokenOrRooted: false,
      isEmulator: false,
      isDebuggerAttached: false,
    );
    expect(reportClean.isCompromised, isFalse);

    const reportRooted = DeviceIntegrityReport(
      isJailbrokenOrRooted: true,
      isEmulator: false,
      isDebuggerAttached: false,
    );
    expect(reportRooted.isCompromised, isTrue);
  });
}
