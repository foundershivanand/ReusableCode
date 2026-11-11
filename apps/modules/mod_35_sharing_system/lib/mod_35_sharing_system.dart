class NativeShareService {
  static Future<bool> shareText(String text, {String? subject}) async {
    // In production, invokes native share sheet via platform channel
    return true;
  }
}
