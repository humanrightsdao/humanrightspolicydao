// src/components/Sidebar.jsx
import React from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Users,
  MessageSquare,
  Settings,
  Bell,
  User,
  Wrench,
  Plus,
} from "lucide-react";
import useUserInfo from "../hooks/useUserInfo";
import { useLocation } from "react-router-dom";
import { useCountry } from "../hooks/useCountry";

const Sidebar = ({
  activeMenu,
  handleMenuClick,
  getTranslatedCountry,
  onCreatePost,
}) => {
  const { t, i18n } = useTranslation();
  const { userInfo } = useUserInfo();
  const location = useLocation();
  const { getTranslatedCountryName } = useCountry(i18n.language);

  // Function to get the displayed country name
  const getCountryDisplayName = (countryCode) => {
    if (!countryCode || countryCode === "EARTH") return "";
    const translated = getTranslatedCountryName(countryCode);
    return translated || countryCode;
  };

  const getGradientClasses = (isActive = false) => {
    return isActive
      ? "from-black via-gray-900 to-blue-950"
      : "from-gray-800 via-blue-950 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900";
  };

  const menuItems = [
    { id: "country", icon: <Globe className="w-5 h-5" /> },
    { id: "support", icon: <Users className="w-5 h-5" /> },
    { id: "complaints", icon: <MessageSquare className="w-5 h-5" /> },
    // { id: "governance", icon: <Wrench className="w-5 h-5" /> },
    { id: "notifications", icon: <Bell className="w-5 h-5" /> },
    { id: "profile", icon: <User className="w-5 h-5" /> },
    { id: "settings", icon: <Settings className="w-5 h-5" /> },
  ];

  // Function to determine whether to show the "Create post" button
  const showCreatePostButton = () => {
    if (!onCreatePost) return false;

    const currentPath = location.pathname;

    // Do not show on these pages
    const excludedPages = ["/", "/login", "/register", "/onboarding"];

    return !excludedPages.includes(currentPath);
  };

  return (
    <>
      <div className="lg:w-64 w-full mb-6 lg:mb-0">
        <div>
          <nav className="space-y-2 mb-8">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className={`
                  w-full text-left px-4 py-3 rounded-full font-medium transition-all duration-300
                  flex items-center gap-3 text-sm
                  ${
                    activeMenu === item.id
                      ? `bg-gradient-to-r ${getGradientClasses(true)} text-white shadow`
                      : "text-gray-700 dark:text-gray-300 hover:bg-blue-200 dark:hover:bg-gray-700"
                  }
                `}
              >
                <span
                  className={`${activeMenu === item.id ? "text-white" : "text-gray-600 dark:text-gray-400"}`}
                >
                  {item.icon}
                </span>
                {t(`menu_${item.id}`)}
              </button>
            ))}
          </nav>

          {/* Create post button */}
          {showCreatePostButton() && (
            <div className="mb-8">
              <button
                onClick={onCreatePost}
                className="w-full text-left px-4 py-3 bg-gradient-to-r from-blue-950 to-blue-900 dark:from-blue-950 dark:to-blue-900 text-white rounded-full hover:from-black hover:to-blue-950 dark:hover:from-black dark:hover:to-blue-950 transition-all duration-300 font-medium text-sm flex items-center gap-3 shadow-md"
              >
                <Plus className="w-5 h-5" />
                {t("create_post") || "Create post"}
              </button>
            </div>
          )}

          {/* User information */}
          <div className="pt-6 border-t border-blue-950 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative w-10 h-10">
                {/* Check if there is an avatar */}
                {userInfo?.avatarUrl ? (
                  <img
                    src={userInfo.avatarUrl}
                    alt={userInfo?.uniqueName || t("user")}
                    className="w-full h-full rounded-full object-cover "
                    onError={(e) => {
                      // If the image fails to load, show fallback
                      e.target.style.display = "none";
                      const fallback = e.target.nextSibling;
                      if (fallback) fallback.style.display = "flex";
                    }}
                  />
                ) : null}

                {/* Fallback with initials (always in DOM, but hidden if avatar exists) */}
                <div
                  className={`
                    w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600
                    flex items-center justify-center text-white font-bold
                    ${userInfo?.avatarUrl ? "absolute inset-0 hidden" : ""}
                  `}
                >
                  {userInfo?.uniqueName?.[0]?.toUpperCase() ||
                    t("user")?.[0]?.toUpperCase() ||
                    "U"}
                </div>
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {userInfo?.uniqueName || t("user")}
                </p>
                {userInfo?.country && userInfo.country !== "EARTH" && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 truncate mt-1 flex items-center gap-1">
                    <Globe className="w-3 h-3" />
                    {getCountryDisplayName(userInfo.country)} {/* FIXED */}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
