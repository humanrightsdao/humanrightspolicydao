// src/pages/ComplaintsListPage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Calendar,
  Eye,
  FileText,
  Filter,
  Search,
  Plus,
  Loader,
  AlertCircle,
  CheckCircle,
  Shield,
  Globe,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry";
import CreatePostModal from "../components/CreatePostModal";

const ComplaintsListPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUserInfo();
  const { getAllCountries, getTranslatedCountryName } = useCountry(
    localStorage.getItem("i18nextLng") || "en",
  );

  // State for complaints
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ADDED: State for create post modal
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // State for filtering
  const [filters, setFilters] = useState({
    country: "all",
    priority: "all",
    searchQuery: "",
    showMyComplaints: false,
  });

  // State for sorting
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState("desc");

  // State for pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // State for moderator check
  const [isModerator, setIsModerator] = useState(false);

  // Load complaints
  const loadComplaints = async () => {
    setLoading(true);
    setError("");

    try {
      let query = supabase.from("complaints").select(
        `
          *,
          users:user_id (
            id,
            unique_name,
            avatar_url
          )
        `,
        { count: "exact" },
      );

      // Show only published complaints for regular users
      query = query.eq("status", "published");

      // Filter by country
      if (filters.country !== "all") {
        query = query.eq("country_code", filters.country);
      }

      // Filter by priority (adapted for three options)
      if (filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      // Filter "My Complaints"
      if (filters.showMyComplaints && userInfo) {
        query = query.eq("user_id", userInfo.id);
      }

      // Search
      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,violation_description.ilike.%${filters.searchQuery}%,address.ilike.%${filters.searchQuery}%`,
        );
      }

      // Sorting
      query = query.order(sortBy, { ascending: sortOrder === "asc" });

      // Pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error: fetchError, count } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setComplaints(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (err) {
      console.error("Error loading complaints:", err);
      setError(
        err.message || t("load_complaints_error") || "Error loading complaints",
      );
    } finally {
      setLoading(false);
    }
  };

  // Check user role
  useEffect(() => {
    if (userInfo) {
      setIsModerator(
        userInfo.role === "moderator" || userInfo.role === "admin",
      );
    }
  }, [userInfo]);

  // Reload when filters change
  useEffect(() => {
    if (userInfo || !filters.showMyComplaints) {
      loadComplaints();
    }
  }, [filters, sortBy, sortOrder, currentPage, userInfo, isModerator]);

  // Increment views
  const incrementViews = async (complaintId) => {
    try {
      const complaint = complaints.find((c) => c.id === complaintId);
      if (!complaint) return;

      const { error } = await supabase
        .from("complaints")
        .update({ views: (complaint.views || 0) + 1 })
        .eq("id", complaintId);

      if (error) throw error;

      setComplaints((prev) =>
        prev.map((c) =>
          c.id === complaintId ? { ...c, views: (c.views || 0) + 1 } : c,
        ),
      );
    } catch (err) {
      console.error("Error incrementing views:", err);
    }
  };

  // Navigate to complaint details page
  const handleViewDetails = (complaintId) => {
    incrementViews(complaintId);
    navigate(`/complaints/${complaintId}`);
  };

  // Get priority color (adapted for three options)
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical_priority":
        return "text-gray-900 bg-red-100 dark:bg-gray-900/20 bg-white-100";
      case "high_priority":
        return "text-red-900 bg-orange-100 dark:bg-red-900/20";
      case "medium":
      case "normal_priority":
        return "text-orange-900 bg-yellow-100 dark:bg-orange-900/20";
      default:
        return "text-gray-600 bg-gray-100 dark:bg-gray-900/20";
    }
  };

  // Get priority text using translation keys
  const getPriorityText = (priority) => {
    switch (priority) {
      case "critical_priority":
        return t("critical_priority") || "Critical";
      case "high_priority":
        return t("high_priority") || "High";
      case "medium":
      case "normal_priority":
        return t("normal_priority") || "Normal";
      default:
        return t("normal_priority") || "Normal";
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

  if (userLoading) {
    return (
      <Layout
        userProfile={userInfo}
        onLogout={() => {}}
        loading={true}
        onCreatePost={() => setShowCreatePostModal(true)}
      >
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
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
      {/* ADDED: Create post modal */}
      {showCreatePostModal && userInfo && (
        <div className="h-full">
          <CreatePostModal
            onClose={() => setShowCreatePostModal(false)}
            userCountry={userInfo?.country || "EARTH"}
          />
        </div>
      )}

      {/* Main page - displayed only if create post modal is not open */}
      {!showCreatePostModal && (
        <div>
          <div className="max-w-7xl mx-auto py-4 px-3">
            {/* Header */}
            <div className="mb-4">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                    {t("complaints_list") || "Complaints List"}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {t("complaints_list_description") ||
                      "All submitted human rights violation complaints"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  {isModerator && (
                    <button
                      onClick={() => navigate("/moderation")}
                      className="px-4 py-2 bg-purple-900 text-white text-sm rounded-full hover:bg-purple-800 transition-colors flex items-center gap-1.5 justify-center"
                    >
                      <Shield className="w-4 h-4" />
                      {t("moderation_panel") || "Moderation"}
                    </button>
                  )}
                  <button
                    onClick={() => navigate("/complaints")}
                    className="px-4 py-2 bg-blue-900 text-white text-sm rounded-full hover:bg-blue-800 transition-colors flex items-center gap-1.5 justify-center"
                  >
                    <Plus className="w-4 h-4" />
                    {t("submit_complaint") || "Submit Complaint"}
                  </button>
                </div>
              </div>
            </div>

            {/* Main content area */}
            <div>
              {/* Filters */}
              <div className="p-3 border border-gray-200 dark:border-gray-700 rounded-lg mb-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  {/* Search */}
                  <div className="lg:col-span-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={filters.searchQuery}
                        onChange={(e) =>
                          setFilters((prev) => ({
                            ...prev,
                            searchQuery: e.target.value,
                          }))
                        }
                        placeholder={
                          t("search_complaints") || "Search complaints..."
                        }
                        className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Country */}
                  <div>
                    <select
                      value={filters.country}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">
                        {t("all_countries") || "All countries"}
                      </option>
                      {getAllCountries().map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Priority (adapted for three options) */}
                  <div>
                    <select
                      value={filters.priority}
                      onChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          priority: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="all">
                        {t("all_priorities") || "All priorities"}
                      </option>
                      <option value="critical_priority">
                        {t("critical_priority") || "Critical"}
                      </option>
                      <option value="high_priority">
                        {t("high_priority") || "High"}
                      </option>
                      <option value="normal_priority">
                        {t("normal_priority") || "Normal"}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div>
                {/* Error message */}
                {error && (
                  <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    <p className="text-xs text-red-900 dark:text-red-100">
                      {error}
                    </p>
                  </div>
                )}

                {/* Complaints list */}
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader className="w-6 h-6 animate-spin text-blue-600" />
                  </div>
                ) : complaints.length === 0 ? (
                  <div className="text-center py-6 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                    {filters.showMyComplaints ? (
                      <>
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {t("no_my_complaints") ||
                            "You haven't submitted any complaints yet"}
                        </p>
                        <button
                          onClick={() => navigate("/complaints")}
                          className="px-4 py-1.5 bg-blue-900 text-white text-sm rounded hover:bg-blue-800 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t("submit_first_complaint") ||
                            "Submit First Complaint"}
                        </button>
                      </>
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {t("no_published_complaints") ||
                            "No published complaints yet"}
                        </p>
                        <button
                          onClick={() => navigate("/complaints")}
                          className="px-4 py-1.5 bg-blue-900 text-white text-sm rounded hover:bg-blue-800 transition-colors inline-flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          {t("submit_first_complaint") ||
                            "Submit First Complaint"}
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {complaints.map((complaint) => (
                      <div
                        key={complaint.id}
                        className="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-sm transition-shadow"
                      >
                        {/* Complaint header */}
                        <div className="p-3">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              {/* Title and priority */}
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                                  {complaint.title}
                                </h3>
                                <span
                                  className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(
                                    complaint.priority,
                                  )}`}
                                >
                                  {getPriorityText(complaint.priority)}
                                </span>
                              </div>

                              {/* Meta information */}
                              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400 mb-2">
                                <div className="flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  <span>
                                    {getTranslatedCountryName(
                                      complaint.country_code,
                                    )}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span className="truncate max-w-xs">
                                    {complaint.address}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>
                                    {formatDate(complaint.created_at)}
                                  </span>
                                </div>
                              </div>

                              {/* Views statistics */}
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                <Eye className="w-3 h-3" />
                                <span>
                                  {complaint.views || 0} {t("views") || "views"}
                                </span>
                              </div>

                              {/* Short description */}
                              {complaint.violation_description && (
                                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                  {complaint.violation_description.substring(
                                    0,
                                    150,
                                  )}
                                  {complaint.violation_description.length >
                                    150 && "..."}
                                </p>
                              )}
                            </div>

                            {/* View details button */}
                            <div className="flex-shrink-0 mt-2 md:mt-0">
                              <button
                                onClick={() => handleViewDetails(complaint.id)}
                                className="w-full md:w-auto px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center gap-1.5"
                              >
                                <span className="font-medium">
                                  {t("view_details") || "Details"}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-center items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(1, prev - 1))
                          }
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {t("previous") || "Previous"}
                        </button>

                        <div className="flex items-center gap-1">
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              return (
                                <button
                                  key={i}
                                  onClick={() => setCurrentPage(pageNum)}
                                  className={`w-8 h-8 text-sm rounded ${
                                    currentPage === pageNum
                                      ? "bg-blue-900 text-white"
                                      : "bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                                  } transition-colors`}
                                >
                                  {pageNum}
                                </button>
                              );
                            },
                          )}
                        </div>

                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1),
                            )
                          }
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          {t("next") || "Next"}
                        </button>
                      </div>

                      {/* Count information */}
                      {complaints.length > 0 && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {t("showing") || "Showing"}{" "}
                          {(currentPage - 1) * itemsPerPage + 1} -{" "}
                          {Math.min(
                            currentPage * itemsPerPage,
                            complaints.length,
                          )}{" "}
                          {t("of") || "of"} {complaints.length}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ComplaintsListPage;
