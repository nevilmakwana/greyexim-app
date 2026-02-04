"use client";

import { useEffect, useState } from "react";

const LANGUAGES = [
  { code: "en", name: "English", flag: "us" },
  { code: "pl", name: "Polish", flag: "pl" },
  { code: "pt", name: "Portuguese", flag: "pt" },
  { code: "ru", name: "Russian", flag: "ru" },
  { code: "es", name: "Spanish", flag: "es" },
  { code: "ja", name: "Japanese", flag: "jp" },
  { code: "it", name: "Italian", flag: "it" },
  { code: "de", name: "German", flag: "de" },
  { code: "fr", name: "French", flag: "fr" },
  { code: "nl", name: "Dutch", flag: "nl" },
];

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");

  useEffect(() => {
    const cookies = document.cookie.split(";");
    const langCookie = cookies.find((row) =>
      row.trim().startsWith("googtrans=")
    );

    if (langCookie) {
      const langCode = langCookie.split("/").pop();
      if (langCode) setCurrentLang(langCode);
    }

    if (!document.getElementById("google-translate-script")) {
      const script = document.createElement("script");
      script.id = "google-translate-script";
      script.src =
        "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      script.async = true;
      document.body.appendChild(script);

      // @ts-ignore
      window.googleTranslateElementInit = () => {
        // @ts-ignore
        new window.google.translate.TranslateElement(
          {
            pageLanguage: "en",
            autoDisplay: false,
            includedLanguages: "en,pl,pt,ru,es,ja,it,de,fr,nl",
          },
          "google_translate_element"
        );
      };
    }
  }, []);

  const changeLanguage = (langCode: string) => {
    document.cookie = `googtrans=/en/${langCode}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`;
    setCurrentLang(langCode);
    setIsOpen(false);
    window.location.reload();
  };

  const current = LANGUAGES.find((l) => l.code === currentLang) || LANGUAGES[0];

  return (
    <div className="relative z-50">
      <div id="google_translate_element" className="hidden" />

      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition border border-gray-200"
      >
        <img
          src={`https://flagcdn.com/w20/${current.flag}.png`}
          srcSet={`https://flagcdn.com/w40/${current.flag}.png 2x`}
          alt={current.name}
          className="w-5 h-4 rounded-sm object-cover"
        />
        <span className="text-sm font-medium text-gray-700 hidden sm:block">
          {current.name}
        </span>
        <svg
          className={`w-3 h-3 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m19.5 8.25-7.5 7.5-7.5-7.5"
          />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-lg shadow-xl border border-gray-100 z-50 py-2">
            <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
              Select Language
            </p>

            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition ${
                  currentLang === lang.code
                    ? "bg-gray-100 font-semibold"
                    : "hover:bg-gray-50"
                }`}
              >
                <img
                  src={`https://flagcdn.com/w20/${lang.flag}.png`}
                  srcSet={`https://flagcdn.com/w40/${lang.flag}.png 2x`}
                  alt={lang.name}
                  className="w-5 h-4 rounded-sm object-cover"
                />
                <span className="text-gray-700">{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
