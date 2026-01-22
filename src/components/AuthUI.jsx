// ./components/AuthUI.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";

const AuthUI = ({
  activeForm,
  email,
  setEmail,
  emailLoading,
  emailSent,
  web3Auth,
  onSelect,
  onEmailSubmit,
  onWeb3Submit,
  onBack,
  onUsernameLogin,
  usernameLoading,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { t } = useTranslation();

  const getColorClasses = (isActive = false) => {
    return {
      gradient: isActive
        ? "from-black via-gray-900 to-blue-950"
        : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900",
      hover:
        "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950",
    };
  };

  if (!activeForm) {
    const colorClasses = getColorClasses();

    return (
      <div className="space-y-6">
        {/* Email секція */}
        <div className="space-y-4">
          {emailSent ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
                <p className="text-green-800 dark:text-green-200 text-center font-medium">
                  {t("check_your_email")}
                </p>
                <p className="text-sm text-green-600 dark:text-green-300 mt-2 text-center">
                  {t("magic_link_sent")} <strong>{email}</strong>.
                </p>
              </div>
              <button
                onClick={onBack}
                className="w-full py-3 px-3 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors font-medium text-sm"
              >
                {t("enter_another_email")}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("your_email")}
                className="w-full p-2 rounded-full font-medium transition-all duration-300
                  border-2 border-blue-300 dark:border-gray-600
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-transparent
                  placeholder-blue-900 dark:placeholder-gray-400
                  text-center
                  hover:bg-gray-50 dark:hover:bg-gray-600
                  disabled:opacity-50 disabled:cursor-not-allowed"
                required
              />

              <button
                onClick={onEmailSubmit}
                disabled={emailLoading || !email.trim()}
                className={`
                  w-full px-3 py-3 rounded-full font-medium transition-all duration-300
                  flex items-center justify-center gap-2 text-sm text-white transform
                  bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
                  ring-1 ring-transparent
                  hover:scale-[1.02] shadow hover:shadow-md
                  hover:ring-transparent
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow
                  ${emailLoading ? "cursor-wait" : ""}
                `}
              >
                {emailLoading ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {t("sending")}
                  </>
                ) : (
                  t("login_with_email")
                )}
              </button>
            </div>
          )}
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-3 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              {t("or")}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={onSelect.google}
            className={`
              w-full px-3 py-3 rounded-full font-medium transition-all duration-300
              flex items-center justify-center gap-2 text-sm text-white transform
              bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
              ring-1 ring-transparent
              hover:scale-[1.02] shadow hover:shadow-md
              hover:transparent
            `}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t("login_with_google")}
          </button>

          {/*<button
            onClick={onSelect.web3}
            className={`
              w-full px-3 py-3 rounded-full font-medium transition-all duration-300
              flex items-center justify-center gap-2 text-sm text-white transform
              bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
              ring-1 ring-transparent
              hover:scale-[1.02] shadow hover:shadow-md
              hover:transparent
            `}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 3.22l-.61-.6a5.5 5.5 0 00-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 00-7.78-7.77l-.61.61z" />
            </svg>
            {t("login_with_web3")}
            </button>*/}
        </div>
      </div>
    );
  }

  if (activeForm === "email") {
    const colorClasses = getColorClasses();

    return (
      <div className="space-y-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white transition-colors"
        >
          {t("back_to_selection")}
        </button>

        {emailSent ? (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-xl">
              <p className="text-green-800 dark:text-green-200 text-center font-medium">
                {t("check_your_email")}
              </p>
              <p className="text-sm text-green-600 dark:text-green-300 mt-2 text-center">
                {t("magic_link_sent")} <strong>{email}</strong>.
              </p>
            </div>
            <button
              onClick={onBack}
              className="w-full py-3 px-3 bg-blue-100 dark:bg-blue-700 text-blue-700 dark:text-blue-200 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-600 transition-colors font-medium text-sm"
            >
              {t("enter_another_email")}
            </button>
          </div>
        ) : (
          <form onSubmit={onEmailSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {t("email_address")}
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("your_email")}
                className="w-full p-2 rounded-full font-medium transition-all duration-300
                  border-2 border-gray-300 dark:border-gray-600
                  bg-white dark:bg-gray-700
                  text-gray-900 dark:text-white
                  focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
                  placeholder-gray-500 dark:placeholder-gray-400
                  text-center
                  hover:bg-gray-50 dark:hover:bg-gray-600"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={emailLoading || !email.trim()}
              className={`
                w-full px-3 py-3 rounded-full font-medium transition-all duration-300
                flex items-center justify-center gap-2 text-sm text-white transform
                bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
                ring-1 ring-transparent
                hover:scale-[1.02] shadow hover:shadow-md
                hover:transparent
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow
                ${emailLoading ? "cursor-wait" : ""}
              `}
            >
              {emailLoading ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {t("sending")}
                </>
              ) : (
                t("login_with_email")
              )}
            </button>
          </form>
        )}
      </div>
    );
  }

  const colorClasses = getColorClasses();

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white transition-colors"
      >
        {t("back_to_selection")}
      </button>

      <div className="space-y-6">
        {web3Auth.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl">
            <p className="text-sm text-red-600 dark:text-red-300">
              {web3Auth.error}
            </p>
          </div>
        )}

        <button
          onClick={onWeb3Submit}
          disabled={web3Auth.loading}
          className={`
            w-full px-3 py-3 rounded-full font-medium transition-all duration-300
            flex items-center justify-center gap-2 text-sm text-white transform
            bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
            ring-1 ring-transparent
            hover:scale-[1.02] shadow hover:shadow-md
            hover:transparent
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow
            ${web3Auth.loading ? "cursor-wait" : ""}
          `}
        >
          {web3Auth.loading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              {t("connecting_wallet")}
            </>
          ) : (
            t("login_with_web3")
          )}
        </button>
      </div>
    </div>
  );
};

export default AuthUI;
