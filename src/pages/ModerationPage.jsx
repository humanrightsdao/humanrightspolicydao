// src/pages/ModerationPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  Shield,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Filter,
  Search,
  BarChart3,
  FileText,
  Loader,
  Download,
  RefreshCw,
  ShieldCheck,
  MapPin,
  ExternalLink,
  User,
  Lock,
  Globe,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry";

const ModerationPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUserInfo();
  const { getAllCountries, getTranslatedCountryName } = useCountry(
    localStorage.getItem("i18nextLng") || "en",
  );

  // Complaint states
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    published: 0,
    hidden: 0,
    byPriority: {},
  });

  // Filter states
  const [filters, setFilters] = useState({
    status: "pending",
    country: "all",
    priority: "all",
    searchQuery: "",
  });

  // Moderation states
  const [moderatingId, setModeratingId] = useState(null);
  const [moderationNote, setModerationNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState("normal_priority");

  // UI states
  const [expandedAddressId, setExpandedAddressId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Check moderator permissions
  useEffect(() => {
    if (
      userInfo &&
      !(userInfo.role === "moderator" || userInfo.role === "admin")
    ) {
      navigate("/complaints-list");
    }
  }, [userInfo, navigate]);

  // Load complaints
  const loadComplaints = useCallback(async () => {
    if (!userInfo) return;

    setLoading(true);
    setError("");

    try {
      let query = supabase.from("complaints").select(
        `
          *,
          users:user_id (
            id,
            unique_name,
            email,
            avatar_url,
            country
          )
        `,
        { count: "exact" },
      );

      if (filters.status !== "all") {
        query = query.eq("status", filters.status);
      }

      if (filters.country !== "all") {
        query = query.eq("country_code", filters.country);
      }

      if (filters.priority !== "all") {
        query = query.eq("priority", filters.priority);
      }

      if (filters.searchQuery) {
        query = query.or(
          `title.ilike.%${filters.searchQuery}%,violation_description.ilike.%${filters.searchQuery}%,address.ilike.%${filters.searchQuery}%,offender_name.ilike.%${filters.searchQuery}%,affected_persons_info.ilike.%${filters.searchQuery}%`,
        );
      }

      query = query.order("created_at", { ascending: false });

      const { data, error: fetchError } = await query;

      if (fetchError) {
        throw fetchError;
      }

      setComplaints(data || []);
      setExpandedAddressId(null);
    } catch (err) {
      console.error("Error loading complaints:", err);
      setError(
        err.message ||
          t("load_complaints_error_mod") ||
          "Error loading complaints for moderation",
      );
    } finally {
      setLoading(false);
    }
  }, [filters, userInfo, t]);

  // Load statistics
  const loadStatistics = useCallback(async () => {
    if (!userInfo) return;

    try {
      const { data: statusData } = await supabase
        .from("complaints")
        .select("status, priority");

      if (statusData) {
        setStats({
          total: statusData.length,
          pending: statusData.filter((c) => c.status === "pending").length,
          published: statusData.filter((c) => c.status === "published").length,
          hidden: statusData.filter((c) => c.status === "hidden").length,
          byPriority: {
            critical_priority: statusData.filter(
              (c) => c.priority === "critical_priority",
            ).length,
            high_priority: statusData.filter(
              (c) => c.priority === "high_priority",
            ).length,
            normal_priority: statusData.filter(
              (c) => c.priority === "normal_priority",
            ).length,
          },
        });
      }
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  }, [userInfo]);

  // Load data
  useEffect(() => {
    if (userInfo) {
      loadComplaints();
      loadStatistics();
    }
  }, [userInfo, loadComplaints, loadStatistics]);

  // Moderate complaint
  const moderateComplaint = async (complaintId, action) => {
    if (!userInfo || !complaintId) return;

    setIsSubmitting(true);
    setError("");

    try {
      const updates = {
        status: action,
        reviewed_at: new Date().toISOString(),
        assigned_moderator_id: userInfo.id,
      };

      if (action === "published") {
        updates.priority = selectedPriority;
      }

      if (moderationNote.trim()) {
        updates.moderator_note = moderationNote;
      }

      const { error: updateError } = await supabase
        .from("complaints")
        .update(updates)
        .eq("id", complaintId);

      if (updateError) throw updateError;

      // FULLY RELOAD DATA INSTEAD OF LOCAL UPDATE
      await loadComplaints();
      await loadStatistics();

      setModeratingId(null);
      setModerationNote("");
      setSelectedPriority("normal_priority");

      alert(
        t("moderation.success_message", {
          action:
            action === "published"
              ? t("moderation.published")
              : t("moderation.hidden"),
        }) ||
          `Complaint successfully ${action === "published" ? "published" : "hidden"}!`,
      );
    } catch (err) {
      console.error("Error moderating complaint:", err);
      setError(
        err.message || t("moderation.error") || "Error moderating complaint",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy ID to clipboard
  const copyIdToClipboard = async (id) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy ID:", err);
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <Clock className="w-3 h-3 text-yellow-600" />;
      case "published":
        return <Eye className="w-3 h-3 text-green-600" />;
      case "hidden":
        return <EyeOff className="w-3 h-3 text-gray-600" />;
      default:
        return <AlertCircle className="w-3 h-3 text-gray-600" />;
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return t("unknown_date") || "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString(localStorage.getItem("i18nextLng") || "en", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get priority text
  const getPriorityText = (priority) => {
    switch (priority) {
      case "critical_priority":
        return t("priority_critical") || "Critical";
      case "high_priority":
        return t("priority_high") || "High";
      case "normal_priority":
        return t("priority_medium") || "Medium";
      default:
        return t("priority_medium") || "Medium";
    }
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "critical_priority":
        return "text-red-700 bg-red-100 dark:bg-gray-900/30";
      case "high_priority":
        return "text-orange-700 bg-orange-100 dark:bg-red-900/30";
      case "normal_priority":
        return "text-yellow-700 bg-yellow-100 dark:bg-orange-900/30";
      default:
        return "text-gray-700 bg-gray-100 dark:bg-gray-900/30";
    }
  };

  // Export statistics
  const exportStatistics = () => {
    const csvContent = "data:text/csv;charset=utf-8,";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      t("moderation.export_filename") || "statistics.csv",
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (userLoading) {
    return (
      <Layout
        userProfile={userInfo}
        onLogout={() => {}}
        loading={true}
        onCreatePost={() => {}}
      >
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
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
      onCreatePost={() => {}}
    >
      <div className="max-w-7xl mx-auto py-4 px-3">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-blue-900" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("moderation_panel") || "Moderation Panel"}
            </h1>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {t("moderation.description") ||
              "Moderation of complaints and human rights violations statistics"}
          </p>
        </div>

        {/* Statistics */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {t("moderation.statistics") || "Statistics"}
              </h3>
            </div>
            <button
              onClick={exportStatistics}
              className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              {t("moderation.export") || "Export"}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    {t("moderation.total") || "Total"}
                  </p>
                  <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                    {stats.total}
                  </p>
                </div>
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    {t("moderation.pending") || "Pending"}
                  </p>
                  <p className="text-lg font-bold text-yellow-900 dark:text-yellow-100">
                    {stats.pending}
                  </p>
                </div>
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-800 dark:text-green-300">
                    {t("moderation.published") || "Published"}
                  </p>
                  <p className="text-lg font-bold text-green-900 dark:text-green-100">
                    {stats.published}
                  </p>
                </div>
                <Eye className="w-5 h-5 text-green-600" />
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900/20 p-2 rounded">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-800 dark:text-gray-300">
                    {t("moderation.hidden") || "Hidden"}
                  </p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                    {stats.hidden}
                  </p>
                </div>
                <EyeOff className="w-5 h-5 text-gray-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-4 bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-1.5 mb-3">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("filters") || "Filters"}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t("moderation.status") || "Status"}
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
              >
                <option value="all">{t("all") || "All"}</option>
                <option value="pending">
                  {t("moderation.status_pending") || "Pending"}
                </option>
                <option value="published">
                  {t("moderation.status_published") || "Published"}
                </option>
                <option value="hidden">
                  {t("moderation.status_hidden") || "Hidden"}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t("country") || "Country"}
              </label>
              <select
                value={filters.country}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, country: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
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

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t("moderation.priority") || "Priority"}
              </label>
              <select
                value={filters.priority}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, priority: e.target.value }))
                }
                className="w-full px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
              >
                <option value="all">
                  {t("all_priorities") || "All priorities"}
                </option>
                <option value="normal_priority">
                  {t("priority_medium") || "Medium"}
                </option>
                <option value="high_priority">
                  {t("priority_high") || "High"}
                </option>
                <option value="critical_priority">
                  {t("priority_critical") || "Critical"}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                {t("search") || "Search"}
              </label>
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
                    t("moderation.search_placeholder") || "Search complaints..."
                  }
                  className="w-full pl-9 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
            <p className="text-xs text-red-900 dark:text-red-100">{error}</p>
          </div>
        )}

        {/* Complaints list */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              {t("moderation.complaints_list", { count: complaints.length }) ||
                `Complaints (${complaints.length})`}
            </h3>
            <button
              onClick={loadComplaints}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
              />
              {t("moderation.refresh") || "Refresh"}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          ) : complaints.length === 0 ? (
            <div className="text-center py-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t("moderation.no_complaints") ||
                  "No complaints for moderation"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {complaints.map((complaint) => (
                <div
                  key={complaint.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Left side - information */}
                      <div className="flex-1 min-w-0">
                        {/* Title and statuses */}
                        <div className="flex flex-wrap items-start gap-2 mb-3">
                          <h3 className="text-base font-semibold text-gray-900 dark:text-white break-words flex-1">
                            {complaint.title}
                          </h3>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(complaint.status)}
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {complaint.status === "pending"
                                  ? t("moderation.status_pending") || "Pending"
                                  : complaint.status === "published"
                                    ? t("moderation.status_published") ||
                                      "Published"
                                    : t("moderation.status_hidden") || "Hidden"}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPriorityColor(
                                complaint.priority,
                              )}`}
                            >
                              {getPriorityText(complaint.priority)}
                            </span>
                          </div>
                        </div>

                        {/* Meta information */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 dark:text-gray-400 mb-3">
                          <div className="flex items-center gap-1.5">
                            <Globe className="w-3 h-3 flex-shrink-0" />
                            <span>
                              {getTranslatedCountryName(complaint.country_code)}
                            </span>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <div
                                className={`cursor-pointer hover:text-gray-900 dark:hover:text-white ${expandedAddressId === complaint.id ? "" : "truncate"}`}
                                onClick={() =>
                                  setExpandedAddressId(
                                    expandedAddressId === complaint.id
                                      ? null
                                      : complaint.id,
                                  )
                                }
                              >
                                {complaint.address}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 flex-shrink-0" />
                            <span>{formatDate(complaint.created_at)}</span>
                          </div>
                          {!complaint.is_anonymous && complaint.users ? (
                            <div className="flex items-center gap-1.5">
                              <User className="w-3 h-3 flex-shrink-0" />
                              <span>{complaint.users.unique_name}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <Lock className="w-3 h-3 flex-shrink-0" />
                              <span>{t("anonymous") || "Anonymous"}</span>
                            </div>
                          )}
                        </div>

                        {/* Complaint ID with copy */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            ID:
                          </span>
                          <code className="text-xs font-mono text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded truncate flex-1">
                            {complaint.id}
                          </code>
                          <button
                            onClick={() => copyIdToClipboard(complaint.id)}
                            className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            title={t("moderation.copy_id") || "Copy ID"}
                          >
                            {copiedId === complaint.id ? (
                              <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>

                        {/* Violation description */}
                        <div className="mb-3">
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                            {t("violation_description") ||
                              "Violation Description"}
                            :
                          </h4>
                          <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">
                              {complaint.violation_description}
                            </p>
                          </div>
                        </div>

                        {/* Additional fields */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                          {complaint.offender_name && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                                {t("offender_name") || "Offender"}:
                              </h4>
                              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                                  {complaint.offender_name}
                                </p>
                              </div>
                            </div>
                          )}
                          {complaint.affected_persons_info && (
                            <div>
                              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-1">
                                {t("affected_persons") || "Affected Persons"}:
                              </h4>
                              <div className="bg-gray-50 dark:bg-gray-900/50 p-2 rounded">
                                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">
                                  {complaint.affected_persons_info}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Evidence */}
                        {complaint.evidence_files &&
                          complaint.evidence_files.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                                {t("evidence_files") || "Evidence Files"} (
                                {complaint.evidence_files.length}):
                              </h4>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                {complaint.evidence_files.map((file, index) => (
                                  <a
                                    key={index}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="relative group"
                                  >
                                    {file.type.startsWith("image/") ? (
                                      <div className="aspect-square overflow-hidden rounded border border-gray-200 dark:border-gray-700">
                                        <img
                                          src={file.url}
                                          alt={file.name}
                                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                                          <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="aspect-square bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
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

                      {/* Right side - moderation */}
                      <div className="lg:w-64 flex-shrink-0">
                        <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
                          <h4 className="text-xs font-medium text-gray-900 dark:text-white mb-2">
                            {t("moderation.actions") || "Moderator Actions"}
                          </h4>

                          {moderatingId === complaint.id ? (
                            <div className="space-y-2">
                              <select
                                value={selectedPriority}
                                onChange={(e) =>
                                  setSelectedPriority(e.target.value)
                                }
                                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-900 dark:text-white"
                              >
                                <option value="critical_priority">
                                  {t("priority_critical") || "Critical"}
                                </option>
                                <option value="high_priority">
                                  {t("priority_high") || "High"}
                                </option>
                                <option value="normal_priority">
                                  {t("priority_medium") || "Medium"}
                                </option>
                              </select>

                              <textarea
                                value={moderationNote}
                                onChange={(e) =>
                                  setModerationNote(e.target.value)
                                }
                                placeholder={
                                  t("moderation.note_placeholder") || "Note..."
                                }
                                rows={2}
                                className="w-full px-2 py-1.5 text-xs bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-gray-900 dark:text-white resize-none"
                              />

                              <div className="flex gap-1.5">
                                <button
                                  onClick={() =>
                                    moderateComplaint(complaint.id, "published")
                                  }
                                  disabled={isSubmitting}
                                  className="flex-1 px-3 py-1.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 flex items-center justify-center gap-1"
                                >
                                  <ShieldCheck className="w-3 h-3" />
                                  {t("moderation.publish") || "Publish"}
                                </button>
                                <button
                                  onClick={() => {
                                    setModeratingId(null);
                                    setModerationNote("");
                                  }}
                                  className="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-white text-xs rounded hover:bg-gray-300 dark:hover:bg-gray-500"
                                >
                                  {t("cancel") || "Cancel"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <button
                                onClick={() => {
                                  setModeratingId(complaint.id);
                                  setModerationNote("");
                                }}
                                className="w-full px-3 py-2 bg-blue-900 text-white text-xs rounded hover:bg-blue-800 flex items-center justify-center gap-1.5"
                              >
                                <Shield className="w-3.5 h-3.5" />
                                {t("moderation.moderate") || "Moderate"}
                              </button>

                              <div className="grid grid-cols-2 gap-1.5">
                                <button
                                  onClick={() => {
                                    setSelectedPriority("normal_priority");
                                    moderateComplaint(
                                      complaint.id,
                                      "published",
                                    );
                                  }}
                                  className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                                >
                                  {t("moderation.publish") || "Publish"}
                                </button>
                                <button
                                  onClick={() =>
                                    moderateComplaint(complaint.id, "hidden")
                                  }
                                  className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700"
                                >
                                  {t("moderation.hide") || "Hide"}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Statistics */}
                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <div className="flex justify-between">
                            <span>{t("moderation.views") || "Views"}:</span>
                            <span>{complaint.views || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{t("moderation.upvotes") || "Upvotes"}:</span>
                            <span>{complaint.upvotes || 0}</span>
                          </div>
                          {complaint.reviewed_at && (
                            <div className="pt-1 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex justify-between">
                                <span>
                                  {t("moderation.reviewed_at") || "Reviewed"}:
                                </span>
                                <span>{formatDate(complaint.reviewed_at)}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ModerationPage;
