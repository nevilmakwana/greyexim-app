"use client";

import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    // Check if script is already there to prevent duplicates
    if (document.getElementById("google-translate-script")) return;

    // 1. Define the Init function
    // @ts-ignore
    window.googleTranslateElementInit = () => {
      // @ts-ignore
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "pl,pt,ru,es,ja,it,de,fr,nl,en",
          layout: 0, // Vertical layout is often more stable
          autoDisplay: false,
        },
        "google_translate_element"
      );
    };

    // 2. Load the Google Script
    const script = document.createElement("script");
    script.id = "google-translate-script";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return (
    // We use min-width to make sure the dropdown has space to expand
    <div id="google_translate_element" className="min-w-[150px]"></div>
  );
}