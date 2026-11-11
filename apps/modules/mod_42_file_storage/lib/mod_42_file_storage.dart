abstract class LocalFileManager {
  Future<void> saveFile(String filename, List<int> bytes);
  Future<List<int>?> readFile(String filename);
  Future<void> deleteFile(String filename);
}

class MockLocalFileManager implements LocalFileManager {
  final Map<String, List<int>> _files = {};

  @override
  Future<void> saveFile(String filename, List<int> bytes) async => _files[filename] = bytes;

  @override
  Future<List<int>?> readFile(String filename) async => _files[filename];

  @override
  Future<void> deleteFile(String filename) async => _files.remove(filename);
}
