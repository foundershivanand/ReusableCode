import { useReferral } from "./react-context.js";

export { useReferral };

export function useAffiliateAccount() {
  const { account, commissions, isLoading, error, registerAffiliate } = useReferral();
  return { account, commissions, isLoading, error, registerAffiliate };
}
