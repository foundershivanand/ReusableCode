# Module 03: App Starter Template

The foundation scaffold for any new app generated in the factory. It enforces Clean Architecture folders:
```text
lib/
├── core/
│   ├── config/
│   ├── errors/
│   ├── network/
│   ├── theme/
│   └── utils/
├── features/
│   └── [feature_name]/
│       ├── data/
│       │   ├── datasources/
│       │   ├── models/
│       │   └── repositories/
│       ├── domain/
│       │   ├── entities/
│       │   ├── repositories/
│       │   └── usecases/
│       └── presentation/
│           ├── controllers/
│           ├── screens/
│           └── widgets/
└── main.dart
```
