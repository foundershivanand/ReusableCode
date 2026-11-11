library mod_41_database_architecture;

class DatabaseMigration {
  final int version;
  final String description;
  final List<String> upStatements;
  final List<String> downStatements;

  const DatabaseMigration({
    required this.version,
    required this.description,
    required this.upStatements,
    this.downStatements = const [],
  });
}

class DatabaseMigrationRunner {
  final List<DatabaseMigration> _registeredMigrations = [];

  void register(DatabaseMigration migration) {
    _registeredMigrations.add(migration);
    _registeredMigrations.sort((a, b) => a.version.compareTo(b.version));
  }

  List<DatabaseMigration> getPending(int currentDatabaseVersion) {
    return _registeredMigrations.where((m) => m.version > currentDatabaseVersion).toList();
  }

  Future<int> executePending({
    required int currentVersion,
    required Future<void> Function(String sql) executeSql,
    required Future<void> Function(int newVersion) recordVersion,
  }) async {
    final pending = getPending(currentVersion);
    int appliedVersion = currentVersion;

    for (final migration in pending) {
      for (final sql in migration.upStatements) {
        await executeSql(sql);
      }
      appliedVersion = migration.version;
      await recordVersion(appliedVersion);
    }

    return appliedVersion;
  }
}
