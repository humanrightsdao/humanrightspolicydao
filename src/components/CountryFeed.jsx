// src/components/CountryFeed.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Repeat,
  Send,
  Bookmark,
  MoreVertical,
  CheckCircle,
  XCircle,
  Flag,
  Edit,
  Trash2,
  Globe,
  Image as ImageIcon,
  Video as VideoIcon,
  File as FileIcon,
  Share2,
  Link,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  BookmarkCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import usePosts from "../hooks/usePosts";
import useUserInfo from "../hooks/useUserInfo";
import EditPostModal from "./EditPostModal";
import { useCountry } from "../hooks/useCountry";

const CountryFeed = ({
  countryCode,
  filterByCountry = false,
  userId = null,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { userInfo } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(i18n.language);
  const {
    getCountryPosts,
    getUserPosts,
    addReaction,
    deletePost,
    addComment,
    updatePost,
    sharePost,
    savePost,
    checkSavedStatuses,
  } = usePosts();

  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [commentInputs, setCommentInputs] = useState({});
  const [showMenu, setShowMenu] = useState(null);
  const [expandedMedia, setExpandedMedia] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [showShareModal, setShowShareModal] = useState(null);
  const [copyStatus, setCopyStatus] = useState({});
  const [sharing, setSharing] = useState({});
  const [savedStatuses, setSavedStatuses] = useState({});
  const [savingPosts, setSavingPosts] = useState({});

  // Function to get displayed country name
  const getCountryDisplayName = (countryCode) => {
    if (!countryCode || countryCode === "EARTH") return "";
    const translated = getTranslatedCountryName(countryCode);
    return translated || countryCode;
  };

  useEffect(() => {
    console.log("🔄 CountryFeed useEffect triggered:", {
      countryCode,
      filterByCountry,
      userId,
    });
    setPage(0);
    setPosts([]);
    loadPosts(true);
  }, [countryCode, filterByCountry, userId]);

  const loadPosts = async (resetPage = false) => {
    try {
      setLoading(true);
      const currentPage = resetPage ? 0 : page;

      let result;

      if (userId) {
        console.log("📥 Loading posts for user:", userId, "page:", currentPage);

        if (typeof getUserPosts !== "function") {
          console.error("❌ getUserPosts is not a function!");
          throw new Error("getUserPosts is not available");
        }

        result = await getUserPosts(userId, currentPage, 20);
      } else {
        const filterCode = filterByCountry ? countryCode : null;

        console.log("📥 Loading posts with:", {
          filterCode,
          filterByCountry,
          countryCode,
          page: currentPage,
        });

        result = await getCountryPosts(filterCode, currentPage, 20);
      }

      const { posts: newPosts, totalCount } = result;

      console.log("✅ Loaded posts:", newPosts.length, "Total:", totalCount);

      const updatedPosts =
        resetPage || currentPage === 0 ? newPosts : [...posts, ...newPosts];
      setPosts(updatedPosts);
      setHasMore(newPosts.length === 20);
      setError("");

      if (newPosts.length > 0 && userInfo?.id) {
        const postIds = newPosts.map((post) => post.id);
        const savedStatusMap = await checkSavedStatuses(postIds);
        setSavedStatuses((prev) => ({ ...prev, ...savedStatusMap }));
      }
    } catch (error) {
      console.error("❌ Error loading posts:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePost = async (postId) => {
    try {
      setSavingPosts((prev) => ({ ...prev, [postId]: true }));

      const result = await savePost(postId);

      if (result.success) {
        const newStatus = result.saved;
        setSavedStatuses((prev) => ({ ...prev, [postId]: newStatus }));

        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              const currentSaves = post.post_saves || [];
              let updatedSaves;

              if (newStatus) {
                updatedSaves = [
                  ...currentSaves,
                  { id: result.data?.id || `temp-${Date.now()}` },
                ];
              } else {
                updatedSaves = currentSaves.filter(
                  (save) =>
                    save.id !== result.saveId &&
                    save.id !== `temp-${Date.now()}`,
                );
              }

              return {
                ...post,
                post_saves: updatedSaves,
              };
            }
            return post;
          }),
        );

        if (newStatus) {
          alert(t("post_saved_success") || "Post saved!");
        } else {
          alert(t("post_unsaved_success") || "Post removed from saved");
        }
      } else {
        alert(
          t("save_error") ||
            "Error saving post: " + (result.error || "unknown error"),
        );
      }
    } catch (error) {
      console.error("❌ Error in handleSavePost:", error);
      alert(t("save_error") || "Error saving post");
    } finally {
      setSavingPosts((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleSharePost = async (postId) => {
    try {
      setSharing((prev) => ({ ...prev, [postId]: true }));

      const result = await sharePost(postId);

      if (result.success) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId
              ? { ...post, share_count: result.shareCount }
              : post,
          ),
        );

        setShowShareModal(postId);
      }
    } catch (error) {
      console.error("❌ Error sharing post:", error);
      alert(t("share_error") || "Error sharing post: " + error.message);
    } finally {
      setSharing((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const copyToClipboard = async (postId) => {
    try {
      const shareUrl = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(shareUrl);

      setCopyStatus((prev) => ({ ...prev, [postId]: true }));

      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [postId]: false }));
      }, 2000);
    } catch (err) {
      console.error("❌ Failed to copy:", err);

      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}/post/${postId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopyStatus((prev) => ({ ...prev, [postId]: true }));
      setTimeout(() => {
        setCopyStatus((prev) => ({ ...prev, [postId]: false }));
      }, 2000);
    }
  };

  const shareToSocial = (postId, platform) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
    const post = posts.find((p) => p.id === postId);
    const title =
      post?.content?.substring(0, 100) +
      (post?.content?.length > 100 ? "..." : "");

    let url = "";

    switch (platform) {
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case "twitter":
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(title)}`;
        break;
      default:
        return;
    }

    window.open(url, "_blank", "width=600,height=400");
  };

  const handleReaction = async (postId, reactionType) => {
    try {
      const currentPost = posts.find((p) => p.id === postId);
      const existingReaction = currentPost?.post_reactions?.find(
        (r) => r.user_id === userInfo?.id,
      );

      // Remove any existing user reaction
      if (existingReaction) {
        await supabase.from("post_reactions").delete().match({
          post_id: postId,
          user_id: userInfo?.id,
        });
      }

      // Add new reaction (if user is not clicking the same reaction)
      if (
        !existingReaction ||
        existingReaction.reaction_type !== reactionType
      ) {
        await addReaction(postId, reactionType);

        // Update local state
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              const existingReactions =
                post.post_reactions?.filter(
                  (r) => r.user_id !== userInfo?.id,
                ) || [];

              return {
                ...post,
                post_reactions: [
                  ...existingReactions,
                  { user_id: userInfo?.id, reaction_type: reactionType },
                ],
              };
            }
            return post;
          }),
        );
      } else {
        // If user clicks the same reaction - just remove it
        setPosts((prev) =>
          prev.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                post_reactions:
                  post.post_reactions?.filter(
                    (r) => r.user_id !== userInfo?.id,
                  ) || [],
              };
            }
            return post;
          }),
        );
      }
    } catch (error) {
      console.error("❌ Error adding reaction:", error);
    }
  };

  const handleComment = async (postId) => {
    const content = commentInputs[postId];
    if (!content?.trim()) return;

    try {
      const newComment = await addComment(postId, content);

      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              post_comments: [
                ...(post.post_comments || []),
                { id: newComment.id },
              ],
            };
          }
          return post;
        }),
      );

      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    } catch (error) {
      console.error("❌ Error adding comment:", error);
    }
  };

  const handleDeletePost = async (postId) => {
    if (
      !window.confirm(
        t("confirm_delete_post") ||
          "Are you sure you want to delete this post?",
      )
    ) {
      return;
    }

    try {
      await deletePost(postId);
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      setShowMenu(null);
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert(error.message);
    }
  };

  const handleReportPost = async (postId) => {
    if (
      !window.confirm(
        t("confirm_report_post") ||
          "Are you sure you want to report this post?",
      )
    ) {
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authorized");
      }

      const { error } = await supabase.from("post_reports").insert([
        {
          post_id: postId,
          user_id: user.id,
          reason: "user_report",
          status: "pending",
        },
      ]);

      if (error) {
        throw new Error(error.message);
      }

      alert(t("report_success") || "Report sent successfully!");
      setShowMenu(null);
    } catch (error) {
      console.error("❌ Error reporting post:", error);
      alert(t("report_error") || "Error sending report: " + error.message);
    }
  };

  const handleUpdatePost = async (updatedPost) => {
    try {
      setPosts((prev) =>
        prev.map((post) => (post.id === updatedPost.id ? updatedPost : post)),
      );
      setEditingPost(null);
    } catch (error) {
      console.error("❌ Error updating post in state:", error);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("just_now") || "just now";
    if (diffMins < 60) return `${diffMins} ${t("minutes_ago") || "min ago"}`;
    if (diffHours < 24) return `${diffHours} ${t("hours_ago") || "hours ago"}`;
    if (diffDays < 7) return `${diffDays} ${t("days_ago") || "days ago"}`;

    return date.toLocaleDateString();
  };

  const getReactionCounts = (post) => {
    const reactions = post.post_reactions || [];
    return {
      truth: reactions.filter((r) => r.reaction_type === "truth").length,
      false: reactions.filter((r) => r.reaction_type === "false").length,
    };
  };

  const toggleMediaExpansion = (postId, index) => {
    const key = `${postId}-${index}`;
    setExpandedMedia((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getMediaDisplayClass = (type, isExpanded) => {
    if (isExpanded) {
      return "w-full max-h-[500px]";
    }

    switch (type) {
      case "image":
        return "w-full max-h-[400px] object-contain";
      case "video":
        return "w-full max-h-[400px]";
      default:
        return "w-full";
    }
  };

  const handlePostClick = (e, postId) => {
    if (
      e.target.closest(".post-menu") ||
      e.target.closest(".post-actions") ||
      e.target.closest(".comment-section") ||
      e.target.closest("button") ||
      e.target.closest("a") ||
      e.target.closest("input") ||
      e.target.closest("textarea") ||
      e.target.closest("video") ||
      e.target.closest(".share-modal")
    ) {
      return;
    }
    navigate(`/post/${postId}`);
  };

  const handleCommentIconClick = (e, postId) => {
    e.stopPropagation();
    navigate(`/post/${postId}`);
  };

  const getAvatarUrl = (avatarUrl) => {
    if (!avatarUrl) return null;
    if (avatarUrl.includes("?")) {
      return `${avatarUrl}&t=${Date.now()}`;
    }
    return `${avatarUrl}?t=${Date.now()}`;
  };

  const ShareModal = ({ postId, onClose }) => {
    const post = posts.find((p) => p.id === postId);
    const shareUrl = `${window.location.origin}/post/${postId}`;
    const isCopied = copyStatus[postId];

    if (!post) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 share-modal">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("share_post") || "Share post"}
              </h3>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  {post.users?.avatar_url ? (
                    <img
                      src={getAvatarUrl(post.users.avatar_url)}
                      alt={post.users?.unique_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                      {post.users?.unique_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {post.users?.unique_name || t("anonymous")}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {post.content?.substring(0, 100)}
                    {post.content?.length > 100 && "..."}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                onClick={() => shareToSocial(postId, "facebook")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
              >
                <Facebook className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Facebook
                </span>
              </button>

              <button
                onClick={() => shareToSocial(postId, "twitter")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
              >
                <Twitter className="w-8 h-8 text-blue-400 dark:text-blue-300 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Twitter
                </span>
              </button>

              <button
                onClick={() => shareToSocial(postId, "linkedin")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
              >
                <Linkedin className="w-8 h-8 text-blue-700 dark:text-blue-500 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  LinkedIn
                </span>
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                {t("copy_link") || "Copy link"}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {shareUrl}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(postId)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    isCopied
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t("copied") || "Copied"}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>{t("copy") || "Copy"}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("shared_count") || "Shared:"}{" "}
                <span className="font-bold text-gray-900 dark:text-white">
                  {post.share_count || 0}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading && page === 0) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-600 dark:text-red-400">
        <p>{error}</p>
        <button
          onClick={() => loadPosts(true)}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
        >
          {t("retry") || "Try again"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">
            {t("no_posts_yet") || "No posts yet"}
          </h3>
          <p>{t("be_first_to_post") || "Be the first to post!"}</p>
        </div>
      ) : (
        posts.map((post) => {
          const reactionCounts = getReactionCounts(post);
          const userReaction = post.post_reactions?.find(
            (r) => r.user_id === userInfo?.id,
          );
          const isOwner = post.user_id === userInfo?.id;
          const isSaved = savedStatuses[post.id];
          const isSaving = savingPosts[post.id];

          return (
            <div
              key={post.id}
              onClick={(e) => handlePostClick(e, post.id)}
              className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-blue-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow duration-200"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-shrink-0">
                      {post.users?.avatar_url ? (
                        <img
                          src={getAvatarUrl(post.users.avatar_url)}
                          alt={post.users?.unique_name || t("anonymous")}
                          className="w-12 h-12 rounded-full object-cover border-2 border-white dark:border-gray-800"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const parent = e.target.parentElement;
                            const fallback = document.createElement("div");
                            fallback.className =
                              "w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold";
                            fallback.textContent =
                              post.users?.unique_name?.[0]?.toUpperCase() ||
                              "U";
                            parent.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {post.users?.unique_name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/user/${post.user_id}`);
                          }}
                          className="font-bold text-gray-900 dark:text-white truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-left"
                        >
                          {post.users?.unique_name || t("anonymous")}
                        </button>
                        {post.users?.country && (
                          <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full flex-shrink-0">
                            {getCountryDisplayName(post.users.country)}{" "}
                            {/* FIXED */}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                          {formatDate(post.created_at)}
                          {post.last_edited_at && (
                            <span className="ml-2 text-gray-400 dark:text-gray-500 text-xs">
                              {t("edited") || "(edited)"}
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {post.post_comments?.length || 0}{" "}
                            {t("comments") || "comments"}
                          </span>
                          <span>
                            {post.view_count || 0} {t("views") || "views"}
                          </span>
                          <span>
                            {post.share_count || 0} {t("shares") || "shares"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    className="relative ml-2 flex-shrink-0 post-menu"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        setShowMenu(showMenu === post.id ? null : post.id)
                      }
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>

                    {showMenu === post.id && (
                      <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-10">
                        {isOwner ? (
                          <>
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setShowMenu(null);
                              }}
                              className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                            >
                              <Edit className="w-3.5 h-3.5" />
                              {t("edit") || "Edit"}
                            </button>
                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              {t("delete") || "Delete"}
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleReportPost(post.id)}
                            className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                          >
                            <Flag className="w-3.5 h-3.5" />
                            {t("report") || "Report"}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mb-3" onClick={(e) => e.stopPropagation()}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {post.media_urls.map((url, index) => {
                        const mediaKey = `${post.id}-${index}`;
                        const isExpanded = expandedMedia[mediaKey];
                        const mediaType =
                          post.media_types?.[index] || "document";

                        return (
                          <div key={index} className="relative">
                            <div
                              className={`rounded-lg overflow-hidden border border-blue-200 dark:border-gray-700 ${isExpanded ? "fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center" : ""}`}
                            >
                              {mediaType === "image" ? (
                                <div className="relative">
                                  <img
                                    src={url}
                                    alt={`Media ${index + 1}`}
                                    className={`${getMediaDisplayClass(mediaType, isExpanded)} ${isExpanded ? "cursor-zoom-out" : "cursor-zoom-in hover:opacity-95 transition-opacity"}`}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleMediaExpansion(post.id, index);
                                    }}
                                    loading="lazy"
                                  />
                                  {!isExpanded && (
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                      <ImageIcon className="w-3 h-3 inline mr-1" />
                                      Image
                                    </div>
                                  )}
                                </div>
                              ) : mediaType === "video" ? (
                                <div className="relative">
                                  <video
                                    src={url}
                                    controls
                                    className={`${getMediaDisplayClass(mediaType, isExpanded)} ${isExpanded ? "cursor-zoom-out" : "cursor-zoom-in"}`}
                                    onClick={(e) => {
                                      if (isExpanded) {
                                        e.stopPropagation();
                                        toggleMediaExpansion(post.id, index);
                                      }
                                    }}
                                    preload="metadata"
                                  />
                                  {!isExpanded && (
                                    <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                                      <VideoIcon className="w-3 h-3 inline mr-1" />
                                      Video
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      <FileIcon className="w-8 h-8 text-gray-500 dark:text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 mb-1">
                                        <FileIcon className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-gray-500 dark:text-gray-400">
                                          Document {index + 1}
                                        </span>
                                      </div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {url.split("/").pop()}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Click to download
                                      </p>
                                    </div>
                                  </div>
                                </a>
                              )}
                            </div>

                            {isExpanded && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMediaExpansion(post.id, index);
                                }}
                                className="absolute top-4 right-4 z-50 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                              >
                                <svg
                                  className="w-6 h-6 text-gray-800 dark:text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {post.media_urls.length > 2 && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          + {post.media_urls.length - 2} more files
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div
                  className="border-t dark:border-gray-700 pt-3 post-actions"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, "truth");
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-sm ${
                          userReaction?.reaction_type === "truth"
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span className="font-medium">
                          {t("truth") || "Truth"}
                        </span>
                        {reactionCounts.truth > 0 && (
                          <span className="ml-1 text-xs">
                            ({reactionCounts.truth})
                          </span>
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(post.id, "false");
                        }}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-full transition-colors text-sm ${
                          userReaction?.reaction_type === "false"
                            ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium">
                          {t("false") || "False"}
                        </span>
                        {reactionCounts.false > 0 && (
                          <span className="ml-1 text-xs">
                            ({reactionCounts.false})
                          </span>
                        )}
                      </button>
                    </div>

                    <div className="flex items-center gap-0">
                      <button
                        onClick={(e) => handleCommentIconClick(e, post.id)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Repeat className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSavePost(post.id);
                        }}
                        disabled={isSaving}
                        className={`p-1.5 rounded-full transition-colors ${
                          isSaving
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-gray-100 dark:hover:bg-gray-800"
                        } ${
                          isSaved
                            ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30"
                            : "text-gray-600 dark:text-gray-400"
                        }`}
                        title={
                          isSaved
                            ? t("unsave_post") || "Remove from saved"
                            : t("save_post") || "Save post"
                        }
                      >
                        {isSaving ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                        ) : isSaved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSharePost(post.id);
                        }}
                        disabled={sharing[post.id]}
                        className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ${
                          sharing[post.id]
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        title={t("share") || "Share"}
                      >
                        {sharing[post.id] ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                        ) : (
                          <Send className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-3 comment-section"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ""}
                        onChange={(e) =>
                          setCommentInputs({
                            ...commentInputs,
                            [post.id]: e.target.value,
                          })
                        }
                        placeholder={t("write_comment") || "Write a comment..."}
                        className="w-full px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white"
                        onKeyPress={(e) =>
                          e.key === "Enter" && handleComment(post.id)
                        }
                      />
                    </div>
                    <button
                      onClick={() => handleComment(post.id)}
                      disabled={!commentInputs[post.id]?.trim()}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t("send") || "Send"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}

      {hasMore && posts.length > 0 && (
        <div className="text-center py-4">
          <button
            onClick={() => {
              setPage(page + 1);
              loadPosts();
            }}
            disabled={loading}
            className="px-5 py-2 text-sm bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all font-medium"
          >
            {loading
              ? t("loading") || "Loading..."
              : t("load_more") || "Load more"}
          </button>
        </div>
      )}

      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={handleUpdatePost}
        />
      )}

      {showShareModal && (
        <ShareModal
          postId={showShareModal}
          onClose={() => setShowShareModal(null)}
        />
      )}
    </div>
  );
};

export default CountryFeed;
