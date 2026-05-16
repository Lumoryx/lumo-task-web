import { useAppStore } from "@/store/useAppStore";
import { STRINGS } from "@/i18n/strings";
import type { LocalizedString, Locale } from "@/types/task";

/** Hook returning a translator bound to the active locale. */
export function useT() {
  const locale = useAppStore((s) => s.locale);
  return (key: string): string => STRINGS[locale][key] ?? key;
}

/** Pick the right field off a `LocalizedString`, falling back to English. */
export function pickLocale(value: LocalizedString | undefined, locale: Locale): string {
  if (!value) return "";
  return value[locale] ?? value.en ?? "";
}

/** Hook variant of `pickLocale`. */
export function useLocaleString() {
  const locale = useAppStore((s) => s.locale);
  return (value: LocalizedString | undefined) => pickLocale(value, locale);
}
