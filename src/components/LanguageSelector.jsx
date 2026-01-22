// ./components/LanguageSelector.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import { languages } from "../i18n";

const LanguageSelector = ({ className = "", isFloating = false }) => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === i18n.language) || languages[0];

  if (isFloating) {
    return (
      <div className={`fixed top-4 right-4 z-50 ${className}`}>
        <div className="relative group">
          <button
            className="flex items-center gap-2 px-4 py-3 rounded-full font-semibold text-sm text-white
              bg-gradient-to-r from-gray-900 via-blue-950 to-blue-900
              hover:from-black hover:via-gray-900 hover:to-blue-950
              transition-all duration-300 transform hover:scale-105
              shadow-md hover:shadow-xl ring-2 ring-transparent hover:ring-white hover:ring-opacity-60
              focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Select language"
            onClick={(e) => {
              e.currentTarget.nextSibling?.classList.toggle("hidden");
            }}
          >
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.code.toUpperCase()}</span>
            <svg
              className="w-4 h-4 transition-transform group-hover:rotate-180"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>

          <div className="absolute top-full right-0 mt-2 hidden group-hover:block hover:block">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 min-w-[180px] overflow-hidden">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                    ${i18n.language === lang.code ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}
                >
                  <span className="text-lg">{lang.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{lang.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {lang.code.toUpperCase()}
                    </span>
                  </div>
                  {i18n.language === lang.code && (
                    <svg
                      className="w-5 h-5 ml-auto text-blue-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <select
        value={i18n.language}
        onChange={(e) => changeLanguage(e.target.value)}
        className="appearance-none w-full p-3 rounded-full font-semibold transition-all duration-300
          border border-gray-300 dark:border-gray-600
          bg-gray-50 dark:bg-gray-700
          text-gray-900 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
          placeholder-gray-500 dark:placeholder-gray-400
          hover:bg-gray-100 dark:hover:bg-gray-600
          cursor-pointer"
        aria-label="Select language"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name} ({lang.code.toUpperCase()})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-gray-700 dark:text-gray-300">
        <svg
          className="fill-current h-5 w-5"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
        </svg>
      </div>
    </div>
  );
};

export default LanguageSelector;
