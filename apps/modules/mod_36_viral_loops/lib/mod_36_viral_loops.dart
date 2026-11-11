class ReferralManager {
  static String generateReferralLink(String userId) {
    return "https://app.factory.link/invite?ref=$userId";
  }
}
