// src/components/EditPostModal.jsx
import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Image as ImageIcon,
  Video,
  File,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import usePosts from "../hooks/usePosts";

const EditPostModal = ({ post, onClose, onUpdate }) => {
  const { t } = useTranslation();
  const [content, setContent] = useState(post.content || "");
  const [mediaFiles, setMediaFiles] = useState([]);
  const [existingMedia, setExistingMedia] = useState(
    post.media_urls?.map((url, index) => ({
      url,
      type: post.media_types?.[index] || "document",
      isNew: false,
    })) || [],
  );
  const [filesToDelete, setFilesToDelete] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

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

  const removeNewFile = (index) => {
    setMediaFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingMedia = (index) => {
    const mediaToRemove = existingMedia[index];
    if (mediaToRemove.isNew) {
      removeNewFile(index);
    } else {
      setFilesToDelete((prev) => [...prev, mediaToRemove.url]);
      setExistingMedia((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const uploadNewMediaFiles = async () => {
    if (mediaFiles.length === 0) return { urls: [], types: [] };

    setUploading(true);
    const urls = [];
    const types = [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("User not authenticated");

      for (const file of mediaFiles) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random()
          .toString(36)
          .substring(2, 15)}.${fileExt}`;
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

  const deleteOldMediaFiles = async () => {
    if (filesToDelete.length === 0) return;

    try {
      // Delete files from storage
      for (const url of filesToDelete) {
        try {
          // Extract path from URL
          const pathMatch = url.match(
            /\/storage\/v1\/object\/public\/user-content\/(.+)/,
          );
          if (pathMatch) {
            const filePath = pathMatch[1];
            await supabase.storage.from("user-content").remove([filePath]);
          }
        } catch (error) {
          console.warn("⚠️ Failed to delete file:", url, error);
        }
      }
    } catch (error) {
      console.error("❌ Error deleting old media:", error);
      // Don't throw error to not block post update
    }
  };

  const saveEditHistory = async (oldData, newData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      await supabase.from("post_edit_history").insert({
        post_id: post.id,
        user_id: user.id,
        old_content: oldData.content,
        new_content: newData.content,
        old_media_urls: oldData.media_urls || [],
        new_media_urls: newData.media_urls || [],
        old_media_types: oldData.media_types || [],
        new_media_types: newData.media_types || [],
        edited_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Error saving edit history:", error);
      // Ignore history error to not block main update
    }
  };

  const handleSubmit = async () => {
    if (
      !content.trim() &&
      existingMedia.length === 0 &&
      mediaFiles.length === 0
    ) {
      alert("Post must contain text or media files");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Upload new files
      const { urls: newUrls, types: newTypes } = await uploadNewMediaFiles();

      // Delete old files
      await deleteOldMediaFiles();

      // Form new media arrays
      const updatedMediaUrls = [
        ...existingMedia
          .filter((m) => !filesToDelete.includes(m.url))
          .map((m) => m.url),
        ...newUrls,
      ];

      const updatedMediaTypes = [
        ...existingMedia
          .filter((m) => !filesToDelete.includes(m.url))
          .map((m) => m.type),
        ...newTypes,
      ];

      // Save edit history (optional)
      const oldPostData = {
        content: post.content,
        media_urls: post.media_urls || [],
        media_types: post.media_types || [],
      };

      const newPostData = {
        content: content.trim(),
        media_urls: updatedMediaUrls,
        media_types: updatedMediaTypes,
      };

      // Update post in database
      const { data, error: updateError } = await supabase
        .from("posts")
        .update({
          content: newPostData.content,
          media_urls: newPostData.media_urls,
          media_types: newPostData.media_types,
          updated_at: new Date().toISOString(),
          edit_count: (post.edit_count || 0) + 1,
          last_edited_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .select(
          `
          *,
          users (
            id,
            unique_name,
            avatar_url,
            country
          )
        `,
        )
        .single();

      if (updateError) throw updateError;

      // Save history
      await saveEditHistory(oldPostData, newPostData);

      // Call callback to update UI
      if (onUpdate) {
        onUpdate(data);
      }

      alert("Post successfully updated!");
      onClose();
    } catch (error) {
      console.error("❌ Error updating post:", error);
      setError(error.message);
      alert("Error updating post: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const allMedia = [
    ...existingMedia.map((media, index) => ({
      ...media,
      id: `existing-${index}`,
    })),
    ...mediaFiles.map((file, index) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("video/")
          ? "video"
          : "document",
      name: file.name,
      isNew: true,
      id: `new-${index}`,
    })),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {t("edit_post") || "Edit Post"}
            </h2>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {post.edit_count > 0 && `Edited ${post.edit_count} times`}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Text field */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t("whats_on_your_mind") || "What's on your mind?"}
            className="w-full min-h-[200px] p-4 bg-transparent border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white resize-none outline-none transition-colors"
            autoFocus
          />

          {/* Media files */}
          {allMedia.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                {t("attached_files") || "Attached files"} ({allMedia.length})
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  {filesToDelete.length > 0 &&
                    `(${filesToDelete.length} will be deleted)`}
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {allMedia.map((media, index) => (
                  <div
                    key={media.id}
                    className="relative group border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                  >
                    {media.type === "image" ? (
                      <div className="relative">
                        <img
                          src={media.url}
                          alt={media.name || `Image ${index + 1}`}
                          className="w-full h-48 object-cover"
                          loading="lazy"
                        />
                        {media.isNew && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            New
                          </div>
                        )}
                      </div>
                    ) : media.type === "video" ? (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                        <Video className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 text-center truncate w-full">
                          {media.name || `Video ${index + 1}`}
                        </span>
                        {media.isNew && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            New
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-48 bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center p-4">
                        <File className="w-12 h-12 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400 text-center truncate w-full">
                          {media.name || `Document ${index + 1}`}
                        </span>
                        {media.isNew && (
                          <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
                            New
                          </div>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (media.isNew) {
                          removeNewFile(index);
                        } else {
                          removeExistingMedia(index);
                        }
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-90 hover:opacity-100 transition-opacity z-20 shadow-lg"
                      aria-label="Delete file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Toolbar */}
          <div className="mt-8 pt-6 border-t dark:border-gray-700">
            <div className="flex items-center justify-between">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                disabled={uploading}
              >
                <ImageIcon className="w-5 h-5" />
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
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                loading ||
                uploading ||
                (!content.trim() && allMedia.length === 0)
              }
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 dark:from-green-700 dark:to-green-800 text-white rounded-full hover:from-green-700 hover:to-green-800 dark:hover:from-green-600 dark:hover:to-green-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
            >
              {loading || uploading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                  {t("saving") || "Saving..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  {t("save_changes") || "Save changes"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
