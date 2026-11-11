enum AppLifecycleState { resumed, inactive, paused, detached }

class AppLifecycleObserver {
  void onStateChanged(AppLifecycleState state) {
    if (state == AppLifecycleState.paused) {
      // Obscure sensitive screen preview in app switcher
    }
  }
}
