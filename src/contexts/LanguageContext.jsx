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

const translateRenderedUI = (language, root) => {
  activeLanguage = language;
  if (typeof document === "undefined" || typeof Node === "undefined") return;
  const target = root || document.body;

  const translateNode = (node) => {
    const element =
      node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    if (element?.closest?.('[translate="no"]')) return;

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
      if (!value) return;
      const translated = translate(value);
      if (translated !== value) node.setAttribute(attribute, translated);
    });

    node.childNodes.forEach(translateNode);
  };

  translateNode(target);
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

    const observer = new MutationObserver((records) => {
      activeLanguage = language;
      records.forEach((record) => {
        if (record.type === "childList") {
          record.addedNodes.forEach((node) =>
            translateRenderedUI(language, node)
          );
          return;
        }
        translateRenderedUI(language, record.target);
      });
    });
    translateRenderedUI(language);
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["aria-label", "placeholder", "title"],
      characterData: true,
      childList: true,
      subtree: true,
    });
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
