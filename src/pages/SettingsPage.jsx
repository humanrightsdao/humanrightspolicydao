// src/pages/SettingsPage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import LanguageSelector from "../components/LanguageSelector";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";
import CreatePostModal from "../components/CreatePostModal";
import useUserInfo from "../hooks/useUserInfo";
import {
  LogOut,
  Settings,
  Globe,
  Moon,
  Download,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) return savedTheme === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const { userInfo } = useUserInfo();

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem("theme", newDarkMode ? "dark" : "light");
    if (newDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const loadUserProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) throw new Error(t("user_error"));
        if (!user) {
          navigate("/");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw new Error(t("profile_not_found"));

        if (!profile?.has_completed_onboarding) {
          navigate("/onboarding");
          return;
        }

        setUserProfile(profile);

        const web3Addr = localStorage.getItem("web3_wallet_address");
        if (web3Addr) {
          setWalletAddress(web3Addr);
        } else if (profile.wallet_address) {
          setWalletAddress(profile.wallet_address);
        }
      } catch (error) {
        console.error(t("profile_load_error"), error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();

    const savedTheme = localStorage.getItem("theme");
    if (
      savedTheme === "dark" ||
      (!savedTheme && window.matchMedia("(prefers-color-scheme: dark)").matches)
    ) {
      document.documentElement.classList.add("dark");
      setIsDarkMode(true);
    }
  }, [navigate, t]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("web3_wallet_address");
      localStorage.removeItem("web3_signature");
      localStorage.removeItem("web3_message");
      navigate("/");
    } catch (error) {
      console.error(t("logout_error"), error);
      alert(t("logout_failed"));
    }
  };

  const handleResetSettings = () => {
    if (window.confirm(t("settings_reset_confirm"))) {
      localStorage.removeItem("theme");
      setIsDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);

      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      alert(t("settings_reset_success"));
    }
  };

  const handleExportData = () => {
    const userData = {
      profile: userProfile,
      preferences: {
        language: i18n.language,
        darkMode: isDarkMode,
        lastUpdated: new Date().toISOString(),
      },
    };

    const dataStr = JSON.stringify(userData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `user-settings-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(t("settings_export_success"));
  };

  return (
    <Layout
      userProfile={userProfile}
      walletAddress={walletAddress}
      onLogout={handleLogout}
      loading={loading}
      error={error}
      onCreatePost={() => setShowCreatePostModal(true)}
      compactMode={true}
    >
      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          userCountry={userInfo?.country || "EARTH"}
        />
      )}

      <div className="max-w-4xl mx-auto px-2">
        {/* Компактний заголовок */}
        <div className="mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("menu_settings")}
            </h1>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-8">
            {t("settings_description")}
          </p>
        </div>

        {/* Компактна мова */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("language_settings")}
            </h2>
          </div>

          <div className="ml-7">
            <div className="mb-2">
              <LanguageSelector compact={true} />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t("current_language")}:{" "}
              <span className="font-medium text-gray-900 dark:text-white">
                {i18n.language.toUpperCase()}
              </span>
            </p>
          </div>
        </div>

        {/* Компактна тема */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                  {t("dark_mode")}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("dark_mode_description")}
                </p>
              </div>
            </div>

            <button
              onClick={toggleDarkMode}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300
                ${isDarkMode ? "bg-blue-600" : "bg-gray-300"}
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              `}
              aria-label={
                isDarkMode ? t("disable_dark_mode") : t("enable_dark_mode")
              }
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300
                  ${isDarkMode ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>
        </div>

        {/* Компактні додаткові налаштування */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-3">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-4 h-4 text-green-600 dark:text-green-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("additional_settings")}
            </h2>
          </div>

          <div className="space-y-2 ml-7">
            <button
              onClick={handleExportData}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-green-600 dark:text-green-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("export_data")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("export_data_description")}
                  </p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button
              onClick={handleResetSettings}
              className="w-full flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700
                hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-red-600 dark:text-red-400" />
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {t("reset_settings")}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("reset_settings_description")}
                  </p>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Компактний логаут */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-3">
            <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              {t("account_actions") || "Account Actions"}
            </h2>
          </div>

          <div className="ml-7">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-3 rounded-lg border border-red-200 dark:border-red-800
                bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20
                hover:from-red-100 hover:to-red-200 dark:hover:from-red-800/30 dark:hover:to-red-700/30
                transition-all duration-300 text-red-700 dark:text-red-400 font-medium text-sm"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("logout")}
            </button>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              {t("logout_warning") ||
                "After logging out, you will need to sign in again."}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
