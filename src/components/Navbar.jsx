// src/components/Navbar.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Bot, Wallet, Search, X } from "lucide-react";
import AIAssistant from "./AIAssistant";

const Navbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [userProfile, setUserProfile] = useState(null);
  const [walletAddress, setWalletAddress] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [showAI, setShowAI] = useState(false);

  useEffect(() => {
    loadUserProfile();
    checkWalletConnection();
  }, []);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        if (profile) setUserProfile(profile);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const checkWalletConnection = () => {
    const walletAddr = localStorage.getItem("web3_wallet_address");
    if (walletAddr) {
      setWalletAddress(walletAddr);
      setIsWalletConnected(true);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      // Additionally, you can clear the search field after submitting
      setSearchQuery("");
      setIsSearchFocused(false);
    }
  };

  const handleDocumentClick = () => {
    window.open(
      "https://ipfs.io/ipfs/QmRXQP1s6rVaiXxrr6jY6Y7EfK1CYvyc82F99siunckoQr/",
      "_blank",
    );
  };

  const handleAIClick = () => {
    setShowAI(true);
  };

  const handleWalletClick = () => {
    if (isWalletConnected) {
      alert(`${t("wallet_connected")}: ${formatWalletAddress(walletAddress)}`);
    } else {
      navigate("/connect-wallet");
    }
  };

  const handleLogoClick = () => {
    if (userProfile?.has_completed_onboarding) {
      navigate("/country");
    } else {
      navigate("/");
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-blue-800 dark:border-gray-700 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left part: Logo and name */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogoClick}
                className="flex items-center gap-3 hover:opacity-80 transition-opacity duration-200"
              >
                <div className="flex-shrink-0">
                  <img
                    src="/logo.png"
                    alt="DAO Logo"
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div className="hidden md:block">
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                    Human Rights Policy
                    <br />
                    <span className="text-sm font-medium text-black dark:text-white">
                      Decentralized Autonomous Organization
                    </span>
                  </h1>
                </div>
                <div className="md:hidden">
                  <h1 className="text-sm font-bold text-gray-900 dark:text-white">
                    HRP DAO
                  </h1>
                </div>
              </button>
            </div>

            {/* Central part: Search */}
            <div className="flex-1 max-w-md mx-4 flex justify-end lg:justify-center">
              <form onSubmit={handleSearch} className="w-full max-w-xs">
                <div
                  className={`relative rounded-full overflow-hidden transition-all duration-300 ${
                    isSearchFocused
                      ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg"
                      : "shadow"
                  }`}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => setIsSearchFocused(false)}
                    placeholder={t("search_placeholder")}
                    className="w-full py-2 pl-4 pr-12 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none transition-colors duration-200 text-sm"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 bottom-0 px-3 bg-gradient-to-r from-gray-800 to-blue-900 dark:from-gray-700 dark:to-blue-800 text-white hover:from-gray-900 hover:to-blue-950 dark:hover:from-gray-600 dark:hover:to-blue-900 transition-all duration-200"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right part: Icons */}
            <div className="flex items-center gap-3">
              {/* Mobile search button */}
              <div className="md:hidden">
                <button
                  onClick={() => navigate("/search")}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative group"
                  title={t("search")}
                >
                  <Search className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                    {t("search")}
                  </span>
                </button>
              </div>

              {/* Document */}
              <button
                onClick={handleDocumentClick}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 relative group"
                title={t("view_document")}
              >
                <div className="flex items-center justify-center">
                  <img
                    src="/scroll.png"
                    alt="Document"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML =
                        '<div class="w-5 h-5 bg-gray-400"></div>';
                    }}
                  />
                </div>
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {t("view_document")}
                </span>
              </button>

              {/* Wallet
              <button
                onClick={handleWalletClick}
                className={`p-2 rounded-full transition-all duration-200 relative group ${
                  isWalletConnected
                    ? "bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-600 dark:text-green-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                title={
                  isWalletConnected
                    ? t("wallet_connected")
                    : t("connect_wallet")
                }
              >
                <Wallet className="w-5 h-5" />
                {isWalletConnected && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-500 rounded-full border border-white dark:border-gray-900"></div>
                )}
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {isWalletConnected
                    ? formatWalletAddress(walletAddress)
                    : t("connect_wallet")}
                </span>
              </button>*/}

              {/* AI */}
              <button
                onClick={handleAIClick}
                className={`p-2 rounded-full transition-all duration-200 relative group ${
                  showAI
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 text-purple-600 dark:text-purple-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                title={t("ai_assistant")}
              >
                <div className="w-8 h-8 flex items-center justify-center overflow-hidden rounded-full">
                  <img
                    src="/atticus.png"
                    alt="AI Assistant"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML = '<Bot class="w-5 h-5" />';
                    }}
                  />
                </div>
                {showAI && (
                  <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-purple-500 rounded-full border border-white dark:border-gray-900"></div>
                )}
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
                  {t("ai_assistant")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* AI Assistant modal window */}
      {showAI && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-4 pb-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-5xl mx-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <AIAssistant
                onClose={() => setShowAI(false)}
                isFullPage={false}
              />
            </div>

            {/* External close button */}
            <button
              onClick={() => setShowAI(false)}
              className="absolute top-4 right-4 p-2 bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-full hover:bg-white/20 dark:hover:bg-gray-700/50 transition-colors duration-200"
              title={t("close") || "Close"}
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
