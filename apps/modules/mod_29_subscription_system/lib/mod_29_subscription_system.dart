library mod_29_subscription_system;

enum StorePlatform { googlePlay, appleAppStore, webStripe }

class SubscriptionEntitlement {
  final String entitlementId;
  final bool isActive;
  final DateTime? expiresAt;
  final bool isSandbox;

  const SubscriptionEntitlement({
    required this.entitlementId,
    required this.isActive,
    this.expiresAt,
    this.isSandbox = false,
  });

  bool get isExpired => expiresAt != null && DateTime.now().isAfter(expiresAt!);
}

abstract class InAppPurchaseGateway {
  Future<List<String>> getAvailableProductIds();
  Future<SubscriptionEntitlement> purchaseProduct(String productId);
  Future<SubscriptionEntitlement> restorePurchases();
}
