class UserAiQuota {
  final String userId;
  final int dailyLimit;
  int usedToday;
  DateTime lastReset;

  UserAiQuota({
    required this.userId,
    required this.dailyLimit,
    this.usedToday = 0,
    DateTime? lastReset,
  }) : lastReset = lastReset ?? DateTime.now();

  bool canConsume(int tokens) {
    _checkReset();
    return (usedToday + tokens) <= dailyLimit;
  }

  void consume(int tokens) {
    if (!canConsume(tokens)) {
      throw StateError('AI quota exceeded. Daily limit: $dailyLimit');
    }
    usedToday += tokens;
  }

  void _checkReset() {
    final now = DateTime.now();
    if (now.difference(lastReset).inHours >= 24) {
      usedToday = 0;
      lastReset = now;
    }
  }
}
