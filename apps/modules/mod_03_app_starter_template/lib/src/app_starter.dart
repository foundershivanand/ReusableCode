import 'package:flutter/widgets.dart';

abstract class AppStarter {
  static Future<void> initialize({
    required Future<void> Function() setupDependencies,
    required Widget Function() appBuilder,
  }) async {
    WidgetsFlutterBinding.ensureInitialized();
    await setupDependencies();
    runApp(appBuilder());
  }
}
