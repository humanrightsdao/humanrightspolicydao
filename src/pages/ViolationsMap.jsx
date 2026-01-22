// src/pages/ViolationsMap.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Filter,
  Globe,
  Calendar,
  User,
  Search,
  X,
  AlertCircle,
  RefreshCw,
  Eye,
  ChevronDown,
  Flag,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import useUserInfo from "../hooks/useUserInfo";
import {
  countryViewConfigs,
  worldView,
  defaultCountryView,
} from "../utils/mapConfig";
import { useCountry } from "../hooks/useCountry";
import CreatePostModal from "../components/CreatePostModal"; // Added import

// Leaflet import for map
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const ViolationsMap = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(
    localStorage.getItem("i18nextLng") || "uk",
  );

  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ADDED: State for create post modal
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // Filters
  const [countryFilter, setCountryFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [offenderFilter, setOffenderFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Map
  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);

  // Statistics
  const [stats, setStats] = useState({
    total: 0,
    countries: 0,
    lastUpdated: null,
  });

  // Load violations
  const loadViolations = useCallback(async () => {
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
        .eq("status", "published") // Only published complaints
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (fetchError) throw fetchError;

      // Filter only valid coordinates
      const validViolations = data.filter(
        (v) =>
          v.latitude &&
          v.longitude &&
          !isNaN(parseFloat(v.latitude)) &&
          !isNaN(parseFloat(v.longitude)),
      );

      setViolations(validViolations);
      setFilteredViolations(validViolations);

      // Statistics
      const countries = new Set(validViolations.map((v) => v.country_code))
        .size;
      setStats({
        total: validViolations.length,
        countries,
        lastUpdated: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error loading violations:", err);
      setError(
        err.message || t("load_violations_error") || "Error loading violations",
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Initialize map
  const initMap = useCallback(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Determine initial centering
    let initialView = worldView;

    if (countryFilter !== "all") {
      const countryConfig = countryViewConfigs[countryFilter];
      if (countryConfig) {
        initialView = countryConfig;
      }
    } else if (userInfo?.country && userInfo.country !== "EARTH") {
      const userCountryConfig = countryViewConfigs[userInfo.country];
      if (userCountryConfig) {
        initialView = userCountryConfig;
      }
    }

    // Create map
    mapRef.current = L.map(mapContainerRef.current, {
      center: initialView.center,
      zoom: initialView.zoom,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      worldCopyJump: false, // Prevent jumping between world copies
    });

    // Add OpenStreetMap tiles with noWrap: true
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true, // Prevent map repetition horizontally
    }).addTo(mapRef.current);

    // Add zoom control
    L.control
      .zoom({
        position: "bottomright",
      })
      .addTo(mapRef.current);

    // Limit map panning area
    const southWest = L.latLng(-90, -180);
    const northEast = L.latLng(90, 180);
    const bounds = L.latLngBounds(southWest, northEast);
    mapRef.current.setMaxBounds(bounds);
    mapRef.current.on("drag", function () {
      mapRef.current.panInsideBounds(bounds, { animate: false });
    });
  }, [countryFilter, userInfo]);

  // Update map markers
  const updateMapMarkers = useCallback(() => {
    if (!mapRef.current || !filteredViolations.length) return;

    // Remove old markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    // Create new markers
    filteredViolations.forEach((violation) => {
      if (!violation.latitude || !violation.longitude) return;

      // Determine marker color based on priority (adapted for three variants)
      let markerColor = "#eab308"; // yellow by default (normal_priority)

      if (violation.priority === "critical_priority") {
        markerColor = "#dc2626"; // dark red
      } else if (violation.priority === "high_priority") {
        markerColor = "#f97316"; // orange
      } else if (violation.priority === "normal_priority") {
        markerColor = "#eab308"; // yellow
      }

      // Create icon with priority color
      const icon = L.divIcon({
        html: `
          <div class="relative group">
            <div class="w-6 h-6 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="${markerColor}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${
                violation.priority === "critical_priority"
                  ? `
                <div class="absolute -top-1 -right-1 w-4 h-4 bg-red-600 border-2 border-white rounded-full flex items-center justify-center">
                  <span class="text-xs font-bold text-white">!</span>
                </div>
              `
                  : ""
              }
            </div>
          </div>
        `,
        className: "violation-marker",
        iconSize: [24, 24],
        iconAnchor: [12, 24],
      });

      const marker = L.marker(
        [parseFloat(violation.latitude), parseFloat(violation.longitude)],
        {
          icon,
        },
      ).addTo(mapRef.current);

      // Popup with information
      const popupContent = `
        <div class="p-2 min-w-[250px]">
          <h3 class="font-bold text-gray-900 mb-1 truncate">${violation.title}</h3>
          <div class="space-y-1 text-sm text-gray-600">
            ${violation.offender_name ? `<p><strong>${t("offender") || "Offender"}:</strong> ${violation.offender_name}</p>` : ""}
            ${violation.violation_date ? `<p><strong>${t("date") || "Date"}:</strong> ${new Date(violation.violation_date).toLocaleDateString()}</p>` : ""}
            <p><strong>${t("country") || "Country"}:</strong> ${getTranslatedCountryName(violation.country_code)}</p>
          </div>
          <button
            id="view-details-${violation.id}"
            class="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            ${t("view_details") || "View details"}
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);

      // Add click handler after popup is added to DOM
      marker.on("popupopen", () => {
        setTimeout(() => {
          const button = document.getElementById(
            `view-details-${violation.id}`,
          );
          if (button) {
            button.addEventListener("click", () => {
              // Use correct path to complaint details
              navigate(`/complaints/${violation.id}`);
            });
          }
        }, 100);
      });
    });

    // Center map on markers
    if (filteredViolations.length > 0) {
      const bounds = L.latLngBounds(
        filteredViolations.map((v) => [
          parseFloat(v.latitude),
          parseFloat(v.longitude),
        ]),
      );

      // If only one marker - center on it with close zoom
      if (filteredViolations.length === 1) {
        const violation = filteredViolations[0];
        mapRef.current.setView(
          [parseFloat(violation.latitude), parseFloat(violation.longitude)],
          12,
        );
      } else {
        // If multiple markers - show all
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [filteredViolations, t, getTranslatedCountryName, navigate]);

  // Filter violations
  const applyFilters = useCallback(() => {
    let filtered = [...violations];

    // Country filter
    if (countryFilter && countryFilter !== "all") {
      filtered = filtered.filter((v) => v.country_code === countryFilter);
    }

    // Offender name filter
    if (offenderFilter.trim()) {
      const searchTerm = offenderFilter.toLowerCase();
      filtered = filtered.filter(
        (v) =>
          v.offender_name && v.offender_name.toLowerCase().includes(searchTerm),
      );
    }

    // Date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((v) => {
        if (!v.violation_date) return false;

        const violationDate = new Date(v.violation_date);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;

        // Validation: date cannot be in the future
        if (violationDate > new Date()) return false;

        let valid = true;
        if (fromDate) valid = valid && violationDate >= fromDate;
        if (toDate) valid = valid && violationDate <= toDate;

        return valid;
      });
    }

    setFilteredViolations(filtered);

    // Update statistics
    const countries = new Set(filtered.map((v) => v.country_code)).size;
    setStats((prev) => ({
      ...prev,
      total: filtered.length,
      countries,
    }));
  }, [violations, countryFilter, dateFrom, dateTo, offenderFilter]);

  // Reset filters
  const resetFilters = () => {
    setCountryFilter("all");
    setDateFrom("");
    setDateTo("");
    setOffenderFilter("");
    setFilteredViolations(violations);

    setStats({
      total: violations.length,
      countries: new Set(violations.map((v) => v.country_code)).size,
      lastUpdated: new Date().toISOString(),
    });

    // Return map to world view
    if (mapRef.current) {
      mapRef.current.setView(worldView.center, worldView.zoom);
    }
  };

  // Initialization on first render
  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  // Initialize map after data loading
  useEffect(() => {
    if (!loading && !error && !mapRef.current) {
      initMap();
    }
  }, [loading, error, initMap]);

  // Update markers when filters or data change
  useEffect(() => {
    if (mapRef.current && filteredViolations.length > 0) {
      updateMapMarkers();
    }
  }, [filteredViolations, updateMapMarkers]);

  // Apply filters when they change
  useEffect(() => {
    if (violations.length > 0) {
      applyFilters();
    }
  }, [
    countryFilter,
    dateFrom,
    dateTo,
    offenderFilter,
    violations,
    applyFilters,
  ]);

  // Get unique countries for filter
  const uniqueCountries = [...new Set(violations.map((v) => v.country_code))]
    .filter((code) => code && code.length === 2)
    .sort();

  if (userLoading) {
    return (
      <Layout
        userProfile={userInfo}
        onLogout={() => {}}
        loading={true}
        onCreatePost={() => setShowCreatePostModal(true)} // ADDED
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
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
      onCreatePost={() => setShowCreatePostModal(true)} // ADDED
    >
      {/* ADDED: Create post modal window */}
      {showCreatePostModal && userInfo && (
        <div className="h-full">
          <CreatePostModal
            onClose={() => setShowCreatePostModal(false)}
            userCountry={userInfo?.country || "EARTH"}
          />
        </div>
      )}

      {/* Main page - only displayed if create post modal is not open */}
      {!showCreatePostModal && (
        <div>
          {/* Header and statistics */}
          <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="max-w-7xl mx-auto px-3 py-3">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                    {t("violations_map") || "Human Rights Violations Map"}
                  </h1>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {t("map_description") ||
                      "Interactive map of human rights violations worldwide"}
                  </p>
                </div>

                {/* Statistics - compact style */}
                <div className="flex flex-wrap gap-3">
                  <div className="text-center">
                    <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {stats.total}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("total_violations") || "Violations"}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600 dark:text-green-400">
                      {stats.countries}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("countries") || "Countries"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div>
            <div className="flex flex-col gap-4">
              {/* Side panel with filters */}
              <div className="space-y-2">
                {/* Filters button for mobile */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden w-full flex items-center justify-between p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    <span className="font-medium text-sm">
                      {t("filters") || "Filters"}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Filters panel */}
                <div
                  className={`
                  ${showFilters ? "block" : "hidden"}
                  lg:block space-y-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg
                `}
                >
                  {/* Country and dates on one line */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {/* Country filter */}
                    <div>
                      <select
                        value={countryFilter}
                        onChange={(e) => setCountryFilter(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="all">
                          {t("all_countries") || "All countries"}
                        </option>
                        {uniqueCountries.map((code) => (
                          <option key={code} value={code}>
                            {getTranslatedCountryName(code)} ({code})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Date filter */}
                    <div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => setDateFrom(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder={t("from_date") || "From"}
                          />
                        </div>
                        <div>
                          <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => setDateTo(e.target.value)}
                            max={new Date().toISOString().split("T")[0]}
                            className="w-full p-2 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            placeholder={t("to_date") || "To"}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Offender filter */}
                  <div>
                    <div className="relative">
                      <input
                        type="text"
                        value={offenderFilter}
                        onChange={(e) => setOffenderFilter(e.target.value)}
                        className="w-full p-2 pl-9 text-sm border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder={
                          t("search_offender") || "Search offender..."
                        }
                      />
                      <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                      {offenderFilter && (
                        <button
                          onClick={() => setOffenderFilter("")}
                          className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between mt-2">
                      <button
                        onClick={resetFilters}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        {t("reset") || "Reset"}
                      </button>
                    </div>
                  </div>

                  {/* Apply button */}
                  <button
                    onClick={() => setShowFilters(false)}
                    className="lg:hidden w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                  >
                    {t("apply_filters") || "Apply filters"}
                  </button>
                </div>
              </div>

              {/* Main block with map */}
              <div className="flex-1">
                {/* Map container */}
                <div className="relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  {error && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800">
                        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                          {error}
                        </p>
                        <button
                          onClick={loadViolations}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
                        >
                          {t("try_again") || "Try again"}
                        </button>
                      </div>
                    </div>
                  )}

                  {loading && (
                    <div className="absolute inset-0 z-40 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {t("loading_map") || "Loading map..."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Map */}
                  <div
                    ref={mapContainerRef}
                    className="h-[600px] w-full rounded-lg z-10"
                  />

                  {/* Violations counter on map */}
                  {filteredViolations.length > 0 && (
                    <div className="absolute bottom-3 left-3 z-20">
                      <div className="px-3 py-1.5 bg-white/90 dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow">
                        <p className="text-xs font-medium text-gray-900 dark:text-white">
                          {filteredViolations.length}{" "}
                          {t("violations_on_map") || "violations on map"}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="mt-3 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    {t("legend") || "Legend"}
                  </h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="#dc2626"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("critical_priority") || "Critical priority"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="#f97316"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("high_priority") || "High priority"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        className="w-4 h-4"
                        viewBox="0 0 24 24"
                        fill="#eab308"
                      >
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                      </svg>
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {t("normal_priority") || "Normal priority"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ViolationsMap;
