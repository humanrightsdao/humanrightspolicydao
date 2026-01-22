// src/pages/CountryPage.jsx
import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Globe,
  MapPin,
  Plus,
  Star,
  Users,
  TrendingUp,
  Shield,
  MessageSquare,
  Scale,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Minimize2,
  Maximize2,
  Map,
} from "lucide-react";
import Layout from "../components/Layout";
import { useCountry } from "../hooks/useCountry";
import CountryFeed from "../components/CountryFeed";
import useUserInfo from "../hooks/useUserInfo";
import CreatePostModal from "../components/CreatePostModal";
import useCountryRatings from "../hooks/useCountryRatings";

// Import Leaflet for map
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// ✅ IMPORTANT: Import map configurations from a separate file
import {
  countryViewConfigs,
  worldView,
  defaultCountryView,
} from "../utils/mapConfig";

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

export default function CountryPage() {
  const { t, i18n } = useTranslation();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showRatings, setShowRatings] = useState(false); // New: control rating display
  const [showFeedHeader, setShowFeedHeader] = useState(false); // New: control feed header
  const [isMapCollapsed, setIsMapCollapsed] = useState(false); // New: collapse/expand map
  const navigate = useNavigate();
  const { userInfo } = useUserInfo();

  const {
    getAllCountries,
    detectLocation,
    getTranslatedCountryName,
    autoDetectedCountry,
    loading: countryLoading,
    error: countryError,
    detectionStatus,
    resetDetection,
  } = useCountry(i18n.language);

  const {
    ratingsData,
    loading: ratingsLoading,
    error: ratingsError,
    getAverageRatings,
    resetRatings,
  } = useCountryRatings();

  // States for map
  const [violations, setViolations] = useState([]);
  const [filteredViolations, setFilteredViolations] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapError, setMapError] = useState("");

  const mapRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const mapCounterRef = useRef(null); // Ref for map counter
  const collapseButtonRef = useRef(null); // Ref for collapse button on map

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (selectedCountry && selectedCountry !== "EARTH") {
      getAverageRatings(selectedCountry);
    } else {
      resetRatings();
    }
  }, [selectedCountry]);

  // Load violations for map
  const loadViolations = useCallback(async () => {
    setMapLoading(true);
    setMapError("");

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
        .eq("status", "published")
        .not("latitude", "is", null)
        .not("longitude", "is", null);

      if (fetchError) throw fetchError;

      const validViolations = data.filter(
        (v) =>
          v.latitude &&
          v.longitude &&
          !isNaN(parseFloat(v.latitude)) &&
          !isNaN(parseFloat(v.longitude)),
      );

      setViolations(validViolations);
      setFilteredViolations(validViolations);
    } catch (err) {
      console.error("Error loading violations:", err);
      setMapError(
        err.message || t("load_violations_error") || "Error loading violations",
      );
    } finally {
      setMapLoading(false);
    }
  }, [t]);

  // ✅ CORRECTED map initialization function with proper centering
  const initMap = useCallback(() => {
    if (!mapContainerRef.current) return;

    // If map already exists, remove it before creating a new one
    if (mapRef.current) {
      console.log("🗺️ Removing existing map");
      mapRef.current.remove();
      mapRef.current = null;
    }

    // ✅ Determine initial centering based on selected country
    let initialView = worldView;

    if (
      selectedCountry &&
      selectedCountry !== "EARTH" &&
      selectedCountry !== ""
    ) {
      const countryConfig = countryViewConfigs[selectedCountry];
      if (countryConfig) {
        initialView = countryConfig;
        console.log(
          "🗺️ Centering map on country:",
          selectedCountry,
          initialView,
        );
      } else {
        console.warn("⚠️ No config found for country:", selectedCountry);
      }
    } else if (userInfo?.country && userInfo.country !== "EARTH") {
      const userCountryConfig = countryViewConfigs[userInfo.country];
      if (userCountryConfig) {
        initialView = userCountryConfig;
        console.log(
          "🗺️ Centering map on user country:",
          userInfo.country,
          initialView,
        );
      }
    }

    console.log("🗺️ Creating map with view:", initialView);

    // Create map
    mapRef.current = L.map(mapContainerRef.current, {
      center: initialView.center,
      zoom: initialView.zoom,
      zoomControl: false,
      scrollWheelZoom: true,
      dragging: true,
      worldCopyJump: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      noWrap: true,
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

    // Create custom control for map collapse button (top-left corner)
    const CollapseControl = L.Control.extend({
      onAdd: function (map) {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-collapse",
        );
        container.style.backgroundColor = "white";
        container.style.padding = "0";
        container.style.borderRadius = "50%";
        container.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
        container.style.cursor = "pointer";
        container.style.width = "36px";
        container.style.height = "36px";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.justifyContent = "center";
        container.style.margin = "10px";

        const button = L.DomUtil.create(
          "button",
          "map-collapse-button",
          container,
        );
        button.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
          </svg>
        `;
        button.style.background = "none";
        button.style.border = "none";
        button.style.padding = "0";
        button.style.display = "flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.width = "100%";
        button.style.height = "100%";
        button.style.color = "#374151";

        button.onclick = (e) => {
          e.stopPropagation();
          setIsMapCollapsed(true);
        };

        button.onmouseenter = () => {
          container.style.backgroundColor = "#f3f4f6";
        };

        button.onmouseleave = () => {
          container.style.backgroundColor = "white";
        };

        collapseButtonRef.current = button;

        return container;
      },
    });

    // Create custom control for violations counter
    const CounterControl = L.Control.extend({
      onAdd: function (map) {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control leaflet-control-custom",
        );
        container.style.backgroundColor = "white";
        container.style.padding = "6px 10px";
        container.style.borderRadius = "4px";
        container.style.boxShadow = "0 1px 5px rgba(0,0,0,0.4)";
        container.style.cursor = "pointer";
        container.style.fontSize = "12px";
        container.style.fontWeight = "500";
        container.style.display = "flex";
        container.style.alignItems = "center";
        container.style.gap = "4px";

        const counterText = `${filteredViolations.length} ${t("violations_on_map") || "violations on map"}`;
        container.innerHTML = `
          <span style="color: #374151;">${counterText}</span>
          <svg style="width: 12px; height: 12px; color: #3b82f6;" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path>
          </svg>
        `;

        // Add click handler to navigate to map page
        container.onclick = () => {
          navigate("/violations-map");
        };

        container.onmouseenter = () => {
          container.style.backgroundColor = "#f3f4f6";
        };

        container.onmouseleave = () => {
          container.style.backgroundColor = "white";
        };

        // Store reference to element for updating
        mapCounterRef.current = container;

        return container;
      },
    });

    // Add controls to map
    new CollapseControl({ position: "topleft" }).addTo(mapRef.current);
    new CounterControl({ position: "topright" }).addTo(mapRef.current);
  }, [selectedCountry, userInfo, filteredViolations.length, t, navigate]);

  // Update markers on map
  const updateMapMarkers = useCallback(() => {
    if (!mapRef.current || !filteredViolations.length) {
      console.log("⚠️ Cannot update markers - map or violations missing");
      return;
    }

    console.log("📍 Updating markers, count:", filteredViolations.length);

    // Remove old markers
    markersRef.current.forEach((marker) => {
      marker.remove();
    });
    markersRef.current = [];

    // Create new markers
    filteredViolations.forEach((violation) => {
      if (!violation.latitude || !violation.longitude) return;

      let markerColor = "red";

      if (violation.priority === "critical") {
        markerColor = "#dc2626";
      } else if (violation.priority === "high") {
        markerColor = "#f97316";
      } else {
        markerColor = "#eab308";
      }

      const icon = L.divIcon({
        html: `
          <div class="relative group">
            <div class="w-6 h-6 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="${markerColor}">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              ${
                violation.priority === "critical"
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
        { icon },
      ).addTo(mapRef.current);

      const popupContent = `
        <div class="p-2 min-w-[250px]">
          <h3 class="font-bold text-gray-900 mb-1 truncate">${violation.title}</h3>
          <div class="space-y-1 text-sm text-gray-600">
            ${violation.offender_name ? `<p><strong>${t("offender") || "Offender"}:</strong> ${violation.offender_name}</p>` : ""}
            ${violation.violation_date ? `<p><strong>${t("date") || "Date"}:</strong> ${new Date(violation.violation_date).toLocaleDateString()}</p>` : ""}
            <p><strong>${t("country") || "Country"}:</strong> ${getTranslatedCountryName(violation.country_code)}</p>
          </div>
          <button
            onclick="window.dispatchEvent(new CustomEvent('viewViolationDetails', { detail: '${violation.id}' }))"
            class="mt-2 w-full py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
          >
            ${t("view_details") || "View details"}
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);
      markersRef.current.push(marker);
    });

    // ✅ Centering map on markers
    if (filteredViolations.length > 0) {
      const bounds = L.latLngBounds(
        filteredViolations.map((v) => [
          parseFloat(v.latitude),
          parseFloat(v.longitude),
        ]),
      );

      if (filteredViolations.length === 1) {
        const violation = filteredViolations[0];
        mapRef.current.setView(
          [parseFloat(violation.latitude), parseFloat(violation.longitude)],
          12,
        );
      } else {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }

    // Update counter text
    if (mapCounterRef.current) {
      const counterText = `${filteredViolations.length} ${t("violations_on_map") || "violations on map"}`;
      mapCounterRef.current.querySelector("span").textContent = counterText;
    }
  }, [filteredViolations, t, getTranslatedCountryName]);

  // Filter violations by selected country
  const filterViolationsByCountry = useCallback(() => {
    if (!selectedCountry || selectedCountry === "EARTH") {
      setFilteredViolations(violations);
      return;
    }

    const filtered = violations.filter(
      (v) => v.country_code === selectedCountry,
    );
    console.log(
      `🔍 Filtered violations for ${selectedCountry}:`,
      filtered.length,
    );
    setFilteredViolations(filtered);
  }, [selectedCountry, violations]);

  const loadUserProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t("user_error"));
      }

      if (!user) {
        navigate("/");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        console.warn(t("profile_not_found"));

        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            id: user.id,
            email: user.email,
            unique_name:
              user.user_metadata?.unique_name || `user_${user.id.slice(0, 8)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            has_completed_onboarding: false,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(t("create_profile_error"));
        }

        setUserProfile(newProfile);
        navigate("/onboarding");
        return;
      }

      if (!profile?.has_completed_onboarding) {
        navigate("/onboarding");
        return;
      }

      setUserProfile(profile);

      if (profile.country) {
        console.log("🌍 Setting user's country as default:", profile.country);
        setSelectedCountry(profile.country);
      } else {
        handleAutoDetectCountry();
      }
    } catch (error) {
      console.error(t("profile_load_error"), error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoDetectCountry = async () => {
    try {
      resetDetection();
      const detected = await detectLocation();
      if (detected && detected.code) {
        setSelectedCountry(detected.code);
      }
    } catch (error) {
      console.error("Country detection error:", error);
      if (!selectedCountry) {
        setSelectedCountry("EARTH");
      }
    }
  };

  const handleCountryChange = async (e) => {
    const countryCode = e.target.value;
    console.log("🌍 Country changed to:", countryCode);
    setSelectedCountry(countryCode);
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error(t("logout_error"), error);
      alert(t("logout_failed"));
    }
  };

  // Function to collapse/expand map
  const toggleMapCollapse = () => {
    setIsMapCollapsed(!isMapCollapsed);
  };

  // Load violations on first render
  useEffect(() => {
    loadViolations();
  }, [loadViolations]);

  // ✅ Initialize map after data loading AND when country changes
  useEffect(() => {
    if (!mapLoading && !mapError && !isMapCollapsed) {
      console.log("🗺️ Initializing/updating map for country:", selectedCountry);
      initMap();
    }
  }, [mapLoading, mapError, selectedCountry, initMap, isMapCollapsed]);

  // Update markers when filtered violations change
  useEffect(() => {
    if (mapRef.current && filteredViolations.length >= 0 && !isMapCollapsed) {
      updateMapMarkers();
    }
  }, [filteredViolations, updateMapMarkers, isMapCollapsed]);

  // Filter violations when selected country changes
  useEffect(() => {
    if (violations.length > 0) {
      filterViolationsByCountry();
    }
  }, [selectedCountry, violations, filterViolationsByCountry]);

  // Event listener for navigating to violation details
  useEffect(() => {
    const handleViewDetails = (event) => {
      const violationId = event.detail;
      navigate(`/complaints/${violationId}`);
    };

    window.addEventListener("viewViolationDetails", handleViewDetails);
    return () => {
      window.removeEventListener("viewViolationDetails", handleViewDetails);
    };
  }, [navigate]);

  // Clean up map when component unmounts
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        console.log("🗺️ Cleaning up map");
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const countryOptions = getAllCountries();

  const getDefaultCountryName = () => {
    if (!selectedCountry) return t("user_country_default") || "User country";

    const country = countryOptions.find((c) => c.code === selectedCountry);
    return country ? country.name : t("user_country_default") || "User country";
  };

  const shouldFilterByCountry =
    selectedCountry && selectedCountry !== "EARTH" && selectedCountry !== "";

  // Function to get average rating value
  const getAverageRatingValue = () => {
    if (!ratingsData || !ratingsData.averageRatings || ratingsLoading) return 0;

    const { averageRatings } = ratingsData;
    const values = [
      averageRatings.human_rights || 0,
      averageRatings.economic_freedom || 0,
      averageRatings.political_freedom || 0,
      averageRatings.freedom_of_speech || 0,
    ];

    const sum = values.reduce((acc, val) => acc + val, 0);
    return sum / values.length;
  };

  // Rating line component
  const RatingLine = ({ title, icon: Icon, value, totalUsers = 0 }) => {
    const hasValue = value > 0;

    return (
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </span>
            {totalUsers > 0 && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {totalUsers}{" "}
                {totalUsers === 1
                  ? t("rating") || "rating"
                  : t("ratings") || "ratings"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            {hasValue ? (
              <>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {value.toFixed(1)}/10
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("not_rated") || "Not rated"}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="relative h-8">
          <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-300 dark:bg-gray-700 rounded-full -translate-y-1/2">
            <div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-300"
              style={{ width: `${value * 10}%` }}
            ></div>

            <div className="absolute top-1/2 left-0 right-0 flex justify-between -translate-y-1/2 pointer-events-none">
              {[...Array(11)].map((_, index) => (
                <div
                  key={index}
                  className={`w-0.5 h-3 ${
                    index === 0 || index === 10
                      ? "bg-blue-500 dark:bg-gray-400"
                      : "bg-blue-400 dark:bg-gray-500"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {hasValue && (
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${value * 10}%` }}
            >
              <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 shadow"></div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const AverageRatingsDisplay = () => {
    if (!selectedCountry || selectedCountry === "EARTH") {
      return null;
    }

    if (ratingsLoading) {
      return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {t("country_ratings") || "Country ratings"}
            </h3>
          </div>

          <div className="space-y-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="animate-pulse">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (ratingsError) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {t("country_ratings") || "Country ratings"}
            </h3>
          </div>
          <p className="text-sm text-red-800 dark:text-red-300 mb-2">
            ⚠️ {t("ratings_load_error") || "Error loading ratings"}
          </p>
          <button
            onClick={() => getAverageRatings(selectedCountry)}
            className="mt-2 px-3 py-1.5 text-xs bg-blue-900 text-white rounded-full hover:bg-blue-800 transition-colors"
          >
            {t("retry") || "Try again"}
          </button>
        </div>
      );
    }

    if (!ratingsData || !ratingsData.averageRatings) {
      return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              {t("country_ratings") || "Country ratings"}
            </h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {getTranslatedCountryName(selectedCountry) || selectedCountry}
                </p>
              </div>
            </div>
          </div>
          <div className="text-center py-3">
            <Globe className="w-10 h-10 text-gray-400 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {t("no_ratings_available") ||
                "No ratings available for this country yet"}
            </p>
            <button
              onClick={() => navigate("/profile")}
              className="px-3 py-1.5 text-xs bg-blue-900 text-white rounded-full hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
            >
              <Star className="w-3 h-3" />
              {t("go_to_profile_to_rate") || "Go to profile to rate"}
            </button>
          </div>
        </div>
      );
    }

    const { averageRatings, totalRatings } = ratingsData;

    const ratingCategories = [
      {
        type: "human_rights",
        title: t("human_rights_level") || "Human rights compliance level",
        icon: Shield,
        value: averageRatings.human_rights || 0,
      },
      {
        type: "economic_freedom",
        title: t("economic_freedom_level") || "Economic freedom level",
        icon: TrendingUp,
        value: averageRatings.economic_freedom || 0,
      },
      {
        type: "political_freedom",
        title: t("political_freedom_level") || "Political freedom level",
        icon: Scale,
        value: averageRatings.political_freedom || 0,
      },
      {
        type: "freedom_of_speech",
        title: t("freedom_of_speech_level") || "Freedom of speech level",
        icon: MessageSquare,
        value: averageRatings.freedom_of_speech || 0,
      },
    ];

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-gray-700">
        <div className="space-y-4">
          {ratingCategories.map((rating) => (
            <div key={rating.type}>
              <RatingLine
                title={rating.title}
                icon={rating.icon}
                value={rating.value}
                totalUsers={totalRatings}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Layout
      userProfile={userProfile}
      onLogout={handleLogout}
      loading={loading}
      error={error}
      onCreatePost={() => setShowCreatePostModal(true)}
    >
      <div className="h-full">
        {showCreatePostModal ? (
          <div className="h-full">
            <CreatePostModal
              onClose={() => setShowCreatePostModal(false)}
              userCountry={selectedCountry || userInfo?.country || "EARTH"}
            />
          </div>
        ) : (
          <div className="h-full space-y-4">
            {/* Country selection and overall rating area */}
            <div className="w-full">
              <div className="flex items-center gap-2">
                {/* Country selection area - takes entire left side */}
                <div className="flex-1">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      {/* Country selection field */}
                      <div className="flex-1">
                        <select
                          value={selectedCountry}
                          onChange={handleCountryChange}
                          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white transition-all duration-200 text-md"
                          disabled={countryLoading}
                        >
                          <option value="">{getDefaultCountryName()}</option>

                          {countryOptions.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Location detection status */}
                    {detectionStatus === "success" && autoDetectedCountry && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-xs text-green-800 dark:text-green-300">
                          ✅ {t("location_detected") || "Location detected"}:{" "}
                          <span className="font-semibold">
                            {autoDetectedCountry.name}
                          </span>
                        </p>
                      </div>
                    )}

                    {countryError && (
                      <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs text-red-800 dark:text-red-300">
                          ⚠️{" "}
                          {t("location_detection_error") ||
                            "Location detection error"}
                          : {countryError}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Location button - centered in the central area of the page */}
                <div className="flex-shrink-0">
                  <button
                    onClick={handleAutoDetectCountry}
                    disabled={countryLoading}
                    className="flex items-center justify-center w-9 h-9 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-full hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      countryLoading
                        ? t("detecting") || "Detecting..."
                        : t("detect_location") || "My location"
                    }
                  >
                    {countryLoading ? (
                      <span className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></span>
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Overall rating area - takes entire right side */}
                <div className="flex-1">
                  {selectedCountry && selectedCountry !== "EARTH" ? (
                    <button
                      onClick={() => setShowRatings(!showRatings)}
                      className={`w-full px-3 py-2 rounded-full transition-all duration-200 text-left ${
                        showRatings
                          ? "bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800"
                          : "bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {/* Changed: rating text and number in one line */}
                          <div className="flex items-center gap-2">
                            <span className="text-md  text-gray-900 dark:text-white">
                              {t("ratings_short") || "Overall rating"}
                            </span>
                            {ratingsData && ratingsData.averageRatings ? (
                              <span className="text-sm font-bold text-gray-900 dark:text-white">
                                {getAverageRatingValue().toFixed(1)}/10
                              </span>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                {t("rate") || "Rate"}
                              </span>
                            )}
                          </div>
                        </div>
                        {showRatings ? (
                          <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                        )}
                      </div>
                    </button>
                  ) : (
                    <div className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-medium text-gray-900 dark:text-white">
                          {t("global_view") || "Global view"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* COUNTRY AVERAGE RATINGS - shown ABOVE map */}
            {showRatings && selectedCountry && selectedCountry !== "EARTH" && (
              <AverageRatingsDisplay />
            )}

            {/* VIOLATIONS MAP - displayed by default, can be collapsed */}
            {!isMapCollapsed && (
              <div>
                {/* Map container */}
                <div className="relative bg-white dark:bg-gray-800 border border-blue-200 dark:border-gray-700 rounded-xl overflow-hidden">
                  {mapError && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                      <div className="text-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 max-w-xs">
                        <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                          {mapError}
                        </p>
                        <button
                          onClick={loadViolations}
                          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                          {t("try_again") || "Try again"}
                        </button>
                      </div>
                    </div>
                  )}

                  {mapLoading && (
                    <div className="absolute inset-0 z-40 bg-white dark:bg-gray-800 bg-opacity-80 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {t("loading_map") || "Loading map..."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Map with height half of ViolationsMap page */}
                  <div
                    ref={mapContainerRef}
                    className="h-[300px] w-full rounded-xl z-10"
                  />
                </div>
              </div>
            )}

            {/* If map is collapsed - show compact block for expanding */}
            {isMapCollapsed && (
              <div
                className="p-3 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl cursor-pointer hover:from-blue-100 hover:to-blue-200 dark:hover:from-blue-800/30 dark:hover:to-blue-900/30 transition-all duration-200"
                onClick={toggleMapCollapse}
                title={t("expand_map") || "Expand map"}
              >
                {/* Changed: reduced block height by half */}
                <div className="flex items-center justify-between h-[20px]">
                  <div className="flex items-center gap-3">
                    {/* Expand button - far left side */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleMapCollapse();
                      }}
                      className="flex items-center justify-center w-7 h-7 bg-white dark:bg-gray-800 border border-blue-200 dark:border-blue-800 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
                      title={t("expand_map") || "Expand map"}
                    >
                      <Maximize2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                    </button>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                        {t("map_of_violations") || "Violations map"}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {filteredViolations.length}{" "}
                        {t("violations_on_map") || "violations on map"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/violations-map");
                      }}
                      className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-full transition-colors flex items-center gap-1"
                    >
                      <ChevronRight className="w-3 h-3" />
                      {t("full_map") || "Full map"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Feed header with toggle */}
            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {shouldFilterByCountry
                    ? `${t("feed_for_country") || "Feed for"} ${getTranslatedCountryName(selectedCountry) || selectedCountry}`
                    : t("global_feed") || "Global feed"}
                </h2>
              </div>

              {showFeedHeader && shouldFilterByCountry && (
                <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    📍{" "}
                    {t("showing_country_posts") ||
                      "Showing posts for this country"}
                  </p>
                </div>
              )}
            </div>

            {/* Social feed - without extra margins */}
            <div>
              <CountryFeed
                countryCode={selectedCountry}
                filterByCountry={shouldFilterByCountry}
                compactMode={true}
              />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
