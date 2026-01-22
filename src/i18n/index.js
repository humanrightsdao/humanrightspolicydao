// ./i18n/index.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enTranslations from "./locales/en.json";
import ukTranslations from "./locales/uk.json";
import esTranslations from "./locales/es.json";
import frTranslations from "./locales/fr.json";
import deTranslations from "./locales/de.json";
import zhTranslations from "./locales/zh.json";
import hiTranslations from "./locales/hi.json";
import arTranslations from "./locales/ar.json";
import ptTranslations from "./locales/pt.json";
import ruTranslations from "./locales/ru.json";
import jaTranslations from "./locales/ja.json";

const resources = {
  en: { translation: enTranslations },
  uk: { translation: ukTranslations },
  es: { translation: esTranslations },
  fr: { translation: frTranslations },
  de: { translation: deTranslations },
  zh: { translation: zhTranslations },
  hi: { translation: hiTranslations },
  ar: { translation: arTranslations },
  pt: { translation: ptTranslations },
  ru: { translation: ruTranslations },
  ja: { translation: jaTranslations },
};

export const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "uk", name: "Українська", flag: "🇺🇦" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "pt", name: "Português", flag: "🇵🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
