abstract class Failure {
  final String message;
  final String? code;
  final dynamic cause;

  const Failure(this.message, {this.code, this.cause});

  @override
  String toString() => 'Failure(code: $code, message: $message)';
}

class ServerFailure extends Failure {
  const ServerFailure(super.message, {super.code, super.cause});
}

class CacheFailure extends Failure {
  const CacheFailure(super.message, {super.code, super.cause});
}

class ValidationFailure extends Failure {
  const ValidationFailure(super.message, {super.code});
}

class AuthFailure extends Failure {
  const AuthFailure(super.message, {super.code});
}

abstract class Result<S, F extends Failure> {
  const Result();

  bool get isSuccess => this is Success<S, F>;
  bool get isFailure => this is ErrorResult<S, F>;

  S? get dataOrNull => isSuccess ? (this as Success<S, F>).data : null;
  F? get failureOrNull => isFailure ? (this as ErrorResult<S, F>).failure : null;

  R fold<R>({
    required R Function(S data) onSuccess,
    required R Function(F failure) onFailure,
  }) {
    if (this is Success<S, F>) {
      return onSuccess((this as Success<S, F>).data);
    } else if (this is ErrorResult<S, F>) {
      return onFailure((this as ErrorResult<S, F>).failure);
    }
    throw StateError('Unknown Result type');
  }
}

class Success<S, F extends Failure> extends Result<S, F> {
  final S data;
  const Success(this.data);
}

class ErrorResult<S, F extends Failure> extends Result<S, F> {
  final F failure;
  const ErrorResult(this.failure);
}

abstract class UseCase<Type, Params> {
  Future<Result<Type, Failure>> call(Params params);
}

class NoParams {
  const NoParams();
}
