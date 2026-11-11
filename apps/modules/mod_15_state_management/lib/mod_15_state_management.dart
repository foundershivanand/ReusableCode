sealed class UiState<T> {
  const UiState();

  R when<R>({
    required R Function() initial,
    required R Function() loading,
    required R Function(T data) success,
    required R Function() empty,
    required R Function(String message) error,
    R Function()? offline,
    R Function(T data)? refreshing,
  }) {
    if (this is UiInitial<T>) return initial();
    if (this is UiLoading<T>) return loading();
    if (this is UiSuccess<T>) return success((this as UiSuccess<T>).data);
    if (this is UiEmpty<T>) return empty();
    if (this is UiError<T>) return error((this as UiError<T>).message);
    if (this is UiOffline<T>) return (offline ?? initial)();
    if (this is UiRefreshing<T>) {
      final currentData = (this as UiRefreshing<T>).data;
      return (refreshing != null) ? refreshing(currentData) : success(currentData);
    }
    throw StateError('Unhandled UiState: $runtimeType');
  }
}

class UiInitial<T> extends UiState<T> {
  const UiInitial();
}

class UiLoading<T> extends UiState<T> {
  const UiLoading();
}

class UiSuccess<T> extends UiState<T> {
  final T data;
  const UiSuccess(this.data);
}

class UiEmpty<T> extends UiState<T> {
  const UiEmpty();
}

class UiError<T> extends UiState<T> {
  final String message;
  const UiError(this.message);
}

class UiOffline<T> extends UiState<T> {
  const UiOffline();
}

class UiRefreshing<T> extends UiState<T> {
  final T data;
  const UiRefreshing(this.data);
}
