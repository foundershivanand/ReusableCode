library mod_11_local_data_system;

import 'dart:async';
import 'dart:convert';
import 'package:crypto/crypto.dart';

abstract class EncryptedKeyValueStore {
  Future<void> setString(String key, String value);
  Future<String?> getString(String key);
  Future<void> setInt(String key, int value);
  Future<int?> getInt(String key);
  Future<void> setBool(String key, bool value);
  Future<bool?> getBool(String key);
  Future<void> setJson(String key, Map<String, dynamic> value);
  Future<Map<String, dynamic>?> getJson(String key);
  Future<void> delete(String key);
  Future<void> clearAll();
}

class InMemoryEncryptedStore implements EncryptedKeyValueStore {
  final Map<String, dynamic> _store = {};

  @override
  Future<void> setString(String key, String value) async => _store[key] = value;
  @override
  Future<String?> getString(String key) async => _store[key] as String?;

  @override
  Future<void> setInt(String key, int value) async => _store[key] = value;
  @override
  Future<int?> getInt(String key) async => _store[key] as int?;

  @override
  Future<void> setBool(String key, bool value) async => _store[key] = value;
  @override
  Future<bool?> getBool(String key) async => _store[key] as bool?;

  @override
  Future<void> setJson(String key, Map<String, dynamic> value) async =>
      _store[key] = jsonEncode(value);

  @override
  Future<Map<String, dynamic>?> getJson(String key) async {
    final raw = _store[key] as String?;
    if (raw == null) return null;
    return jsonDecode(raw) as Map<String, dynamic>;
  }

  @override
  Future<void> delete(String key) async => _store.remove(key);

  @override
  Future<void> clearAll() async => _store.clear();
}

abstract class SqlCipherDatabase {
  Future<void> open({required String path, required String passphrase});
  Future<List<Map<String, dynamic>>> rawQuery(String sql, [List<dynamic>? arguments]);
  Future<int> rawInsert(String sql, [List<dynamic>? arguments]);
  Future<int> rawUpdate(String sql, [List<dynamic>? arguments]);
  Future<int> rawDelete(String sql, [List<dynamic>? arguments]);
  Future<T> transaction<T>(Future<T> Function(SqlCipherDatabase db) action);
  Future<void> close();
}

class MockSqlCipherDatabase implements SqlCipherDatabase {
  bool _isOpen = false;
  final List<String> executionLog = [];

  @override
  Future<void> open({required String path, required String passphrase}) async {
    if (passphrase.length < 16) {
      throw ArgumentError('SQLCipher passphrase must be at least 16 characters long');
    }
    _isOpen = true;
  }

  @override
  Future<List<Map<String, dynamic>>> rawQuery(String sql, [List<dynamic>? arguments]) async {
    executionLog.add('QUERY: $sql');
    return [];
  }

  @override
  Future<int> rawInsert(String sql, [List<dynamic>? arguments]) async {
    executionLog.add('INSERT: $sql');
    return 1;
  }

  @override
  Future<int> rawUpdate(String sql, [List<dynamic>? arguments]) async {
    executionLog.add('UPDATE: $sql');
    return 1;
  }

  @override
  Future<int> rawDelete(String sql, [List<dynamic>? arguments]) async {
    executionLog.add('DELETE: $sql');
    return 1;
  }

  @override
  Future<T> transaction<T>(Future<T> Function(SqlCipherDatabase db) action) async {
    executionLog.add('BEGIN TRANSACTION');
    try {
      final res = await action(this);
      executionLog.add('COMMIT');
      return res;
    } catch (e) {
      executionLog.add('ROLLBACK');
      rethrow;
    }
  }

  @override
  Future<void> close() async {
    _isOpen = false;
  }
}
