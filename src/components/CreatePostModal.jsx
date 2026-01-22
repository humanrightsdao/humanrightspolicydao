// src/components/CreatePostModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Image as ImageIcon,
  Video,
  File,
  Smile,
  Globe,
  Upload,
  User,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import usePosts from "../hooks/usePosts";
import useUserInfo from "../hooks/useUserInfo";
import { useCountry } from "../hooks/useCountry";

const CreatePostModal = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const { createPost, loading, error } = usePosts();
  const { userInfo } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(i18n.language);
  const [content, setContent] = useState("");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const textareaRef = useRef(null);
  const emojiPickerRef = useRef(null);

  // Emojis for the panel
  const commonEmojis = [
    "😀",
    "😂",
    "😍",
    "😎",
    "🤔",
    "😊",
    "👍",
    "❤️",
    "🔥",
    "🎉",
    "🙏",
    "😭",
  ];

  // Get display country name
  const getCountryDisplayName = (countryCode) => {
    if (!countryCode || countryCode === "EARTH") return "EARTH";
    return getTranslatedCountryName(countryCode) || countryCode;
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    const handleClickOutside = (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Function to insert emoji
  const insertEmoji = (emoji) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = content;

    const newText = text.substring(0, start) + emoji + text.substring(end);
    setContent(newText);

    // Focus on textarea and set cursor after inserted emoji
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + emoji.length, start + emoji.length);
    }, 0);

    setShowEmojiPicker(false);
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    const validFiles = files.filter((file) => {
      const maxSize = 10 * 1024 * 1024;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
        "video/mp4",
        "video/webm",
        "application/pdf",
        "text/plain",
      ];

      if (file.size > maxSize) {
        alert(`File ${file.name} is too large. Maximum size: 10MB`);
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        alert(`File type ${file.name} is not supported`);
        return false;
      }

      return true;
    });

    setMediaFiles((prev) => [...prev, ...validFiles]);
  };

  const removeMediaFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadMediaFiles = async () => {
    if (mediaFiles.length === 0) return { urls: [], types: [] };

    setUploading(true);
    const urls = [];
    const types = [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authorized");

      for (const file of mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `posts/${user.id}/${fileName}`;

        let fileType = "document";
        if (file.type.startsWith("image/")) fileType = "image";
        if (file.type.startsWith("video/")) fileType = "video";

        const { error: uploadError } = await supabase.storage
          .from("user-content")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("user-content").getPublicUrl(filePath);

        urls.push(publicUrl);
        types.push(fileType);
      }

      return { urls, types };
    } catch (error) {
      console.error("❌ Error uploading media:", error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && mediaFiles.length === 0) {
      alert("Please enter text or add a media file");
      return;
    }

    try {
      const { urls, types } = await uploadMediaFiles();

      const postData = {
        content: content.trim(),
        mediaUrls: urls,
        mediaTypes: types,
      };

      console.log("Creating post with data:", postData);

      await createPost(postData);
      alert("Post created successfully!");
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error("❌ Error creating post:", error);
      alert("Error creating post: " + error.message);
    }
  };

  // Function to handle avatar loading error
  const handleAvatarError = (e) => {
    e.target.style.display = "none";
    // Instead of optional chaining assignment we use a check
    const nextSibling = e.target.nextSibling;
    if (nextSibling && nextSibling.style) {
      nextSibling.style.display = "flex";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div
        ref={modalRef}
        className="flex-1 bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label={t("close") || "Close"}
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("create_post") || "Create Post"}
            </h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {t("post_will_be_visible_in_country") ||
              "Post will be visible in your country"}
          </div>
        </div>

        {/* Content - main area with scroll */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* User information */}
          <div className="flex items-center gap-3 mb-6">
            {/* Avatar */}
            <div className="relative">
              {userInfo?.avatarUrl ? (
                <>
                  <img
                    src={userInfo.avatarUrl}
                    alt={userInfo.uniqueName || "User"}
                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800 shadow-sm"
                    onError={handleAvatarError}
                  />
                  {/* Fallback - will only be shown on loading error */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold absolute top-0 left-0 hidden">
                    {userInfo?.uniqueName?.[0]?.toUpperCase() ||
                      userInfo?.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                </>
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {userInfo?.uniqueName?.[0]?.toUpperCase() ||
                    userInfo?.email?.[0]?.toUpperCase() ||
                    "U"}
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900 dark:text-white">
                  {userInfo?.uniqueName || userInfo?.email || "User"}
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-sm px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                    {getCountryDisplayName(userInfo?.country)} {/* FIXED */}
                  </span>
                  <Globe className="w-3 h-3 text-gray-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("posting_to") || "Posting to"}{" "}
                {getCountryDisplayName(userInfo?.country)} {/* FIXED */}
              </p>
            </div>
          </div>

          {/* Text field */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("whats_on_your_mind") || "What's on your mind?"}
            className="w-full min-h-[200px] p-4 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white resize-none outline-none transition-colors"
            autoFocus
          />

          {/* Emoji picker */}
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              className="mt-4 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg"
            >
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("select_emoji") || "Select emoji"}
                </h4>
                <button
                  onClick={() => setShowEmojiPicker(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {commonEmojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => insertEmoji(emoji)}
                    className="p-2 text-xl hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    type="button"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Media files */}
          {mediaFiles.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("attached_files") || "Attached files"} ({mediaFiles.length})
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {mediaFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {file.type.startsWith("image/") ? (
                      <div className="relative">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : file.type.startsWith("video/") ? (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                        <Video className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 text-center truncate w-full">
                          {file.name}
                        </span>
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                        <File className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 text-center truncate w-full">
                          {file.name}
                        </span>
                      </div>
                    )}
                    <button
                      onClick={() => removeMediaFile(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity z-20 shadow-lg"
                      aria-label={t("remove_file") || "Remove file"}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                  disabled={uploading}
                  type="button"
                >
                  <Upload className="w-5 h-5" />
                  {t("add_media") || "Add media"}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  accept="image/*,video/*,.pdf,.txt,.doc,.docx"
                  className="hidden"
                />

                <button
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors disabled:opacity-50"
                  disabled={uploading}
                  title={t("add_emoji") || "Add emoji"}
                  type="button"
                >
                  <Smile className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-end gap-4">
            <button
              onClick={onClose}
              disabled={loading || uploading}
              className="px-6 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors font-medium disabled:opacity-50"
              type="button"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                uploading ||
                (!content.trim() && mediaFiles.length === 0)
              }
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-full hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
              type="button"
            >
              {loading || uploading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  {t("publishing") || "Publishing..."}
                </>
              ) : (
                t("publish") || "Publish"
              )}
            </button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
