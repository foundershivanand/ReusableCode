import { useCompliance } from "./react-context.js";

export { useCompliance };

export function useCookieConsent() {
  const { consent, updateConsent } = useCompliance();
  const cookies = consent?.cookieConsent || {
    essential: true,
    analytics: false,
    marketing: false,
    functional: false
  };

  return {
    cookies,
    hasGivenConsent: !!consent,
    updateCookies: (analytics: boolean, marketing: boolean, functional: boolean) =>
      updateConsent(
        consent?.acceptedTerms ?? true,
        consent?.acceptedPrivacy ?? true,
        consent?.marketingConsent ?? false,
        { essential: true, analytics, marketing, functional }
      )
  };
}
