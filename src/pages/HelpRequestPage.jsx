// src/pages/HelpRequestPage.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Share2,
  Copy,
  Globe,
  Calendar,
  FileText,
  Image as ImageIcon,
  Video,
  File,
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
  Edit,
  Trash2,
  ExternalLink,
  Mail,
  MessageCircle,
  MapPin,
  Eye,
  User,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry";
import EditHelpRequestModal from "../components/EditHelpRequestModal";

const HelpRequestPage = () => {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [request, setRequest] = useState(null);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { userInfo, loadUserInfo } = useUserInfo();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);

  const { getTranslatedCountryName } = useCountry(i18n.language);

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

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (id) {
      loadHelpRequest();
    }
  }, [id]);

  const loadUserProfile = async () => {
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) {
        return;
      }

      const userData = await loadUserInfo();
      if (userData) {
        setUserProfile({
          id: userData.id,
          email: userData.email,
          unique_name: userData.uniqueName,
          country: userData.country,
          avatar_url: userData.avatarUrl,
          has_completed_onboarding: userData.hasCompletedOnboarding,
        });
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadHelpRequest = async () => {
    try {
      const { data: requestData, error: requestError } = await supabase
        .from("help_requests")
        .select(
          `
          *,
          users!inner (
            id,
            unique_name,
            country,
            avatar_url,
            email,
            bio,
            social_links
          )
        `,
        )
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (requestError) {
        console.error("Error loading request:", requestError);
        throw requestError;
      }

      if (!requestData) {
        setError(t("request_not_found") || "Request not found");
        setLoading(false);
        return;
      }

      console.log("Request data received:", requestData);
      setRequest(requestData);

      if (requestData.users) {
        setAuthor({
          id: requestData.users.id,
          unique_name: requestData.users.unique_name,
          country: requestData.users.country,
          avatar_url: requestData.users.avatar_url,
          email: requestData.users.email,
          bio: requestData.users.bio,
          social_links: requestData.users.social_links,
        });
      } else {
        setAuthor({
          id: requestData.user_id,
          unique_name: "User",
          country: null,
          avatar_url: null,
          email: null,
          bio: null,
          social_links: null,
        });
      }
    } catch (error) {
      console.error("Error loading request:", error);
      setError(t("failed_to_load_request") || "Failed to load request");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert(t("logout_failed") || "Logout failed");
    }
  };

  const handleDeleteRequest = async () => {
    if (!userProfile) {
      alert(t("login_required") || "Login required");
      navigate("/");
      return;
    }

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
        .eq("id", id);

      if (error) throw error;

      alert(t("request_deleted") || "Request successfully deleted");
      navigate("/support");
    } catch (error) {
      console.error("Error deleting request:", error);
      alert(t("delete_request_error") || "Failed to delete request");
    }
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setEditingRequest(null);
    loadHelpRequest();
  };

  const openEditModal = () => {
    if (!userProfile || !request) {
      alert(t("login_required") || "Login required");
      return;
    }

    if (request.user_id !== userProfile.id) {
      alert(t("not_owner") || "You are not the owner of this request");
      return;
    }

    setEditingRequest(request);
    setShowEditModal(true);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert(t("copied_to_clipboard") || "Copied to clipboard");
    });
  };

  const shareRequest = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: request?.title,
        text: request?.description?.substring(0, 100) || "",
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl).then(() => {
        alert(t("link_copied") || "Link copied");
      });
    }
  };

  const getCountryName = (code) => {
    if (!code || code === "EARTH") return "";
    return getTranslatedCountryName(code) || code;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);

    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${day}.${month}.${year}, ${hours}:${minutes}`;
  };

  const getFileIcon = (url) => {
    if (!url) return <File className="w-4 h-4" />;

    if (
      url.includes(".jpg") ||
      url.includes(".jpeg") ||
      url.includes(".png") ||
      url.includes(".gif") ||
      url.includes(".webp")
    ) {
      return <ImageIcon className="w-4 h-4" />;
    }
    if (
      url.includes(".mp4") ||
      url.includes(".avi") ||
      url.includes(".mov") ||
      url.includes(".wmv") ||
      url.includes(".flv")
    ) {
      return <Video className="w-4 h-4" />;
    }
    if (url.includes(".pdf")) {
      return <FileText className="w-4 h-4" />;
    }
    return <File className="w-4 h-4" />;
  };

  const getGradientClasses = (isActive = false) => {
    return isActive
      ? "from-black via-gray-900 to-blue-950"
      : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900";
  };

  const handleAvatarError = (e) => {
    console.warn("Avatar failed to load:", e);
    e.target.style.display = "none";
    const fallback = e.target.parentElement.querySelector(".avatar-fallback");
    if (fallback) {
      fallback.style.display = "flex";
    }
  };

  if (loading) {
    return (
      <Layout
        userProfile={userProfile}
        onLogout={handleLogout}
        loading={loading}
        error={error}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      </Layout>
    );
  }

  if (error && !request) {
    return (
      <Layout
        userProfile={userProfile}
        onLogout={handleLogout}
        loading={loading}
        error={error}
      >
        <div className="p-4">
          <button
            onClick={() => navigate("/support")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back_to_requests") || "Back to requests"}
          </button>
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              {error}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t("request_not_found_description") ||
                "This request was not found or has been deleted"}
            </p>
            <button
              onClick={() => navigate("/support")}
              className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
            >
              {t("view_all_requests") || "View all requests"}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const isOwner = userProfile?.id === request?.user_id;

  return (
    <Layout
      userProfile={userProfile}
      onLogout={handleLogout}
      loading={loading}
      error={error}
    >
      {showEditModal && userProfile && (
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

      <div className="p-3 sm:p-4 max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <button
            onClick={() => navigate("/support")}
            className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:underline text-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("back_to_requests") || "Back"}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={shareRequest}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-xs"
              title={t("share") || "Share"}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t("share") || "Share"}</span>
            </button>
            {isOwner && (
              <>
                <button
                  onClick={openEditModal}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors text-xs"
                  title={t("edit") || "Edit"}
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {t("edit") || "Edit"}
                  </span>
                </button>
                <button
                  onClick={handleDeleteRequest}
                  className="flex items-center gap-1 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-xs"
                  title={t("delete") || "Delete"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {t("delete") || "Delete"}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {request && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-4 border border-gray-200 dark:border-gray-700">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {request.title}
            </h1>

            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="relative">
                  {author?.avatar_url ? (
                    <>
                      <img
                        src={author.avatar_url}
                        alt={author.unique_name || "User"}
                        className="w-10 h-10 rounded-full object-cover"
                        onError={handleAvatarError}
                      />
                      <div className="avatar-fallback hidden w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 items-center justify-center">
                        <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {author?.unique_name || "User"}
                    {isOwner && (
                      <span className="ml-2 text-xs px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
                        {t("owner") || "Owner"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <Globe className="w-3 h-3" />
                    {getCountryName(request.country_code)}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 ml-auto">
                <Calendar className="w-3 h-3" />
                {formatDate(request.created_at)}
              </div>
            </div>

            {request.help_types && request.help_types.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {request.help_types.map((typeId) => {
                  const type = helpTypes.find((t) => t.id === typeId);
                  if (!type) return null;
                  const Icon = type.icon;
                  return (
                    <span
                      key={typeId}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${type.bgColor} ${type.color}`}
                    >
                      <Icon className="w-3 h-3" />
                      {t(`help_type_${typeId}`) || typeId}
                    </span>
                  );
                })}
              </div>
            )}

            <div className="mb-6">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                {t("description") || "Description"}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed text-sm">
                {request.description}
              </p>
            </div>

            {author && author.email && (
              <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  {t("contact_author") || "Contacts"}
                </h3>
                <div className="space-y-1.5">
                  {author.email && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <Mail className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm truncate">
                          {author.email}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(author.email)}
                        className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                        title={t("copy") || "Copy"}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                  {author.bio && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <MessageCircle className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300 text-sm truncate">
                          {author.bio}
                        </span>
                      </div>
                      <button
                        onClick={() => copyToClipboard(author.bio)}
                        className="ml-2 p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded flex-shrink-0"
                        title={t("copy") || "Copy"}
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {(request.bank_details ||
              request.crypto_wallets?.length > 0 ||
              request.paypal_email) && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t("payment_details") || "Payment details"}
                </h3>
                <div className="space-y-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  {request.bank_details && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1.5 text-xs">
                        {t("bank_transfer") || "Bank transfer"}
                      </h4>
                      <div className="space-y-1.5">
                        {request.bank_details.bankName && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400 text-xs">
                              {t("bank") || "Bank"}:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-900 dark:text-white text-xs font-mono">
                                {request.bank_details.bankName}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(request.bank_details.bankName)
                                }
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title={t("copy") || "Copy"}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                        {request.bank_details.accountNumber && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400 text-xs">
                              {t("account_number") || "Account"}:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-900 dark:text-white text-xs font-mono truncate max-w-[120px] sm:max-w-[200px]">
                                {request.bank_details.accountNumber}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(
                                    request.bank_details.accountNumber,
                                  )
                                }
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title={t("copy") || "Copy"}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                        {request.bank_details.iban && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400 text-xs">
                              IBAN:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-900 dark:text-white text-xs font-mono truncate max-w-[120px] sm:max-w-[200px]">
                                {request.bank_details.iban}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(request.bank_details.iban)
                                }
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title={t("copy") || "Copy"}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                        {request.bank_details.swift && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600 dark:text-gray-400 text-xs">
                              SWIFT:
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-900 dark:text-white text-xs font-mono truncate max-w-[120px] sm:max-w-[200px]">
                                {request.bank_details.swift}
                              </span>
                              <button
                                onClick={() =>
                                  copyToClipboard(request.bank_details.swift)
                                }
                                className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                                title={t("copy") || "Copy"}
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {request.crypto_wallets?.map((wallet, index) => (
                    <div key={index}>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1.5 text-xs">
                        {t("crypto_wallet") || "Crypto wallet"} {index + 1}
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          {t("address") || "Address"}:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900 dark:text-white text-xs font-mono truncate max-w-[100px] sm:max-w-[150px]">
                            {wallet}
                          </span>
                          <button
                            onClick={() => copyToClipboard(wallet)}
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title={t("copy") || "Copy"}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {request.paypal_email && (
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1.5 text-xs">
                        PayPal
                      </h4>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 dark:text-gray-400 text-xs">
                          Email:
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-gray-900 dark:text-white text-xs truncate max-w-[120px] sm:max-w-[200px]">
                            {request.paypal_email}
                          </span>
                          <button
                            onClick={() =>
                              copyToClipboard(request.paypal_email)
                            }
                            className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                            title={t("copy") || "Copy"}
                          >
                            <Copy className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {request.attachments && request.attachments.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  {t("attachments") || "Attachments"} (
                  {request.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {request.attachments.map((url, index) => {
                    if (!url) return null;
                    const fileName = url.split("/").pop();
                    const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(
                      fileName,
                    );
                    const isVideo = /\.(mp4|avi|mov|wmv|flv)$/i.test(fileName);
                    const isPdf = /\.pdf$/i.test(fileName);

                    return (
                      <div
                        key={index}
                        className="group relative border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                      >
                        {isImage ? (
                          <div className="relative aspect-square">
                            <img
                              src={url}
                              alt={`Attachment ${index + 1}`}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                            <button
                              onClick={() => window.open(url, "_blank")}
                              className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              title={t("view_full") || "View full"}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : isVideo ? (
                          <div className="relative aspect-video bg-gray-900">
                            <video
                              src={url}
                              className="w-full h-full object-contain"
                              controls
                              controlsList="nodownload"
                            />
                          </div>
                        ) : (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {getFileIcon(url)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {t("attachment") || "Attachment"} {index + 1}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {fileName}
                              </div>
                            </div>
                            <ExternalLink className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {request.country_code && request.country_code !== "EARTH" && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {t("location") || "Location"}:{" "}
                    <span className="font-medium">
                      {getCountryName(request.country_code)}
                    </span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HelpRequestPage;
