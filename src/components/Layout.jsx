// src/components/Layout.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Menu,
  X,
  Sparkles,
  Wallet,
  Search,
  Plus,
  MoreVertical,
  Home,
  Users,
  MessageSquare,
  Bell,
  User,
  Settings,
  AlertCircle,
} from "lucide-react";
import Sidebar from "./Sidebar";
import RightSidebar from "./RightSidebar";
import Navbar from "./Navbar";
import AIAssistant from "./AIAssistant";

export default function Layout({
  children,
  userProfile,
  walletAddress,
  onLogout,
  loading = false,
  error = null,
  getTranslatedCountry,
  onCreatePost,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const searchInputRef = useRef(null);
  const sidebarRef = useRef(null);
  const rightSidebarRef = useRef(null);
  const contentRef = useRef(null);

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileRightMenuOpen, setIsMobileRightMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [isMobileMenuExpanded, setIsMobileMenuExpanded] = useState(false);
  const [screenWidth, setScreenWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1024,
  );
  const [showAI, setShowAI] = useState(false);

  // Check wallet connection
  useEffect(() => {
    const walletAddr = localStorage.getItem("web3_wallet_address");
    if (walletAddr) {
      setIsWalletConnected(true);
    }
  }, []);

  // Auto-focus search input when opened
  useEffect(() => {
    if (showSearchInput && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showSearchInput]);

  // Track screen size change
  useEffect(() => {
    const handleResize = () => {
      setScreenWidth(window.innerWidth);
      // Collapse menu when resizing to larger
      if (window.innerWidth >= 768) {
        setIsMobileMenuExpanded(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Determine active menu based on current URL
  const getActiveMenuFromPath = () => {
    const path = location.pathname;
    if (path.includes("/settings")) return "settings";
    if (path.includes("/country")) return "country";
    if (path.includes("/profile")) return "profile";
    if (path.includes("/support")) return "support";
    if (path.includes("/complaints")) return "complaints";
    if (path.includes("/governance")) return "governance";
    if (path.includes("/notifications")) return "notifications";
    if (path.includes("/complaints-list")) return "violations";
    return "country";
  };

  const [activeMenu, setActiveMenu] = useState(getActiveMenuFromPath());
  const [activeRightMenu, setActiveRightMenu] = useState("");

  // Update activeMenu when path changes
  useEffect(() => {
    setActiveMenu(getActiveMenuFromPath());
  }, [location.pathname]);

  // Close mobile menus when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileRightMenuOpen(false);
  }, [location.pathname]);

  const handleMenuClick = (menuItem) => {
    setActiveMenu(menuItem);
    setIsMobileMenuOpen(false);

    const routeMap = {
      country: "/country",
      settings: "/settings",
      support: "/support",
      complaints: "/complaints",
      governance: "/governance",
      profile: "/profile",
      notifications: "/notifications",
    };

    if (routeMap[menuItem]) {
      navigate(routeMap[menuItem]);
    } else {
      alert(t("page_in_development", { page: t(`menu_${menuItem}`) }));
    }
  };

  const handleRightMenuClick = (menuItem) => {
    setActiveRightMenu(menuItem);
    setIsMobileRightMenuOpen(false);

    const rightRouteMap = {
      violations: "/complaints-list",
      support: "/support",
      complaints: "/complaints",
      governance: "/governance",
    };

    if (rightRouteMap[menuItem]) {
      navigate(rightRouteMap[menuItem]);
    } else {
      alert(`${t("page_in_development", { page: t(menuItem) })}`);
    }
  };

  const formatWalletAddress = (address) => {
    if (!address) return "";
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Navbar functions for mobile version
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
      const walletAddr = localStorage.getItem("web3_wallet_address");
      alert(`${t("wallet_connected")}: ${formatWalletAddress(walletAddr)}`);
    } else {
      navigate("/connect-wallet");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchInput(false);
    }
  };

  const handleSearchIconClick = () => {
    if (showSearchInput && searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setShowSearchInput(false);
    } else {
      setShowSearchInput(!showSearchInput);
    }

    if (!showSearchInput) {
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  };

  const handleLogoClick = () => {
    if (userProfile?.has_completed_onboarding) {
      navigate("/country");
    } else {
      navigate("/");
    }
  };

  const sidebarProps = {
    userProfile,
    activeMenu,
    handleMenuClick,
    formatWalletAddress,
    walletAddress,
    onCreatePost,
    ...(getTranslatedCountry && { getTranslatedCountry }),
  };

  const mobileMenuItems = [
    {
      key: "country",
      label: t("menu_country"),
      icon: <Home className="w-5 h-5" />,
      priority: 1,
    },
    {
      key: "create",
      label: t("create_post"),
      icon: <Plus className="w-5 h-5" />,
      priority: 1,
      special: true,
    },
    {
      key: "support",
      label: t("menu_support"),
      icon: <Users className="w-5 h-5" />,
      priority: 2,
    },
    {
      key: "complaints",
      label: t("menu_complaints"),
      icon: <MessageSquare className="w-5 h-5" />,
      priority: 2,
    },
    {
      key: "violations",
      label: t("violations"),
      icon: <AlertCircle className="w-5 h-5" />,
      priority: 2,
      type: "right",
    },
    {
      key: "notifications",
      label: t("menu_notifications"),
      icon: <Bell className="w-5 h-5" />,
      priority: 3,
    },
    {
      key: "profile",
      label: t("menu_profile"),
      icon: <User className="w-5 h-5" />,
      priority: 3,
    },
    {
      key: "settings",
      label: t("menu_settings"),
      icon: <Settings className="w-5 h-5" />,
      priority: 3,
    },
  ];

  const getVisibleItemsCount = () => {
    if (screenWidth < 360) return 3;
    if (screenWidth < 420) return 4;
    if (screenWidth < 480) return 5;
    return 6;
  };

  const visibleItemsCount = getVisibleItemsCount();
  const hasHiddenItems = mobileMenuItems.length > visibleItemsCount;

  const visibleItems = mobileMenuItems.slice(0, visibleItemsCount);
  const hiddenItems = hasHiddenItems
    ? mobileMenuItems.slice(visibleItemsCount)
    : [];

  const handleMobileMenuItemClick = (item) => {
    if (item.key === "create" && onCreatePost) {
      onCreatePost();
      setIsMobileMenuExpanded(false);
      return;
    }

    if (item.type === "right") {
      handleRightMenuClick(item.key);
    } else {
      handleMenuClick(item.key);
    }
    setIsMobileMenuExpanded(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {t("loading_profile")}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-red-600 dark:text-red-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {t("error")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">{error}</p>
            <button
              onClick={() => navigate("/")}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200"
            >
              {t("back_to_home")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-300">
            {t("profile_not_found_short")}
          </p>
          <button
            onClick={() => navigate("/onboarding")}
            className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-xl font-medium hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200"
          >
            {t("complete_registration")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800 dark:to-gray-800">
      {/* Mobile top panel */}
      <div className="lg:hidden sticky top-0 z-50">
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-b border-blue-800 dark:border-gray-700">
          {/* Top row */}
          <div className="px-4 py-3 flex items-center justify-between">
            {/* Logo */}
            <button
              onClick={handleLogoClick}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <img
                src="/logo.png"
                alt="DAO Logo"
                className="h-10 w-auto object-contain"
              />
              <span className="text-sm font-bold text-gray-900 dark:text-white">
                HRP DAO
              </span>
            </button>

            {/* Navbar icons */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <button
                onClick={handleSearchIconClick}
                className={`p-2 rounded-full transition-colors duration-200 ${
                  showSearchInput
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
                title={t("search_placeholder")}
              >
                <Search className="w-5 h-5" />
              </button>

              {/* Document */}
              <button
                onClick={handleDocumentClick}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                title={t("view_document")}
              >
                <div className="flex items-center justify-center">
                  <img
                    src="/scroll.png"
                    alt="Document"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentNode.innerHTML =
                        '<div class="w-5 h-5 bg-gray-400"></div>';
                    }}
                  />
                </div>
              </button>

              {/* AI */}
              <button
                onClick={handleAIClick}
                className={`p-2 rounded-full transition-all duration-200 relative ${
                  showAI
                    ? "bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
                title={t("ai_assistant")}
              >
                <div className="flex items-center justify-center">
                  <img
                    src="/atticus.png"
                    alt="AI Assistant"
                    className="w-7 h-7 object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      const sparkles = document.createElement("div");
                      sparkles.innerHTML =
                        '<svg class="w-5 h-5 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>';
                      e.target.parentNode.appendChild(sparkles.firstChild);
                    }}
                  />
                </div>
                {showAI && (
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full border border-white dark:border-gray-900"></div>
                )}
              </button>

              {/* Wallet
              <button
                onClick={handleWalletClick}
                className={`p-2 rounded-full transition-all duration-200 ${
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
              </button>*/}
            </div>
          </div>

          {/* Search field */}
          {showSearchInput && (
            <div className="px-4 pb-3 animate-fadeIn">
              <form onSubmit={handleSearch} className="w-full">
                <div
                  className={`relative rounded-full overflow-hidden transition-all duration-300 ${
                    isSearchFocused
                      ? "ring-2 ring-blue-500 dark:ring-blue-400 shadow-lg"
                      : "shadow"
                  }`}
                >
                  <input
                    ref={searchInputRef}
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
          )}
        </div>
      </div>

      {/* Regular navbar for desktop */}
      <div className="hidden lg:block">
        <Navbar />
      </div>

      {/* Container */}
      <div className="p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-0 min-h-[calc(100vh-8rem)]">
            {/* Mobile menu */}
            {isMobileMenuOpen && (
              <div className="lg:hidden fixed inset-0 z-40 bg-black/50">
                <div className="fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 shadow-2xl overflow-y-auto">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {t("menu")}
                      </h2>
                      <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <Sidebar {...sidebarProps} />
                  </div>
                </div>
              </div>
            )}

            {/* Left sidebar for desktop */}
            <div className="hidden lg:block lg:w-64 order-2 lg:order-1 relative">
              <div
                ref={sidebarRef}
                className="h-full sticky top-4 sidebar-scroll custom-scrollbar"
                style={{
                  maxHeight: "calc(100vh - 8rem)",
                  height: "calc(100vh - 8rem)",
                }}
              >
                <Sidebar {...sidebarProps} />
              </div>
            </div>

            {/* Central content */}
            <div className="flex-1 order-1 lg:order-2 relative min-h-[calc(100vh-8rem)]">
              <div className="hidden lg:block absolute top-0 left-3 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-900 dark:via-gray-700 to-transparent"></div>
              <div className="hidden lg:block absolute top-0 right-3 bottom-0 w-px bg-gradient-to-b from-transparent via-blue-900 dark:via-gray-700 to-transparent"></div>

              <div
                ref={contentRef}
                className="h-full content-scroll custom-scrollbar smooth-scroll"
                style={{ height: "calc(100vh - 8rem)" }}
              >
                <div className="p-4 sm:p-6">{children}</div>
              </div>
            </div>

            {/* Right sidebar for desktop */}
            <div className="hidden lg:block lg:w-64 order-3 relative">
              <div
                ref={rightSidebarRef}
                className="h-full sticky top-4 sidebar-scroll custom-scrollbar"
                style={{
                  maxHeight: "calc(100vh - 8rem)",
                  height: "calc(100vh - 8rem)",
                }}
              >
                <RightSidebar
                  activeRightMenu={activeRightMenu}
                  onRightMenuClick={handleRightMenuClick}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile bottom menu */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-blue-800 dark:border-gray-700">
        <div className="px-2 py-2">
          <div className="flex justify-around items-center">
            {visibleItems.map((item) => {
              const isActive =
                item.type === "right"
                  ? activeRightMenu === item.key
                  : activeMenu === item.key;
              const isCreateButton = item.key === "create";

              return (
                <button
                  key={item.key}
                  onClick={() => handleMobileMenuItemClick(item)}
                  className={`flex flex-col items-center p-2 rounded-lg transition-all relative ${
                    isCreateButton
                      ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 hover:from-blue-700 hover:to-blue-800 -mt-4 px-3 py-3 rounded-full shadow-lg"
                      : isActive
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <div className={`${isCreateButton ? "w-6 h-6" : "w-5 h-5"}`}>
                    {item.icon}
                  </div>
                  <span
                    className={`text-xs max-w-[60px] truncate text-center mt-1 ${
                      isCreateButton ? "font-medium" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}

            {hasHiddenItems && (
              <button
                onClick={() => setIsMobileMenuExpanded(!isMobileMenuExpanded)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all ${
                  isMobileMenuExpanded
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <MoreVertical className="w-5 h-5" />
                <span className="text-xs max-w-[60px] truncate text-center mt-1">
                  {t("more") || "More"}
                </span>
              </button>
            )}
          </div>

          {isMobileMenuExpanded && hiddenItems.length > 0 && (
            <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 animate-slideUp">
              <div className="flex flex-wrap justify-center gap-2">
                {hiddenItems.map((item) => {
                  const isActive =
                    item.type === "right"
                      ? activeRightMenu === item.key
                      : activeMenu === item.key;

                  return (
                    <button
                      key={item.key}
                      onClick={() => handleMobileMenuItemClick(item)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all text-sm ${
                        isActive
                          ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                          : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="w-4 h-4">{item.icon}</div>
                      <span className="whitespace-nowrap">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Padding for bottom menu */}
      <div className="lg:hidden pb-16"></div>

      {/* AI assistant modal for mobile version */}
      {showAI && (
        <div className="lg:hidden fixed inset-0 z-[100] flex items-start justify-center pt-4 pb-20 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full h-full mx-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 h-full">
              <AIAssistant onClose={() => setShowAI(false)} isFullPage={true} />
            </div>

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

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
