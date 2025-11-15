import { i18n, trailingSlash } from "astro:config/client";
import { ui, defaultLang, languages } from "./ui";

export type LocaleCode = keyof typeof ui;
type TranslationDictionary = (typeof ui)[typeof defaultLang];
type TranslationKey = keyof TranslationDictionary;

export function getLangFromUrl(url: URL): LocaleCode {
  const [, lang] = url.pathname.split("/");
  if (lang && lang in ui) return lang as LocaleCode;
  return defaultLang;
}

export function useTranslations(lang: LocaleCode) {
  const fallbackDictionary = ui[defaultLang];
  const dictionary =
    lang == defaultLang
      ? fallbackDictionary
      : (ui[lang] as TranslationDictionary);

  const translate = (key: string) => {
    if (key in dictionary) {
      return dictionary[key as TranslationKey];
    }
    if (key in fallbackDictionary) {
      return fallbackDictionary[key as TranslationKey];
    }
    return key;
  };

  return translate as {
    (key: TranslationKey): string;
    (key: string): string;
  };
}

/**
 * Custom replacement for `getRelativeLocaleUrl` from `astro:i18n` so we don't
 * accidentally bundle Astro server dependencies in react islands.
 */
export function getRelativeUrl(locale: LocaleCode, path: string): string {
  const addLocalePrefix = (partialPath: string) => {
    if (
      typeof i18n?.routing === "object" &&
      i18n?.routing.prefixDefaultLocale === false &&
      locale === i18n?.defaultLocale
    ) {
      return "/" + partialPath;
    }
    return `/${locale}/` + partialPath;
  };
  const addTrailingSlash = (partialPath: string) => {
    if (trailingSlash === "always") {
      return partialPath.endsWith("/") ? partialPath : partialPath + "/";
    }
    return partialPath;
  };

  const route = path.replace(/^\/+/, "");
  return addTrailingSlash(addLocalePrefix(route));
}
