import { useI18nContext } from "./react-context.js";

export function useTranslation() {
  const { t, locale, direction } = useI18nContext();
  return { t, locale, direction };
}

export function useLocale() {
  const { locale, setLocale, locales, direction } = useI18nContext();
  return { locale, setLocale, locales, direction, isRtl: direction === "rtl" };
}

export function useFormatters() {
  const { formatNumber, formatCurrency, formatDate } = useI18nContext();
  return { formatNumber, formatCurrency, formatDate };
}
