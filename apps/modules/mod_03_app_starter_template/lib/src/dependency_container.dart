abstract class DependencyContainer {
  final Map<Type, dynamic> _services = {};

  void registerSingleton<T>(T instance) {
    _services[T] = instance;
  }

  T resolve<T>() {
    final service = _services[T];
    if (service == null) {
      throw StateError('Service not registered for type $T');
    }
    return service as T;
  }

  bool isRegistered<T>() => _services.containsKey(T);

  void clear() => _services.clear();
}

class AppServiceLocator extends DependencyContainer {
  static final AppServiceLocator instance = AppServiceLocator._internal();
  AppServiceLocator._internal();
}
