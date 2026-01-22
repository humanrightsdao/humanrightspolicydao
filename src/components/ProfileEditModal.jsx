// src/components/ProfileEditModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  User,
  Camera,
  Globe,
  Calendar,
  Link as LinkIcon,
  Plus,
  Trash2,
  MapPin,
  Upload,
  Loader,
} from "lucide-react";
import { useCountry } from "../hooks/useCountry";
import useUserInfo from "../hooks/useUserInfo";

const AvatarUpload = ({ userInfo, onAvatarUpdated }) => {
  const { t } = useTranslation();
  const { uploadAvatar, deleteAvatar } = useUserInfo();
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [preview, setPreview] = useState(userInfo?.avatarUrl || null);

  useEffect(() => {
    if (userInfo?.avatarUrl) {
      setPreview(userInfo.avatarUrl);
    }
  }, [userInfo?.avatarUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError(t("avatar_file_type_error") || "Please select an image file");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      setError(
        t("avatar_file_format_error") || "Allowed formats: JPG, PNG, WebP, GIF",
      );
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError(
        t("avatar_file_size_error") || "File size should not exceed 5MB",
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    handleUpload(file);
  };

  const handleUpload = async (file) => {
    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const avatarUrl = await uploadAvatar(file);
      setPreview(avatarUrl);
      setSuccess(t("avatar_upload_success") || "Avatar uploaded successfully");

      if (onAvatarUpdated) {
        onAvatarUpdated(avatarUrl);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.message || t("avatar_upload_error") || "Error uploading avatar",
      );
      setPreview(userInfo?.avatarUrl || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    setUploading(true);
    setError("");

    try {
      await deleteAvatar();
      setPreview(null);
      setSuccess(t("avatar_delete_success") || "Avatar deleted successfully");

      if (onAvatarUpdated) {
        onAvatarUpdated(null);
      }

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(
        err.message || t("avatar_delete_error") || "Error deleting avatar",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect({ target: { files: [files[0]] } });
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-col items-center">
        <div className="relative mb-2">
          <div
            className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {preview ? (
              <img
                src={preview}
                alt={userInfo?.uniqueName || "User avatar"}
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  e.target.style.display = "none";
                  const fallback =
                    e.target.parentElement.querySelector(".avatar-fallback");
                  if (fallback) {
                    fallback.style.display = "flex";
                  }
                }}
              />
            ) : null}
            <div
              className="avatar-fallback w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold"
              style={{ display: preview ? "none" : "flex" }}
            >
              {userInfo?.uniqueName?.[0]?.toUpperCase() || "U"}
            </div>
          </div>

          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <Loader className="w-5 h-5 text-white animate-spin" />
            </div>
          )}
        </div>

        {error && (
          <div className="mb-1 p-1.5 bg-red-50 dark:bg-red-900/30 rounded-full">
            <p className="text-xs text-red-600 dark:text-red-300 text-center">
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="mb-1 p-1.5 bg-green-50 dark:bg-green-900/30 rounded-full">
            <p className="text-xs text-green-600 dark:text-green-300 text-center">
              {success}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-1.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-3 py-1 text-xs bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all duration-300 flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            {preview
              ? t("change_avatar") || "Change avatar"
              : t("upload_avatar") || "Upload avatar"}
          </button>

          {preview && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={uploading}
              className="px-3 py-1 text-xs bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full hover:from-red-700 hover:to-red-800 disabled:opacity-50 transition-all duration-300 flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              {t("remove_avatar") || "Remove avatar"}
            </button>
          )}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
          {t("drag_drop_or_click") || "Drag & drop or click to select"}
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    </div>
  );
};

const ProfileEditModal = ({ userInfo, onClose }) => {
  const { t } = useTranslation();
  const { updateUserInfo, loadUserInfo } = useUserInfo();
  const {
    getTranslatedCountryName,
    getAllCountries,
    detectLocation,
    loading: countryLoading,
  } = useCountry();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    uniqueName: userInfo.uniqueName || "",
    bio: userInfo.bio || "",
    country: userInfo.country || "EARTH",
    socialLinks: userInfo.socialLinks || [],
    avatarUrl: userInfo.avatarUrl || null,
  });

  const [newSocialLink, setNewSocialLink] = useState({
    platform: "",
    username: "",
    url: "",
  });

  const [nameError, setNameError] = useState("");
  const [availableCountries, setAvailableCountries] = useState([]);

  useEffect(() => {
    setAvailableCountries(getAllCountries());
  }, [getAllCountries]);

  useEffect(() => {
    setFormData({
      uniqueName: userInfo.uniqueName || "",
      bio: userInfo.bio || "",
      country: userInfo.country || "EARTH",
      socialLinks: Array.isArray(userInfo.socialLinks)
        ? userInfo.socialLinks
        : [],
      avatarUrl: userInfo.avatarUrl || null,
    });
  }, [userInfo]);

  const getGradientClasses = (isActive = false) => {
    return isActive
      ? "from-black via-gray-900 to-blue-950"
      : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900";
  };

  const getHoverClasses = () => {
    return "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950";
  };

  const validateUsername = (username) => {
    if (username.length < 3) {
      return t("username_too_short");
    }
    if (username.length > 30) {
      return t("username_too_long");
    }
    if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
      return t("username_invalid_chars");
    }
    return "";
  };

  const handleUsernameChange = (value) => {
    setFormData({ ...formData, uniqueName: value });
    const error = validateUsername(value);
    setNameError(error);
  };

  const handleDetectLocation = async () => {
    try {
      const location = await detectLocation();
      setFormData({ ...formData, country: location.countryCode });
      setSuccess(t("location_detected"));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddSocialLink = () => {
    if (!newSocialLink.platform || !newSocialLink.username) {
      setError(t("fill_all_fields") || "Please fill all fields");
      setTimeout(() => setError(""), 3000);
      return;
    }

    const newLink = {
      platform: newSocialLink.platform,
      username: newSocialLink.username,
      url:
        newSocialLink.url ||
        `https://${newSocialLink.platform.toLowerCase()}.com/${newSocialLink.username}`,
      id: Date.now(),
    };

    setFormData({
      ...formData,
      socialLinks: [...formData.socialLinks, newLink],
    });

    setNewSocialLink({ platform: "", username: "", url: "" });
    setSuccess(t("social_link_added") || "Social link added");
    setTimeout(() => setSuccess(""), 3000);
  };

  const handleRemoveSocialLink = (index) => {
    const updatedLinks = formData.socialLinks.filter((_, i) => i !== index);
    setFormData({ ...formData, socialLinks: updatedLinks });
  };

  const handleAvatarUpdated = (newAvatarUrl) => {
    setFormData((prev) => ({ ...prev, avatarUrl: newAvatarUrl }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const usernameError = validateUsername(formData.uniqueName);
    if (usernameError) {
      setNameError(usernameError);
      return;
    }

    setLoading(true);

    try {
      const updateData = {
        unique_name: formData.uniqueName,
        bio: formData.bio,
        country: formData.country,
        social_links: formData.socialLinks,
      };

      if (
        formData.avatarUrl !== userInfo.avatarUrl &&
        formData.avatarUrl !== null
      ) {
        updateData.avatar_url = formData.avatarUrl;
      }

      await updateUserInfo(updateData);

      setSuccess(t("profile_updated") || "Profile updated successfully");

      setTimeout(async () => {
        await loadUserInfo();
        onClose();
      }, 1000);
    } catch (err) {
      setError(err.message || t("update_failed") || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-xl">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-base font-bold text-gray-900 dark:text-white">
            {t("edit_profile")}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mb-2 p-2 text-xs bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-full">
            <p className="text-red-600 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-2 p-2 text-xs bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-full">
            <p className="text-green-600 dark:text-green-300">{success}</p>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        <div className="flex justify-center">
          <AvatarUpload
            userInfo={userInfo}
            onAvatarUpdated={handleAvatarUpdated}
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
            <User className="w-3 h-3" />
            {t("unique_name")}
          </label>
          <input
            type="text"
            value={formData.uniqueName}
            onChange={(e) => handleUsernameChange(e.target.value)}
            className={`
              w-full p-2 text-sm rounded-full border-2 ${
                nameError
                  ? "border-red-300 dark:border-red-600"
                  : "border-blue-300 dark:border-gray-600"
              }
              bg-white dark:bg-gray-700
              text-gray-900 dark:text-white
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent
              placeholder-gray-500 dark:placeholder-gray-400
            `}
            placeholder={t("enter_unique_name")}
            required
          />
          {nameError && (
            <p className="text-xs text-red-600 dark:text-red-400">
              {nameError}
            </p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t("username_rules")}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
              <Globe className="w-3 h-3" />
              {t("country")}
            </label>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={countryLoading}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 disabled:opacity-50"
            >
              <MapPin className="w-3 h-3" />
              {countryLoading ? t("detecting") : t("detect_location")}
            </button>
          </div>
          <select
            value={formData.country}
            onChange={(e) =>
              setFormData({ ...formData, country: e.target.value })
            }
            className="w-full p-2 text-sm rounded-full border border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent"
          >
            {availableCountries.map((country) => (
              <option key={country.code} value={country.code}>
                {country.name}
              </option>
            ))}
          </select>
          {formData.country && formData.country !== "EARTH" && (
            <p className="text-xs text-green-600 dark:text-green-400">
              {t("selected_country")}:{" "}
              {getTranslatedCountryName(formData.country)}
            </p>
          )}
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
            {t("about_me")}
          </label>
          <textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={3}
            className="w-full p-2 text-sm rounded-xl border border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder={t("tell_about_yourself")}
            maxLength={500}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
            {formData.bio.length}/500
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("social_networks")}
            </h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formData.socialLinks.length} {t("added")}
            </span>
          </div>

          <div className="space-y-1.5">
            {formData.socialLinks.length > 0 ? (
              formData.socialLinks.map((link, index) => (
                <div
                  key={link.id || index}
                  className="flex items-center justify-between p-2 text-xs bg-gray-50 dark:bg-gray-700 rounded-full"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <LinkIcon className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {link.platform}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        @{link.username}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveSocialLink(index)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center py-2">
                {t("no_social_links") || "No social links added yet"}
              </p>
            )}
          </div>

          <div className="p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl space-y-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              {t("add_social_network")}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <input
                type="text"
                value={newSocialLink.platform}
                onChange={(e) =>
                  setNewSocialLink({
                    ...newSocialLink,
                    platform: e.target.value,
                  })
                }
                placeholder={t("platform") || "Platform"}
                className="p-1.5 text-xs rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="text"
                value={newSocialLink.username}
                onChange={(e) =>
                  setNewSocialLink({
                    ...newSocialLink,
                    username: e.target.value,
                  })
                }
                placeholder={t("username") || "Username"}
                className="p-1.5 text-xs rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <input
                type="url"
                value={newSocialLink.url}
                onChange={(e) =>
                  setNewSocialLink({ ...newSocialLink, url: e.target.value })
                }
                placeholder={t("url_optional") || "URL (optional)"}
                className="p-1.5 text-xs rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <button
              type="button"
              onClick={handleAddSocialLink}
              className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              <Plus className="w-3 h-3" />
              {t("add_link") || "Add link"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-sm rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={loading || !!nameError}
            className={`
              px-4 py-1.5 text-sm rounded-full font-medium transition-all duration-300
              flex items-center gap-1.5 text-white
              bg-gradient-to-r ${getGradientClasses(true)} ${getHoverClasses()}
              hover:scale-[1.02] shadow hover:shadow-md
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            `}
          >
            {loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {t("saving")}
              </>
            ) : (
              t("save_changes")
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileEditModal;
