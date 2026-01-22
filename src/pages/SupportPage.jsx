// src/pages/SupportPage.jsx
import React, { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  Filter,
  Share2,
  Edit,
  Trash2,
  Copy,
  Globe,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  X,
  AlertCircle,
  Heart,
  Pill,
  Home,
  BookOpen,
  Briefcase,
  Scale,
  Utensils,
  Shirt,
  Brain,
  HandHeart,
  Plus,
  Check,
  Eye,
  ChevronRight,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import useUserInfo from "../hooks/useUserInfo";
import countries from "../utils/countries";
import CreateHelpRequestModal from "../components/CreateHelpRequestModal";
import EditHelpRequestModal from "../components/EditHelpRequestModal";
import CreatePostModal from "../components/CreatePostModal";

const SupportPage = () => {
  const { t, i18n } = useTranslation();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [error, setError] = useState("");
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [showOwnRequests, setShowOwnRequests] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const navigate = useNavigate();
  const { userInfo } = useUserInfo();

  // States for filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Help types with localization
  const helpTypes = [
    {
      id: "financial",
      icon: Heart,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "psychological",
      icon: Brain,
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "physical",
      icon: HandHeart,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "medical",
      icon: Pill,
      color: "text-red-600",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      id: "educational",
      icon: BookOpen,
      color: "text-indigo-600",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      id: "housing",
      icon: Home,
      color: "text-amber-600",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      id: "food",
      icon: Utensils,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      id: "clothing",
      icon: Shirt,
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      id: "legal",
      icon: Scale,
      color: "text-gray-600",
      bgColor: "bg-gray-100 dark:bg-gray-900/20",
    },
    {
      id: "employment",
      icon: Briefcase,
      color: "text-cyan-600",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
  ];

  // Load user profile
  useEffect(() => {
    loadUserProfile();
  }, []);

  // Load help requests
  useEffect(() => {
    if (userProfile) {
      loadHelpRequests();
    }
  }, [userProfile]);

  // Filter requests
  useEffect(() => {
    filterRequests();
  }, [
    requests,
    searchQuery,
    selectedCountry,
    dateFrom,
    dateTo,
    showOwnRequests,
  ]);

  const loadUserProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw new Error(t("user_error") || "Error loading user");
      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError || !profile?.has_completed_onboarding) {
        navigate("/onboarding");
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadHelpRequests = async () => {
    setRequestsLoading(true);
    try {
      let query = supabase
        .from("help_requests")
        .select(
          `
          *,
          users!inner (
            id,
            unique_name,
            country,
            avatar_url
          )
        `,
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      // Add country filter if selected
      if (selectedCountry !== "all") {
        query = query.eq("country_code", selectedCountry);
      }

      const { data, error } = await query;

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error("Error loading requests:", error);
      setError(t("failed_to_load_requests") || "Failed to load requests");
    } finally {
      setRequestsLoading(false);
    }
  };

  const filterRequests = useCallback(() => {
    let filtered = [...requests];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (request) =>
          request.title.toLowerCase().includes(query) ||
          request.description.toLowerCase().includes(query) ||
          request.users.unique_name.toLowerCase().includes(query),
      );
    }

    // Filter by date
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(
        (request) => new Date(request.created_at) >= fromDate,
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(
        (request) => new Date(request.created_at) <= toDate,
      );
    }

    // "My requests" filter
    if (showOwnRequests && userProfile) {
      filtered = filtered.filter(
        (request) => request.user_id === userProfile.id,
      );
    }

    setFilteredRequests(filtered);
  }, [requests, searchQuery, dateFrom, dateTo, showOwnRequests, userProfile]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert(t("logout_failed") || "Logout failed");
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (
      !confirm(
        t("confirm_delete_request") ||
          "Are you sure you want to delete this request?",
      )
    ) {
      return;
    }

    try {
      const { error } = await supabase
        .from("help_requests")
        .update({ status: "cancelled" })
        .eq("id", requestId);

      if (error) throw error;

      // Update list
      loadHelpRequests();
      alert(t("request_deleted") || "Request successfully deleted");
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(t("delete_request_error") || "Failed to delete request");
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(t("copied_to_clipboard") || "Copied to clipboard");
    });
  };

  const shareRequest = (request) => {
    const shareUrl = `${window.location.origin}/help/${request.id}`;
    if (navigator.share) {
      navigator.share({
        title: request.title,
        text: request.description.substring(0, 100),
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(t("link_copied") || "Link copied");
      });
    }
  };

  const openRequestPage = (requestId) => {
    navigate(`/help/${requestId}`);
  };

  const openEditModal = (request) => {
    if (request.user_id !== userProfile?.id) {
      alert(t("not_owner") || "You are not the owner of this request");
      return;
    }

    setEditingRequest(request);
    setShowEditModal(true);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    loadHelpRequests();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingRequest(null);
    loadHelpRequests();
  };

  // Get translated country name based on current language
  const getCountryName = (code) => {
    const country = countries.find((c) => c.code === code);
    if (!country) return code;

    // Get current language code (default to 'en' if not found)
    const currentLang = i18n.language.split("-")[0] || "en";
    const supportedLangs = [
      "en",
      "uk",
      "es",
      "fr",
      "de",
      "zh",
      "hi",
      "ar",
      "pt",
      "ru",
      "ja",
    ];
    const lang = supportedLangs.includes(currentLang) ? currentLang : "en";

    return country.name[lang] || country.name.en || code;
  };

  // Format date based on current language
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const currentLang = i18n.language;

    // Define locale based on language
    let locale = "en-US"; // default
    if (currentLang.startsWith("uk")) locale = "uk-UA";
    else if (currentLang.startsWith("es")) locale = "es-ES";
    else if (currentLang.startsWith("fr")) locale = "fr-FR";
    else if (currentLang.startsWith("de")) locale = "de-DE";
    else if (currentLang.startsWith("zh")) locale = "zh-CN";
    else if (currentLang.startsWith("ru")) locale = "ru-RU";
    else if (currentLang.startsWith("ja")) locale = "ja-JP";

    return date.toLocaleDateString(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const currentLang = i18n.language;

    // Define locale based on language
    let locale = "en-US"; // default
    if (currentLang.startsWith("uk")) locale = "uk-UA";
    else if (currentLang.startsWith("es")) locale = "es-ES";
    else if (currentLang.startsWith("fr")) locale = "fr-FR";
    else if (currentLang.startsWith("de")) locale = "de-DE";
    else if (currentLang.startsWith("zh")) locale = "zh-CN";
    else if (currentLang.startsWith("ru")) locale = "ru-RU";
    else if (currentLang.startsWith("ja")) locale = "ja-JP";

    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getFileIcon = (url) => {
    if (
      url?.includes(".jpg") ||
      url?.includes(".jpeg") ||
      url?.includes(".png") ||
      url?.includes(".gif")
    ) {
      return <ImageIcon className="w-4 h-4" />;
    }
    if (
      url?.includes(".mp4") ||
      url?.includes(".avi") ||
      url?.includes(".mov")
    ) {
      return <Video className="w-4 h-4" />;
    }
    if (url?.includes(".pdf")) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  // Function for gradients
  const getGradientClasses = (isActive = false) => {
    return isActive
      ? "from-black via-gray-900 to-blue-950"
      : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900";
  };

  const getHoverClasses = () => {
    return "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950";
  };

  if (loading) {
    return (
      <Layout
        userProfile={userProfile}
        onLogout={handleLogout}
        loading={loading}
        error={error}
        onCreatePost={() => setShowCreatePostModal(true)}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      userProfile={userProfile}
      onLogout={handleLogout}
      loading={loading}
      error={error}
      onCreatePost={() => setShowCreatePostModal(true)}
    >
      {/* Create post modal */}
      {showCreatePostModal && userProfile && (
        <div className="h-full">
          <CreatePostModal
            onClose={() => setShowCreatePostModal(false)}
            userCountry={userInfo?.country || "EARTH"}
          />
        </div>
      )}

      {/* Create help request modal */}
      {showCreateModal && userProfile && !showCreatePostModal && (
        <CreateHelpRequestModal
          userProfile={userProfile}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Edit help request modal */}
      {showEditModal && userProfile && !showCreatePostModal && (
        <EditHelpRequestModal
          request={editingRequest}
          userProfile={userProfile}
          onClose={() => {
            setShowEditModal(false);
            setEditingRequest(null);
          }}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Main page - displayed only if no modal windows are open */}
      {!showCreateModal && !showEditModal && !showCreatePostModal && (
        <div className="p-3 sm:p-4">
          {/* Header and create button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HandHeart className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
                {t("support_requests") || "Support Requests"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                {t("support_description") ||
                  "Find and create help requests around the world"}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className={`
                px-4 py-2 text-white rounded-full font-medium transition-all duration-300
                flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm
                bg-gradient-to-r ${getGradientClasses(true)} ${getHoverClasses()}
                hover:scale-[1.02] shadow hover:shadow-md
              `}
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
              {t("create_request") || "Create Request"}
            </button>
          </div>

          {/* Search and filters - compact version */}
          <div className="mb-6 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("search_requests") || "Search requests..."}
                  className="w-full pl-9 pr-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* Additional filters */}
            <div className="flex flex-wrap gap-2 items-center">
              {/* Country filter */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="flex-1 min-w-[120px] px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white text-xs sm:text-sm"
              >
                <option value="all">
                  {t("all_countries") || "All Countries"}
                </option>
                <option value="EARTH">
                  {t("planet_earth") || "Planet Earth"}
                </option>
                {countries
                  .filter((c) => c.code !== "EARTH")
                  .map((country) => (
                    <option key={country.code} value={country.code}>
                      {getCountryName(country.code)}
                    </option>
                  ))}
              </select>

              {/* Date filter */}
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white text-xs sm:text-sm w-32"
                />
                <span className="text-gray-500 text-xs">—</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white text-xs sm:text-sm w-32"
                />
              </div>

              {/* Reset filters button */}
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCountry("all");
                  setDateFrom("");
                  setDateTo("");
                  setShowOwnRequests(false);
                }}
                className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                {t("reset_filters") || "Reset"}
              </button>
            </div>
          </div>

          {/* Requests list */}
          <div className="space-y-3">
            {requestsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900 mx-auto mb-2"></div>
                <div className="text-gray-500 text-xs sm:text-sm">
                  {t("loading_requests") || "Loading requests..."}
                </div>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
                <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  {t("no_requests_found") || "No requests found"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-xs max-w-md mx-auto">
                  {t("no_requests_description") ||
                    "Try changing filters or create the first request"}
                </p>
                {!showCreateModal && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className={`
                      mt-3 px-4 py-2 text-white rounded-full font-medium transition-all duration-300
                      flex items-center gap-2 mx-auto text-xs sm:text-sm
                      bg-gradient-to-r ${getGradientClasses(true)} ${getHoverClasses()}
                      hover:scale-[1.02] shadow hover:shadow-md
                    `}
                  >
                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                    {t("create_first_request") || "Create first request"}
                  </button>
                )}
              </div>
            ) : (
              filteredRequests.map((request) => {
                const isOwner = userProfile?.id === request.user_id;
                const hasAttachments = request.attachments?.length > 0;
                const hasPaymentDetails =
                  request.bank_details ||
                  request.crypto_wallets?.length > 0 ||
                  request.paypal_email;

                return (
                  <div
                    key={request.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-3 sm:p-4 hover:shadow-md transition-shadow border border-gray-200 dark:border-gray-700 cursor-pointer"
                    onClick={() => openRequestPage(request.id)}
                  >
                    {/* Title and author */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-2">
                        <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white line-clamp-2 mb-1">
                          {request.title}
                        </h2>
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Author */}
                          <div className="flex items-center gap-1.5">
                            {request.users.avatar_url ? (
                              <img
                                src={request.users.avatar_url}
                                alt={request.users.unique_name}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                <span className="text-blue-600 dark:text-blue-400 font-medium text-xs">
                                  {request.users.unique_name?.charAt(0) || "U"}
                                </span>
                              </div>
                            )}
                            <span className="font-medium text-gray-900 dark:text-white text-xs">
                              {request.users.unique_name}
                            </span>
                            {isOwner && (
                              <span className="text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                                {t("owner") || "Owner"}
                              </span>
                            )}
                          </div>

                          {/* Country */}
                          <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400 text-xs">
                            <Globe className="w-3 h-3" />
                            <span>{getCountryName(request.country_code)}</span>
                          </div>

                          {/* Date */}
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatDate(request.created_at)}
                          </div>
                        </div>
                      </div>

                      {/* Actions - compact */}
                      <div
                        className="flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareRequest(request);
                          }}
                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                          title={t("share") || "Share"}
                        >
                          <Share2 className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                        </button>
                        {isOwner && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(request);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                              title={t("edit") || "Edit"}
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRequest(request.id);
                              }}
                              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                              title={t("delete") || "Delete"}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                            </button>
                          </>
                        )}
                        <ChevronRight className="w-4 h-4 text-gray-400 ml-1" />
                      </div>
                    </div>

                    {/* Help types - compact */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {request.help_types?.slice(0, 3).map((typeId) => {
                        const type = helpTypes.find((t) => t.id === typeId);
                        if (!type) return null;
                        const Icon = type.icon;
                        return (
                          <span
                            key={typeId}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${type.bgColor} ${type.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {t(`help_type_${typeId}`) || typeId}
                          </span>
                        );
                      })}
                      {request.help_types?.length > 3 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          +{request.help_types.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Description - truncated */}
                    <p className="text-gray-700 dark:text-gray-300 text-xs sm:text-sm mb-3 line-clamp-2">
                      {request.description}
                    </p>

                    {/* Additional information indicators */}
                    <div className="flex flex-wrap gap-2 items-center text-xs text-gray-500 dark:text-gray-400">
                      {hasPaymentDetails && (
                        <span className="flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          {t("has_payment_details") || "Has payment details"}
                        </span>
                      )}
                      {hasAttachments && (
                        <span className="flex items-center gap-1">
                          <File className="w-3 h-3" />
                          {request.attachments.length} {t("files") || "files"}
                        </span>
                      )}
                      <span className="ml-auto">
                        {formatTime(request.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </Layout>
  );
};

export default SupportPage;
