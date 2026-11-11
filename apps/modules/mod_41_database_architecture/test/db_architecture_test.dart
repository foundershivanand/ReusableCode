import 'package:test/test.dart';
import 'package:mod_41_database_architecture/mod_41_database_architecture.dart';

void main() {
  test('Returns pending migrations strictly in ascending order', () {
    final engine = MigrationEngine();
    engine.registerMigration(const Migration(version: 2, description: 'v2', upStatements: []));
    engine.registerMigration(const Migration(version: 1, description: 'v1', upStatements: []));
    engine.registerMigration(const Migration(version: 3, description: 'v3', upStatements: []));

    final pending = engine.getPendingMigrations(1);
    expect(pending.length, equals(2));
    expect(pending.first.version, equals(2));
    expect(pending.last.version, equals(3));
  });
}
