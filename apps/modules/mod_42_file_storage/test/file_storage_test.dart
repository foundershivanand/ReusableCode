import 'package:test/test.dart';
import 'package:mod_42_file_storage/mod_42_file_storage.dart';

void main() {
  test('Validates file within allowed size and MIME constraints', () {
    const policy = FileUploadPolicy(maxSizeBytes: 5 * 1024 * 1024);
    expect(policy.validate(1024 * 1024, 'image/jpeg'), isTrue);
    expect(policy.validate(6 * 1024 * 1024, 'image/jpeg'), isFalse);
    expect(policy.validate(1024, 'application/x-msdownload'), isFalse);
  });
}
