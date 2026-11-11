import 'package:test/test.dart';
import 'package:mod_04_core_architecture/mod_04_core_architecture.dart';

class GetUserUseCase implements UseCase<String, String> {
  @override
  Future<Result<String, Failure>> call(String userId) async {
    if (userId.isEmpty) {
      return const ErrorResult(ValidationFailure('User ID cannot be empty'));
    }
    return Success('User: $userId');
  }
}

void main() {
  test('Result fold executes correct branch', () async {
    final useCase = GetUserUseCase();
    final res1 = await useCase('123');
    expect(res1.isSuccess, isTrue);
    expect(res1.dataOrNull, equals('User: 123'));

    final res2 = await useCase('');
    expect(res2.isFailure, isTrue);
    expect(res2.failureOrNull?.message, contains('cannot be empty'));
  });
}
