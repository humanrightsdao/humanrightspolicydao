// src/pages/UserProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  User,
  Mail,
  Globe,
  Cake,
  Link as LinkIcon,
  ArrowLeft,
  Shield,
  Wallet,
  MessageSquare,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";
import CountryFeed from "../components/CountryFeed";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry"; // ДОДАНО

const UserProfilePage = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(); // ДОДАНО i18n
  const { userInfo, loading: userLoading, error: userError } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(i18n.language); // ДОДАНО

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadUserData = async () => {
      if (!userId) {
        navigate("/");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const { data: user, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

        if (userError) {
          throw new Error(t("user_not_found") || "User not found");
        }

        setUserData(user);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [userId, navigate, t]);

  // Функція для отримання відображуваної назви країни
  const getCountryDisplayName = (countryCode) => {
    if (!countryCode || countryCode === "EARTH") {
      return t("global") || "Global";
    }
    const translated = getTranslatedCountryName(countryCode);
    return translated || countryCode;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const date = new Date(dateString);
    return date
      .toLocaleDateString("uk-UA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replaceAll("/", ".");
  };

  const parseSocialLinks = (links) => {
    if (!links) return [];
    try {
      if (Array.isArray(links)) return links;
      if (typeof links === "string") {
        const parsed = JSON.parse(links);
        return Array.isArray(parsed) ? parsed : [];
      }
      return [];
    } catch (error) {
      console.error("Error parsing social links:", error);
      return [];
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return "Not connected";
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (loading) {
    return (
      <Layout
        userProfile={userInfo}
        walletAddress={userInfo?.walletAddress}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("web3_wallet_address");
          window.location.href = "/";
        }}
        loading={userLoading}
        error={userError}
        onCreatePost={() => {}}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout
        userProfile={userInfo}
        walletAddress={userInfo?.walletAddress}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("web3_wallet_address");
          window.location.href = "/";
        }}
        loading={userLoading}
        error={userError}
        onCreatePost={() => {}}
      >
        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t("user_not_found") || "User not found"}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {error}
            </p>
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors text-sm"
            >
              <ArrowLeft className="w-3 h-3 inline mr-1" />
              {t("go_back") || "Go back"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const socialLinks = parseSocialLinks(userData.social_links);
  const userCountryName = getCountryDisplayName(userData.country); // ВИПРАВЛЕНО: використання нової функції

  return (
    <Layout
      userProfile={userInfo}
      walletAddress={userInfo?.walletAddress}
      onLogout={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("web3_wallet_address");
        window.location.href = "/";
      }}
      loading={userLoading}
      error={userError}
      onCreatePost={() => {}}
    >
      <div className="max-w-3xl mx-auto p-3">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          {t("back") || "Back"}
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <div className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="relative">
                {userData.avatar_url ? (
                  <img
                    src={`${userData.avatar_url}?t=${Date.now()}`}
                    alt={userData.unique_name}
                    className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const parent = e.target.parentElement;
                      const fallback = document.createElement("div");
                      fallback.className =
                        "w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white dark:border-gray-800 shadow";
                      fallback.textContent =
                        userData.unique_name?.[0]?.toUpperCase() || "U";
                      parent.appendChild(fallback);
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold border-2 border-white dark:border-gray-800 shadow">
                    {userData.unique_name?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </div>

              <div className="flex-1">
                <div className="mb-3">
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                    {userData.unique_name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full flex items-center gap-0.5">
                      <Globe className="w-2.5 h-2.5" />
                      {userCountryName}
                    </span>
                    {userData.wallet_address && (
                      <span className="px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-xs rounded-full flex items-center gap-0.5">
                        <Wallet className="w-2.5 h-2.5" />
                        Web3
                      </span>
                    )}
                  </div>
                </div>

                {userData.bio && (
                  <div className="mb-3">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {userData.bio}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {userData.wallet_address && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <Wallet className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs">
                        {formatWalletAddress(userData.wallet_address)}
                      </span>
                    </div>
                  )}

                  {userData.date_of_birth && (
                    <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                      <Cake className="w-3.5 h-3.5" />
                      <span>{formatDate(userData.date_of_birth)}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Shield className="w-3.5 h-3.5" />
                    <span>
                      {t("member_since") || "Since"}{" "}
                      {formatDate(userData.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {socialLinks.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4 mb-4">
            <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4" />
              {t("social_networks") || "Social networks"}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {socialLinks.map((link, index) => (
                <a
                  key={link.id || index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700 text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 dark:text-white truncate">
                      {link.username}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {link.platform}
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4" />
            {t("user_posts") || "Posts"}
          </h2>

          <CountryFeed
            userId={userId}
            countryCode={null}
            filterByCountry={false}
            compact={true}
          />
        </div>
      </div>
    </Layout>
  );
};

export default UserProfilePage;
