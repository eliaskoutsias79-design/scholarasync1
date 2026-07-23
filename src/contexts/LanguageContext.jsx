import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { translations } from "../i18n/translations";

const LanguageContext = createContext(null);
let activeLanguage = "en";

const greekToEnglish = Object.fromEntries(
  Object.entries(translations.el).map(([english, greek]) => [greek, english])
);

export const translate = (key) => {
  const value = String(key ?? "");
  const dictionary = activeLanguage === "el" ? translations.el : greekToEnglish;
  if (dictionary[value]) return dictionary[value];

  return Object.keys(dictionary)
    .sort((a, b) => b.length - a.length)
    .reduce(
      (text, source) => text.split(source).join(dictionary[source]),
      value
    );
};

const translateRenderedUI = (language) => {
  activeLanguage = language;
  if (typeof document === "undefined" || typeof Node === "undefined") return;

  const translateNode = (node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const value = node.nodeValue;
      const trimmed = value.trim();
      if (!trimmed) return;
      const translated = translate(trimmed);
      if (translated !== trimmed) {
        node.nodeValue = value.replace(trimmed, translated);
      }
      return;
    }

    if (
      node.nodeType !== Node.ELEMENT_NODE ||
      ["SCRIPT", "STYLE"].includes(node.tagName)
    ) {
      return;
    }

    ["placeholder", "aria-label", "title"].forEach((attribute) => {
      const value = node.getAttribute(attribute);
      if (value) node.setAttribute(attribute, translate(value));
    });

    node.childNodes.forEach(translateNode);
  };

  translateNode(document.body);
};

const getInitialLanguage = () => {
  if (typeof window === "undefined") return "en";
  const saved = window.localStorage.getItem("scholarAsyncLanguage");
  if (saved === "en" || saved === "el") return saved;
  return window.navigator.language?.toLowerCase().startsWith("el") ? "el" : "en";
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(getInitialLanguage);

  useEffect(() => {
    activeLanguage = language;
    window.localStorage.setItem("scholarAsyncLanguage", language);

    const observer = new MutationObserver(() => translateRenderedUI(language));
    translateRenderedUI(language);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t: translate }),
    [language]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider.");
  }
  return context;
};
