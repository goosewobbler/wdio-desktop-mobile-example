// E2E fixture app for @wdio/flutter-service (example repo — find/tap subset).
//
// This is the UPSTREAM fixture STRIPPED of the Dart-side `wdio_flutter` contract, which is not yet
// published to pub.dev. It keeps only the backend-independent surface the runnable specs drive:
//   - enableFlutterDriverExtension()  — required for the FLUTTER context (appium-flutter-driver)
//   - find/tap : ValueKey('increment') button + ValueKey('counter') text
//
// The execute (wdioHandlers) / mock (wdioRegistry) / emitEvent (wdioEvents) wiring is omitted until
// `wdio_flutter` ships. The greeting/lastEvent widgets are kept (static) so the deferred
// execute/mocking/emitEvent specs have their selectors when re-enabled — see the package README's
// "Re-enable path". Startup still calls enableFlutterDriverExtension() before runApp().

import 'package:flutter/material.dart';
import 'package:flutter_driver/driver_extension.dart';

void main() {
  enableFlutterDriverExtension();
  runApp(const WdioFixtureApp());
}

class WdioFixtureApp extends StatelessWidget {
  const WdioFixtureApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'WDIO Flutter Fixture',
      home: HomeScreen(),
    );
  }
}

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _counter = 0;
  String _greetingText = '';
  // Placeholder for the deferred emitEvent spec's ValueKey('lastEvent') target. Stays empty until
  // the wdioEvents listener is restored (see README "Re-enable path").
  final String _lastEvent = '';

  void _increment() {
    setState(() {
      _counter += 1;
      // Real implementation. When the mock seam is restored, this routes through wdioRegistry so
      // browser.flutter.mock('GreetingService.greet') can override it.
      _greetingText = 'Hello, WDIO!';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('WDIO Flutter Fixture')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Text('$_counter', key: const ValueKey('counter')),
            Text(_greetingText, key: const ValueKey('greeting')),
            Text(_lastEvent, key: const ValueKey('lastEvent')),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        key: const ValueKey('increment'),
        onPressed: _increment,
        child: const Icon(Icons.add),
      ),
    );
  }
}
