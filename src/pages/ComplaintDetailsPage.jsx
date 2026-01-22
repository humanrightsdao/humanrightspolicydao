// src/pages/ComplaintDetailsPage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Eye,
  FileText,
  ArrowLeft,
  AlertCircle,
  Globe,
  ExternalLink,
  Map,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry";
import CreatePostModal from "../components/CreatePostModal";

const ComplaintDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(
    localStorage.getItem("i18nextLng") || "en",
  );

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModerator, setIsModerator] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Load complaint details
  const loadComplaintDetails = async () => {
    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("complaints")
        .select(
          `
          *,
          users:user_id (
            id,
            unique_name,
            avatar_url
          )
        `,
        )
        .eq("id", id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      // Check access rights
      const isUserModerator =
        userInfo?.role === "moderator" || userInfo?.role === "admin";
      setIsModerator(isUserModerator);

      // If complaint is hidden, only moderators can see it
      if (data.status === "hidden" && !isUserModerator) {
        setError(t("complaint_not_found") || "Complaint not found");
        setComplaint(null);
      } else if (data.status !== "published" && !isUserModerator) {
        // Regular users can only see published complaints
        setError(t("complaint_not_available") || "Complaint not available");
        setComplaint(null);
      } else {
        setComplaint(data);
        // Increase view count
        await supabase
          .from("complaints")
          .update({ views: (data.views || 0) + 1 })
          .eq("id", id);
      }
    } catch (err) {
      console.error("Error loading complaint:", err);
      setError(
        err.message || t("load_complaint_error") || "Error loading complaint",
      );
      setComplaint(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadComplaintDetails();
    }
  }, [id, userInfo]);

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical_priority":
        return "text-red-600 bg-red-100 dark:bg-red-900/20";
      case "high_priority":
        return "text-orange-600 bg-orange-100 dark:bg-orange-900/20";
      case "medium":
      case "normal_priority":
        return "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  // Get priority text with translation keys
  const getPriorityText = (priority) => {
    switch (priority) {
      case "critical_priority":
        return t("critical_priority") || "Critical priority";
      case "high_priority":
        return t("high_priority") || "High priority";
      case "medium":
      case "normal_priority":
        return t("normal_priority") || "Normal priority";
      default:
        return t("normal_priority") || "Normal priority";
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t("unknown_date") || "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString(localStorage.getItem("i18nextLng") || "en", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format date short (for compact display)
  const formatDateShort = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(localStorage.getItem("i18nextLng") || "en", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (userLoading) {
    return (
      <Layout
        userProfile={userInfo}
        onLogout={() => {}}
        loading={true}
        onCreatePost={() => setShowCreatePostModal(true)}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      userProfile={userInfo}
      onLogout={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("web3_wallet_address");
        window.location.href = "/";
      }}
      loading={userLoading}
      onCreatePost={() => setShowCreatePostModal(true)}
    >
      {/* Create post modal */}
      {showCreatePostModal && userInfo && (
        <div className="h-full">
          <CreatePostModal
            onClose={() => setShowCreatePostModal(false)}
            userCountry={userInfo?.country || "EARTH"}
          />
        </div>
      )}

      {/* Main page - only shown if create post modal is not open */}
      {!showCreatePostModal && (
        <div className="max-w-3xl mx-auto py-4 px-3">
          {/* Back navigation and map link */}
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/complaints-list"
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("back_to_list") || "Back to list"}
            </Link>

            {/* Button to go to violations map */}
            <Link
              to="/violations-map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-full transition-colors"
            >
              <Map className="w-3.5 h-3.5" />
              {t("view_on_map") || "View on map"}
            </Link>
          </div>

          {/* Title */}
          <div className="mb-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("complaint_details") || "Complaint Details"}
            </h1>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-xs text-red-900 dark:text-red-100">{error}</p>
              <Link
                to="/complaints-list"
                className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                {t("back_to_list") || "Back"}
              </Link>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}

          {/* Complaint details */}
          {!loading && complaint && (
            <div className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Header */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex-1">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white mb-2">
                      {complaint.title}
                    </h2>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(
                          complaint.priority,
                        )}`}
                      >
                        {getPriorityText(complaint.priority)}
                      </span>
                    </div>
                  </div>

                  {/* Views statistics */}
                  <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{complaint.views || 0}</span>
                  </div>
                </div>

                {/* Meta information */}
                <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      {getTranslatedCountryName(complaint.country_code)}
                    </span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>{complaint.address}</span>
                  </div>
                </div>

                {/* Creation date (separated from general info) */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <Calendar className="w-3 h-3 flex-shrink-0" />
                    <span>
                      {t("created_at") || "Created:"}{" "}
                      {formatDate(complaint.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="p-4 space-y-4">
                {/* Violation description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t("violation_description") || "Violation Description"}
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                    <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                      {complaint.violation_description}
                    </p>
                  </div>
                </div>

                {/* General description */}
                {complaint.description && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t("general_description") || "General Description"}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {complaint.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Offender */}
                {complaint.offender_name && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t("offender_name") || "Offender"}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {complaint.offender_name}
                      </p>
                    </div>
                  </div>
                )}

                {/* Affected persons */}
                {complaint.affected_persons_info && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t("affected_persons") || "Affected Persons"}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">
                        {complaint.affected_persons_info}
                      </p>
                    </div>
                  </div>
                )}

                {/* Violation date */}
                {complaint.violation_date && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t("violation_date") || "Violation Date"}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {formatDateShort(complaint.violation_date)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Coordinates */}
                {complaint.latitude && complaint.longitude && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      {t("location") || "Coordinates"}
                    </h3>
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                        {complaint.latitude.toFixed(6)},{" "}
                        {complaint.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Evidence */}
                {complaint.evidence_files &&
                  complaint.evidence_files.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        {t("evidence_files") || "Evidence"} (
                        {complaint.evidence_files.length})
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {complaint.evidence_files.map((file, index) => (
                          <a
                            key={index}
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="relative group block"
                          >
                            {file.type.startsWith("image/") ? (
                              <div className="relative aspect-square overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                                <img
                                  src={file.url}
                                  alt={file.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                                  <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            ) : (
                              <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                                <FileText className="w-5 h-5 text-gray-400" />
                              </div>
                            )}
                            <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 truncate">
                              {file.name}
                            </p>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default ComplaintDetailsPage;
