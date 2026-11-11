library mod_12_offline_first_sync;

import 'dart:async';
import 'dart:collection';
import 'dart:math';

enum MutationStatus { pending, inFlight, completed, failed, deadLetter }
enum ConflictStrategy { serverWins, clientWins, threeWayMerge }

class SyncMutation {
  final String id;
  final String endpoint;
  final String method;
  final Map<String, dynamic> payload;
  final DateTime createdAt;
  final int retryCount;
  final MutationStatus status;
  final String? lastError;

  SyncMutation({
    required this.id,
    required this.endpoint,
    required this.method,
    required this.payload,
    DateTime? createdAt,
    this.retryCount = 0,
    this.status = MutationStatus.pending,
    this.lastError,
  }) : createdAt = createdAt ?? DateTime.now();

  SyncMutation copyWith({
    int? retryCount,
    MutationStatus? status,
    String? lastError,
  }) {
    return SyncMutation(
      id: id,
      endpoint: endpoint,
      method: method,
      payload: payload,
      createdAt: createdAt,
      retryCount: retryCount ?? this.retryCount,
      status: status ?? this.status,
      lastError: lastError ?? this.lastError,
    );
  }
}

typedef MutationDispatcher = Future<bool> Function(SyncMutation mutation);

class PersistentOutboxQueue {
  final Queue<SyncMutation> _queue = Queue();
  final List<SyncMutation> _deadLetterQueue = [];
  final ConflictStrategy conflictStrategy;
  final int maxRetries;
  bool _isProcessing = false;

  PersistentOutboxQueue({
    this.conflictStrategy = ConflictStrategy.serverWins,
    this.maxRetries = 5,
  });

  int get pendingCount => _queue.length;
  int get deadLetterCount => _deadLetterQueue.length;
  bool get isProcessing => _isProcessing;

  void enqueue(SyncMutation mutation) {
    _queue.add(mutation);
  }

  Future<int> processQueue(MutationDispatcher dispatcher) async {
    if (_isProcessing || _queue.isEmpty) return 0;
    _isProcessing = true;
    int successCount = 0;

    try {
      final items = List<SyncMutation>.from(_queue);
      for (final mutation in items) {
        try {
          final success = await dispatcher(mutation);
          if (success) {
            _queue.remove(mutation);
            successCount++;
          } else {
            _handleFailedMutation(mutation, 'Dispatcher returned false');
          }
        } catch (e) {
          _handleFailedMutation(mutation, e.toString());
        }
      }
    } finally {
      _isProcessing = false;
    }

    return successCount;
  }

  void _handleFailedMutation(SyncMutation mutation, String error) {
    _queue.remove(mutation);
    final nextRetry = mutation.retryCount + 1;
    if (nextRetry >= maxRetries) {
      _deadLetterQueue.add(mutation.copyWith(
        retryCount: nextRetry,
        status: MutationStatus.deadLetter,
        lastError: error,
      ));
    } else {
      _queue.add(mutation.copyWith(
        retryCount: nextRetry,
        status: MutationStatus.pending,
        lastError: error,
      ));
    }
  }

  void clearAll() {
    _queue.clear();
    _deadLetterQueue.clear();
  }
}
