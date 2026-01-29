// src/pages/ComplaintsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Upload,
  X,
  AlertCircle,
  CheckCircle,
  Calendar,
  User,
  FileText,
  Mail,
  Search,
  Loader,
  Map as MapIcon,
  List,
  Shield,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry";
import CreatePostModal from "../components/CreatePostModal"; // ADDED IMPORT

const ComplaintsPage = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUserInfo();
  const { getAllCountries, getTranslatedCountryName } = useCountry(
    localStorage.getItem("i18nextLng") || "en",
  );

  // Form states
  const [formData, setFormData] = useState({
    country: "",
    address: "",
    violationDescription: "",
    offenderName: "",
    affectedPersonsInfo: "",
    violationDate: "",
    violationTime: "",
  });

  // ADDED: State for create post modal
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  // States for working with addresses
  const [addressSuggestions, setAddressSuggestions] = useState([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const [addressCoordinates, setAddressCoordinates] = useState(null);
  const [addressDetails, setAddressDetails] = useState(null);
  const [addressCountryMatch, setAddressCountryMatch] = useState(true); // NEW: checking country match

  // States for files
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});

  // Form states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Moderator states
  const [isModerator, setIsModerator] = useState(false);

  // Timer for address autocomplete
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Check user role
  useEffect(() => {
    if (userInfo) {
      setIsModerator(
        userInfo.role === "moderator" || userInfo.role === "admin",
      );

      // Set default country
      if (
        !formData.country &&
        userInfo.country &&
        userInfo.country !== "EARTH"
      ) {
        setFormData((prev) => ({ ...prev, country: userInfo.country }));
      }
    }
  }, [userInfo]);

  // Function to get country code from Nominatim address
  const getCountryCodeFromAddress = (address) => {
    if (!address || !address.address) return null;

    // Try to get country code from address object
    const addr = address.address;

    // Check various fields where country might be
    if (addr.country_code) {
      return addr.country_code.toUpperCase();
    }

    // If no country code, try to get country name
    if (addr.country) {
      // Simplified check - real app would need a country name-to-code dictionary
      const countryName = addr.country.toLowerCase();
      const allCountries = getAllCountries();
      const matchedCountry = allCountries.find(
        (c) =>
          c.name.toLowerCase() === countryName ||
          c.name.toLowerCase().includes(countryName) ||
          countryName.includes(c.name.toLowerCase()),
      );
      return matchedCountry ? matchedCountry.code : null;
    }

    return null;
  };

  // Address geocoding function
  const geocodeAddress = async (address, countryCode) => {
    try {
      console.log("🔍 Geocoding address:", address, "Country:", countryCode);

      const countryName = getTranslatedCountryName(countryCode);
      const fullAddress =
        countryCode !== "EARTH" ? `${address}, ${countryName}` : address;

      console.log("🌍 Full address for geocoding:", fullAddress);

      // Get current language from i18n
      const currentLanguage = i18n.language || "en";
      // Priority: English, fallback to current app language
      const acceptLanguage = `en,${currentLanguage}`;

      // Add parameter to limit search to selected country
      const url =
        countryCode !== "EARTH"
          ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=3&addressdetails=1&countrycodes=${countryCode.toLowerCase()}&accept-language=${acceptLanguage}`
          : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=3&addressdetails=1&accept-language=${acceptLanguage}`;

      const response = await fetch(url, {
        headers: {
          "User-Agent": "HumanRightsApp/1.0",
        },
      });

      if (!response.ok) {
        console.error(
          "❌ Geocoding API error:",
          response.status,
          response.statusText,
        );
        throw new Error(t("geocoding_failed") || "Geocoding error");
      }

      const data = await response.json();
      console.log("📍 Geocoding results:", data);

      if (data && data.length > 0) {
        const result = data[0];

        // Check if address belongs to selected country
        const resultCountryCode = getCountryCodeFromAddress(result);
        if (
          countryCode !== "EARTH" &&
          resultCountryCode &&
          resultCountryCode !== countryCode
        ) {
          console.warn(
            "⚠️ Address country mismatch:",
            resultCountryCode,
            "expected:",
            countryCode,
          );
          throw new Error(
            t("address_country_mismatch") ||
              "Address does not belong to the selected country. Please check the address or select a different country.",
          );
        }

        const geocodedData = {
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon),
          city:
            result.address?.city ||
            result.address?.town ||
            result.address?.village ||
            null,
          region: result.address?.state || result.address?.region || null,
          postalCode: result.address?.postcode || null,
          displayName: result.display_name,
          countryCode: resultCountryCode,
        };

        console.log("✅ Geocoded successfully:", geocodedData);
        return geocodedData;
      }

      console.warn("⚠️ No geocoding results found");
      throw new Error(
        t("address_not_found") ||
          "Address not found. Try entering a more specific address.",
      );
    } catch (error) {
      console.error("❌ Geocoding error:", error);
      throw error;
    }
  };

  // Search addresses on input
  const searchAddresses = useCallback(
    async (query, countryCode) => {
      if (query.length < 3) {
        setAddressSuggestions([]);
        return;
      }

      if (!countryCode) {
        setAddressSuggestions([]);
        setSubmitError(t("select_country_first") || "Select a country first");
        return;
      }

      setIsSearchingAddress(true);
      setSubmitError("");

      try {
        const countryName = getTranslatedCountryName(countryCode);
        const searchQuery =
          countryCode !== "EARTH" ? `${query}, ${countryName}` : query;

        console.log("🔍 Searching addresses:", searchQuery);

        // Get current language from i18n
        const currentLanguage = i18n.language || "en";
        // Priority: English, fallback to current app language
        const acceptLanguage = `en,${currentLanguage}`;

        // Add countrycodes parameter to limit search to selected country
        const url =
          countryCode !== "EARTH"
            ? `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&countrycodes=${countryCode.toLowerCase()}&accept-language=${acceptLanguage}`
            : `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&addressdetails=1&accept-language=${acceptLanguage}`;

        const response = await fetch(url, {
          headers: {
            "User-Agent": "HumanRightsApp/1.0",
          },
        });

        if (!response.ok) {
          throw new Error("Search failed");
        }

        const data = await response.json();
        console.log("📍 Address suggestions:", data);

        // Filter results by country (additional check)
        const filteredResults =
          countryCode !== "EARTH"
            ? data.filter((result) => {
                const resultCountryCode = getCountryCodeFromAddress(result);
                return !resultCountryCode || resultCountryCode === countryCode;
              })
            : data;

        setAddressSuggestions(filteredResults);

        // Warn user if there are results from other countries
        if (
          countryCode !== "EARTH" &&
          data.length > 0 &&
          filteredResults.length < data.length
        ) {
          console.log("⚠️ Some results filtered out due to country mismatch");
        }
      } catch (error) {
        console.error("Address search error:", error);
        setAddressSuggestions([]);
      } finally {
        setIsSearchingAddress(false);
      }
    },
    [getTranslatedCountryName, t, i18n],
  );

  // Handle address change with debounce
  const handleAddressChange = (value) => {
    setFormData((prev) => ({ ...prev, address: value }));
    setShowAddressSuggestions(true);
    setAddressCoordinates(null);
    setAddressDetails(null);
    setAddressCountryMatch(true); // Reset previous check

    // Clear previous timer
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Set new timer
    const timeout = setTimeout(() => {
      if (value.length >= 3 && formData.country) {
        searchAddresses(value, formData.country);
      } else {
        setAddressSuggestions([]);
      }
    }, 500);

    setSearchTimeout(timeout);
  };

  // Select address from list
  const handleAddressSelect = (suggestion) => {
    // Check if address belongs to selected country
    const selectedCountryCode = getCountryCodeFromAddress(suggestion);
    const isCountryMatch =
      !formData.country ||
      formData.country === "EARTH" ||
      !selectedCountryCode ||
      selectedCountryCode === formData.country;

    if (!isCountryMatch) {
      setSubmitError(
        t("address_country_mismatch_select") ||
          "Selected address does not belong to the selected country. Please choose a different address or change the country.",
      );
      setAddressCountryMatch(false);
      return;
    }

    setFormData((prev) => ({ ...prev, address: suggestion.display_name }));
    setAddressCoordinates({
      latitude: parseFloat(suggestion.lat),
      longitude: parseFloat(suggestion.lon),
    });
    setAddressDetails({
      city:
        suggestion.address.city ||
        suggestion.address.town ||
        suggestion.address.village ||
        null,
      region: suggestion.address.state || suggestion.address.region || null,
      postalCode: suggestion.address.postcode || null,
      countryCode: selectedCountryCode,
    });
    setAddressCountryMatch(true);
    setShowAddressSuggestions(false);
    setAddressSuggestions([]);
    setSubmitError(""); // Clear errors on successful selection
  };

  // Handle country change
  const handleCountryChange = (countryCode) => {
    setFormData((prev) => ({
      ...prev,
      country: countryCode,
      address: "", // Clear address when changing country
    }));
    setAddressCoordinates(null);
    setAddressDetails(null);
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
    setAddressCountryMatch(true);
    setSubmitError("");
  };

  // Handle files
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const validFiles = [];
    const errors = [];

    selectedFiles.forEach((file) => {
      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "image/gif",
        "video/mp4",
        "video/webm",
        "application/pdf",
      ];

      if (!allowedTypes.includes(file.type)) {
        errors.push(
          `${file.name}: ${t("unsupported_file_type") || "Unsupported file type"}`,
        );
        return;
      }

      // Check size (20MB)
      if (file.size > 20 * 1024 * 1024) {
        errors.push(
          `${file.name}: ${t("file_too_large") || "File is too large (max 20MB)"}`,
        );
        return;
      }

      validFiles.push(file);
    });

    if (errors.length > 0) {
      setSubmitError(errors.join("; "));
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  // Remove file
  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Upload files to Supabase Storage
  const uploadFiles = async (complaintId) => {
    const uploadedFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      try {
        setUploadProgress((prev) => ({ ...prev, [i]: 0 }));

        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `complaints/${complaintId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("user-content")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        const {
          data: { publicUrl },
        } = supabase.storage.from("user-content").getPublicUrl(filePath);

        uploadedFiles.push({
          url: publicUrl,
          name: file.name,
          type: file.type,
          size: file.size,
        });

        setUploadProgress((prev) => ({ ...prev, [i]: 100 }));
      } catch (error) {
        console.error(`Error uploading file ${file.name}:`, error);
        throw new Error(
          `${t("file_upload_failed") || "File upload failed"}: ${file.name}`,
        );
      }
    }

    return uploadedFiles;
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.country) {
      errors.country = t("country_required") || "Country is required";
    }

    if (!formData.address || formData.address.length < 5) {
      errors.address =
        t("address_required") || "Address is required (min. 5 characters)";
    }

    if (
      !formData.violationDescription ||
      formData.violationDescription.length < 20
    ) {
      errors.violationDescription =
        t("violation_description_required") ||
        "Violation description is required (min. 20 characters)";
    }

    if (formData.violationDate) {
      const selectedDate = new Date(formData.violationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        errors.violationDate =
          t("date_cannot_be_future") || "Date cannot be in the future";
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Additional country match check before submission
    if (
      formData.country &&
      formData.country !== "EARTH" &&
      addressDetails?.countryCode
    ) {
      if (addressDetails.countryCode !== formData.country) {
        setSubmitError(
          t("address_country_mismatch_final") ||
            "Address does not belong to the selected country. Please check the entered data.",
        );
        return;
      }
    }

    if (!validateForm()) {
      setSubmitError(
        t("form_validation_failed") || "Please fix errors in the form",
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      console.log("📝 Starting complaint submission...");
      console.log("📍 Current address:", formData.address);
      console.log("🌍 Country:", formData.country);
      console.log("👤 User email:", userInfo?.email);

      // Geocode address if coordinates not yet obtained
      let coordinates = addressCoordinates;
      let details = addressDetails;

      if (!coordinates) {
        console.log("🔄 Address not validated, geocoding...");

        try {
          const geocoded = await geocodeAddress(
            formData.address,
            formData.country,
          );
          coordinates = {
            latitude: geocoded.latitude,
            longitude: geocoded.longitude,
          };
          details = {
            city: geocoded.city,
            region: geocoded.region,
            postalCode: geocoded.postalCode,
            countryCode: geocoded.countryCode,
          };
          console.log("✅ Geocoding successful:", coordinates);
        } catch (geocodeError) {
          console.error("❌ Geocoding failed:", geocodeError);

          // If geocoding fails, ask user to fix the address
          setSubmitError(
            t("geocoding_failed_message") ||
              "Unable to find the specified address. Please select an address from the suggestions list or enter a more precise address (e.g., include street name, house number, and city).",
          );
          setIsSubmitting(false);
          return;
        }
      } else {
        console.log("✅ Using pre-validated address coordinates");
      }

      // Verify coordinates were obtained
      if (!coordinates || !coordinates.latitude || !coordinates.longitude) {
        throw new Error(
          t("coordinates_required") ||
            "Unable to determine address coordinates. Try selecting an address from the suggestions list.",
        );
      }

      console.log("💾 Creating complaint record...");

      // Create complaint record
      const complaintData = {
        user_id: userInfo.id,
        title: formData.violationDescription.substring(0, 100),
        description: null,
        violation_description: formData.violationDescription,
        offender_name: formData.offenderName || null,
        affected_persons_info: formData.affectedPersonsInfo || null,
        violation_date:
          formData.violationDate && formData.violationTime
            ? `${formData.violationDate}T${formData.violationTime}:00Z`
            : formData.violationDate
              ? `${formData.violationDate}T00:00:00Z`
              : null,
        country_code: formData.country,
        address: formData.address,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        city: details?.city || null,
        region: details?.region || null,
        postal_code: details?.postcode || null,
        feedback_preference: true,
        contact_email: userInfo?.email || null,
        is_anonymous: false,
        status: "pending",
        priority: "medium",
        evidence_files: [],
      };

      console.log("📤 Complaint data:", complaintData);

      const { data: complaint, error: complaintError } = await supabase
        .from("complaints")
        .insert(complaintData)
        .select()
        .single();

      if (complaintError) {
        console.error("❌ Database error:", complaintError);
        throw complaintError;
      }

      console.log("✅ Complaint created:", complaint.id);

      // Upload files
      if (files.length > 0) {
        console.log("📁 Uploading files...");

        try {
          const uploadedFiles = await uploadFiles(complaint.id);
          console.log("✅ Files uploaded:", uploadedFiles.length);

          // Update complaint with files
          const { error: updateError } = await supabase
            .from("complaints")
            .update({ evidence_files: uploadedFiles })
            .eq("id", complaint.id);

          if (updateError) {
            console.error(
              "⚠️ Error updating complaint with files:",
              updateError,
            );
          } else {
            console.log("✅ Complaint updated with files");
          }
        } catch (uploadError) {
          console.error("⚠️ File upload error:", uploadError);
          // Don't block submission due to file upload error
        }
      }

      console.log("🎉 Complaint submitted successfully!");
      setSubmitSuccess(true);

      // Clear form and redirect
      setTimeout(() => {
        navigate("/complaints-list");
      }, 2000);
    } catch (error) {
      console.error("❌ Error submitting complaint:", error);
      setSubmitError(
        error.message ||
          t("submit_failed") ||
          "Error submitting complaint. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get maximum date (today)
  const getMaxDate = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  if (userLoading) {
    return (
      <Layout
        userProfile={userInfo}
        onLogout={() => {}}
        loading={true}
        onCreatePost={() => setShowCreatePostModal(true)} // ADDED
      >
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      </Layout>
    );
  }

  if (!userInfo) {
    return (
      <Layout
        userProfile={null}
        onLogout={() => {}}
        onCreatePost={() => setShowCreatePostModal(true)} // ADDED
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t("please_login") || "Please login to submit a complaint"}
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-4 py-2 bg-blue-900 text-white text-sm rounded hover:bg-blue-800 transition-colors"
            >
              {t("go_to_login") || "Login"}
            </button>
          </div>
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

      {/* Main page - displayed only if create post modal is not open */}
      {!showCreatePostModal && (
        <div className="max-w-2xl mx-auto py-4 px-3">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {t("submit_complaint") || "Submit Complaint"}
            </h1>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {t("submit_complaint_description") ||
                "Report human rights violations"}
            </p>
          </div>

          {/* Navigation links */}
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => navigate("/violations-map")}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-full text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <MapIcon className="w-3 h-3" />
              {t("violations_map") || "Map"}
            </button>
            <button
              onClick={() => navigate("/complaints-list")}
              className="px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded-full text-xs hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-1.5"
            >
              <List className="w-3 h-3" />
              {t("complaints_list") || "List"}
            </button>
            {isModerator && (
              <button
                onClick={() => navigate("/moderation")}
                className="px-3 py-1.5 bg-blue-900 text-white text-xs rounded-full hover:bg-blue-800 transition-colors flex items-center gap-1.5"
              >
                <Shield className="w-3 h-3" />
                {t("moderation_panel") || "Moderation"}
              </button>
            )}
          </div>

          {/* Success message */}
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs font-medium text-green-900 dark:text-green-100">
                  {t("complaint_submitted_success") ||
                    "Complaint submitted successfully!"}
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-0.5">
                  {t("redirecting_to_list") || "Redirecting..."}
                </p>
              </div>
            </div>
          )}

          {/* Error message */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
              <p className="text-xs text-red-900 dark:text-red-100">
                {submitError}
              </p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Country */}
            <div>
              <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">
                {t("country") || "Country"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border ${
                  validationErrors.country
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent`}
              >
                <option value="">
                  {t("select_country") || "Select country"}
                </option>
                {getAllCountries().map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              {validationErrors.country && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.country}
                </p>
              )}
              {formData.country && (
                <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                  {t("address_search_will_be_limited") ||
                    "Address search will be limited to the selected country"}
                </p>
              )}
            </div>

            {/* Address */}
            <div>
              <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">
                <MapPin className="w-3.5 h-3.5 inline mr-1" />
                {t("violation_address") || "Violation address"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleAddressChange(e.target.value)}
                  placeholder={
                    formData.country
                      ? (
                          t("address_placeholder_with_country") ||
                          "Enter address in {country}..."
                        ).replace(
                          "{country}",
                          getTranslatedCountryName(formData.country),
                        )
                      : t("address_placeholder_select_country") ||
                        "First select a country"
                  }
                  className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border ${
                    validationErrors.address
                      ? "border-red-500"
                      : "border-gray-300 dark:border-gray-600"
                  } rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent`}
                  disabled={!formData.country}
                />
                {isSearchingAddress && (
                  <div className="absolute right-2.5 top-2.5">
                    <Loader className="w-4 h-4 animate-spin text-blue-600" />
                  </div>
                )}

                {/* Address suggestions */}
                {showAddressSuggestions && addressSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {addressSuggestions.map((suggestion, index) => {
                      const suggestionCountryCode =
                        getCountryCodeFromAddress(suggestion);
                      const isSameCountry =
                        !formData.country ||
                        formData.country === "EARTH" ||
                        !suggestionCountryCode ||
                        suggestionCountryCode === formData.country;

                      return (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAddressSelect(suggestion)}
                          className={`w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 last:border-b-0 ${
                            !isSameCountry
                              ? "bg-yellow-50 dark:bg-yellow-900/20"
                              : ""
                          }`}
                        >
                          <p className="text-xs text-gray-900 dark:text-white">
                            {suggestion.display_name}
                          </p>
                          {suggestionCountryCode && (
                            <p className="text-xs mt-0.5 text-gray-500 dark:text-gray-400">
                              {getTranslatedCountryName(suggestionCountryCode)}
                              {!isSameCountry && (
                                <span className="ml-1 text-yellow-600 dark:text-yellow-400">
                                  (
                                  {t("different_country") ||
                                    "different country"}
                                  )
                                </span>
                              )}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              {validationErrors.address && (
                <p className="mt-1 text-xs text-red-500">
                  {validationErrors.address}
                </p>
              )}
              {addressCoordinates && addressCountryMatch && (
                <p className="mt-1.5 text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  {t("address_validated") || "Address validated"}
                </p>
              )}
              {addressCoordinates && !addressCountryMatch && (
                <p className="mt-1.5 text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {t("address_country_mismatch_warning") ||
                    "Address does not match selected country!"}
                </p>
              )}
              {!formData.country && formData.address && (
                <p className="mt-1.5 text-xs text-yellow-600 dark:text-yellow-400">
                  {t("select_country_to_validate") ||
                    "Select country to validate address"}
                </p>
              )}
            </div>

            {/* Violation description */}
            <div>
              <label className="block text-xs font-medium text-gray-900 dark:text-white mb-1.5">
                {t("violation_description") || "Violation description"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.violationDescription}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    violationDescription: e.target.value,
                  }))
                }
                placeholder={
                  t("violation_description_placeholder") ||
                  "Describe in detail what happened..."
                }
                rows={4}
                className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border ${
                  validationErrors.violationDescription
                    ? "border-red-500"
                    : "border-gray-300 dark:border-gray-600"
                } rounded text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none`}
              />
              <div className="flex justify-between items-center mt-1.5">
                {validationErrors.violationDescription && (
                  <p className="text-xs text-red-500">
                    {validationErrors.violationDescription}
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                  {formData.violationDescription.length} / 20{" "}
                  {t("min_chars") || "min."}
                </p>
              </div>
            </div>

            {/* Optional fields */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <h3 className="text-xs font-medium text-gray-900 dark:text-white mb-3">
                {t("optional_information") || "Additional information"}
              </h3>

              <div className="space-y-3">
                {/* Date and time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      <Calendar className="w-3.5 h-3.5 inline mr-1" />
                      {t("violation_date") || "Date"}
                    </label>
                    <input
                      type="date"
                      value={formData.violationDate}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          violationDate: e.target.value,
                        }))
                      }
                      max={getMaxDate()}
                      className={`w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border ${
                        validationErrors.violationDate
                          ? "border-red-500"
                          : "border-gray-300 dark:border-gray-600"
                      } rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent`}
                    />
                    {validationErrors.violationDate && (
                      <p className="mt-1 text-xs text-red-500">
                        {validationErrors.violationDate}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("violation_time") || "Time"}
                    </label>
                    <input
                      type="time"
                      value={formData.violationTime}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          violationTime: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Offender name */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    <User className="w-3.5 h-3.5 inline mr-1" />
                    {t("offender_name") || "Offender name"}
                  </label>
                  <input
                    type="text"
                    value={formData.offenderName}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        offenderName: e.target.value,
                      }))
                    }
                    placeholder={t("offender_name_placeholder") || "If known"}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-full text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Affected persons information */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    {t("affected_persons") || "Affected persons"}
                  </label>
                  <textarea
                    value={formData.affectedPersonsInfo}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        affectedPersonsInfo: e.target.value,
                      }))
                    }
                    placeholder={
                      t("affected_persons_placeholder") || "Who was affected?"
                    }
                    rows={2}
                    className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Evidence (files) */}
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-900 dark:text-white mb-2">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                {t("evidence_files") || "Evidence"}
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                {t("evidence_files_description") ||
                  "Photos, videos or documents (max. 20MB)."}
              </p>

              {/* Upload button */}
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,application/pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center w-full px-3 py-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1.5" />
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {t("click_to_upload") || "Click to upload"}
                    </p>
                  </div>
                </div>
              </label>

              {/* Uploaded files list */}
              {files.length > 0 && (
                <div className="mt-3 space-y-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="flex-shrink-0">
                          {file.type.startsWith("image/") && (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-8 h-8 object-cover rounded"
                            />
                          )}
                          {file.type.startsWith("video/") && (
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                          {file.type === "application/pdf" && (
                            <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded flex items-center justify-center">
                              <FileText className="w-4 h-4 text-red-600 dark:text-red-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-900 dark:text-white truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                          {uploadProgress[index] !== undefined && (
                            <div className="mt-1 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1">
                              <div
                                className="bg-blue-600 h-1 rounded-full transition-all"
                                style={{ width: `${uploadProgress[index]}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="flex-shrink-0 ml-2 p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => navigate("/complaints-list")}
                disabled={isSubmitting}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white text-xs rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t("cancel") || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-900 text-white text-xs rounded-full hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-3.5 h-3.5 animate-spin" />
                    {t("submitting") || "Submitting..."}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    {t("submit_complaint") || "Submit"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
};

export default ComplaintsPage;
