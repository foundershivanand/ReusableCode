class CicdFactoryPipeline:
    @staticmethod
    def generate_github_actions_workflow(app_name: str) -> str:
        return f"""name: Build & Test {app_name}
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: 'stable'
      - run: flutter pub get
      - run: flutter test
      - run: flutter build apk --release
"""
