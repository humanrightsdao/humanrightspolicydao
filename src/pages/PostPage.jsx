// src/pages/PostPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
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
  ArrowLeft,
  Clock,
  Share2,
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  BookmarkCheck,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";
import EditPostModal from "../components/EditPostModal";
import useUserInfo from "../hooks/useUserInfo";
import CreatePostModal from "../components/CreatePostModal";
import { useCountry } from "../hooks/useCountry"; // ADDED IMPORT

const PostPage = () => {
  const { t, i18n } = useTranslation(); // ADDED i18n
  const { postId } = useParams();
  const navigate = useNavigate();
  const { userInfo, loading: userLoading } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(i18n.language); // ADDED HOOK

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [commentInput, setCommentInput] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [expandedMedia, setExpandedMedia] = useState({});
  const [editingPost, setEditingPost] = useState(null);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [showCommentMenu, setShowCommentMenu] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savingPost, setSavingPost] = useState(false);

  // Function to get displayed country name (added)
  const getCountryDisplayName = (countryCode) => {
    if (!countryCode || countryCode === "EARTH") return "";
    const translated = getTranslatedCountryName(countryCode);
    return translated || countryCode;
  };

  useEffect(() => {
    if (!userLoading) {
      loadPost();
    }
  }, [postId, userLoading]);

  const loadPost = async () => {
    setLoading(true);
    setError("");

    try {
      // Load post with all related data
      const { data: postData, error: postError } = await supabase
        .from("posts")
        .select(
          `
          *,
          users (
            id,
            unique_name,
            avatar_url,
            country
          ),
          post_reactions (
            reaction_type,
            user_id
          ),
          post_comments (
            id,
            content,
            created_at,
            updated_at,
            user_id,
            users (
              id,
              unique_name,
              avatar_url,
              country
            )
          ),
          post_reposts (
            id
          ),
          post_saves (
            id
          )
        `,
        )
        .eq("id", postId)
        .eq("is_deleted", false)
        .single();

      if (postError) throw postError;

      // Check if post is saved
      if (userInfo?.id) {
        const { data: saveData } = await supabase
          .from("post_saves")
          .select("id")
          .eq("post_id", postId)
          .eq("user_id", userInfo.id)
          .single();

        setIsSaved(!!saveData);
      }

      // Update view count
      await supabase
        .from("posts")
        .update({
          view_count: (postData.view_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      // Get comment reactions
      if (postData.post_comments && postData.post_comments.length > 0) {
        const commentIds = postData.post_comments.map((c) => c.id);

        const { data: commentReactionsData, error: reactionsError } =
          await supabase
            .from("comment_reactions")
            .select("*")
            .in("comment_id", commentIds);

        if (!reactionsError) {
          // Combine comments with their reactions
          const commentsWithReactions = postData.post_comments.map(
            (comment) => ({
              ...comment,
              comment_reactions:
                commentReactionsData?.filter(
                  (reaction) => reaction.comment_id === comment.id,
                ) || [],
            }),
          );

          setComments(commentsWithReactions);
        } else {
          setComments(postData.post_comments);
        }
      } else {
        setComments([]);
      }

      setPost({
        ...postData,
        view_count: (postData.view_count || 0) + 1,
      });
    } catch (error) {
      console.error("❌ Error loading post:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReaction = async (reactionType) => {
    try {
      if (!userInfo) {
        alert(t("login_to_react") || "Please log in to react");
        return;
      }

      const existingReaction = post.post_reactions?.find(
        (r) => r.user_id === userInfo.id,
      );

      // Remove any existing user reaction
      if (existingReaction) {
        await supabase.from("post_reactions").delete().match({
          post_id: post.id,
          user_id: userInfo.id,
        });
      }

      // Add new reaction (if user is not clicking the same reaction)
      if (
        !existingReaction ||
        existingReaction.reaction_type !== reactionType
      ) {
        const { data } = await supabase
          .from("post_reactions")
          .insert([
            {
              post_id: post.id,
              user_id: userInfo.id,
              reaction_type: reactionType,
            },
          ])
          .select()
          .single();

        // Update local state
        setPost((prev) => {
          const existingReactions =
            prev.post_reactions?.filter((r) => r.user_id !== userInfo.id) || [];

          return {
            ...prev,
            post_reactions: [...existingReactions, data],
          };
        });
      } else {
        // If user clicks the same reaction - just remove it
        setPost((prev) => ({
          ...prev,
          post_reactions:
            prev.post_reactions?.filter((r) => r.user_id !== userInfo.id) || [],
        }));
      }
    } catch (error) {
      console.error("❌ Error adding reaction:", error);
    }
  };

  const handleCommentReaction = async (commentId, reactionType) => {
    try {
      if (!userInfo) {
        alert(t("login_to_react") || "Please log in to react");
        return;
      }

      // Find the comment
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const existingReaction = comment.comment_reactions?.find(
        (r) => r.user_id === userInfo.id,
      );

      // Remove existing user reaction
      if (existingReaction) {
        await supabase.from("comment_reactions").delete().match({
          comment_id: commentId,
          user_id: userInfo.id,
        });
      }

      // Add new reaction (if user is not clicking the same reaction)
      if (
        !existingReaction ||
        existingReaction.reaction_type !== reactionType
      ) {
        const { data } = await supabase
          .from("comment_reactions")
          .insert([
            {
              comment_id: commentId,
              user_id: userInfo.id,
              reaction_type: reactionType,
            },
          ])
          .select()
          .single();

        if (data) {
          // Update local state
          setComments((prev) =>
            prev.map((comment) =>
              comment.id === commentId
                ? {
                    ...comment,
                    comment_reactions: [
                      ...(comment.comment_reactions?.filter(
                        (r) => r.user_id !== userInfo.id,
                      ) || []),
                      data,
                    ],
                  }
                : comment,
            ),
          );
        }
      } else {
        // If user clicks the same reaction - just remove it
        setComments((prev) =>
          prev.map((comment) =>
            comment.id === commentId
              ? {
                  ...comment,
                  comment_reactions:
                    comment.comment_reactions?.filter(
                      (r) => r.user_id !== userInfo.id,
                    ) || [],
                }
              : comment,
          ),
        );
      }
    } catch (error) {
      console.error("❌ Error adding comment reaction:", error);
      alert(t("reaction_error") || "Error adding reaction");
    }
  };

  const handleComment = async () => {
    if (!commentInput.trim()) return;
    if (!userInfo) {
      alert(t("login_to_comment") || "Please log in to comment");
      return;
    }

    setPostingComment(true);

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .insert([
          {
            post_id: post.id,
            user_id: userInfo.id,
            content: commentInput.trim(),
          },
        ])
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

      if (error) throw error;

      // Add comment with empty reactions
      const newComment = {
        ...data,
        comment_reactions: [],
      };

      // Add comment to the list
      setComments((prev) => [newComment, ...prev]);
      setCommentInput("");

      // Update comment count in the post
      setPost((prev) => ({
        ...prev,
        post_comments: [...(prev.post_comments || []), { id: data.id }],
      }));
    } catch (error) {
      console.error("❌ Error adding comment:", error);
      alert(t("comment_error") || "Error adding comment");
    } finally {
      setPostingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (
      !window.confirm(
        t("confirm_delete_comment") ||
          "Are you sure you want to delete this comment?",
      )
    ) {
      return;
    }

    try {
      await supabase
        .from("post_comments")
        .update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commentId)
        .eq("user_id", userInfo?.id);

      // Update local state
      setComments((prev) => prev.filter((comment) => comment.id !== commentId));
      setShowCommentMenu(null);

      alert(t("comment_deleted") || "Comment deleted");
    } catch (error) {
      console.error("❌ Error deleting comment:", error);
      alert(t("delete_error") || "Error deleting comment");
    }
  };

  const handleEditComment = (comment) => {
    setEditingComment(comment);
    setEditCommentText(comment.content);
    setShowCommentMenu(null);
  };

  const handleUpdateComment = async () => {
    if (!editCommentText.trim()) return;

    try {
      const { data, error } = await supabase
        .from("post_comments")
        .update({
          content: editCommentText.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", editingComment.id)
        .eq("user_id", userInfo?.id)
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

      if (error) throw error;

      // Keep reactions when updating
      const existingComment = comments.find((c) => c.id === editingComment.id);
      const updatedCommentWithReactions = {
        ...data,
        comment_reactions: existingComment?.comment_reactions || [],
      };

      // Update local state
      setComments((prev) =>
        prev.map((comment) =>
          comment.id === editingComment.id
            ? updatedCommentWithReactions
            : comment,
        ),
      );
      setEditingComment(null);
      setEditCommentText("");
    } catch (error) {
      console.error("❌ Error updating comment:", error);
      alert(t("edit_error") || "Error editing comment");
    }
  };

  const handleDeletePost = async () => {
    if (
      !window.confirm(
        t("confirm_delete_post") ||
          "Are you sure you want to delete this post?",
      )
    )
      return;

    try {
      await supabase
        .from("posts")
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .eq("user_id", userInfo?.id);

      alert(t("post_deleted") || "Post deleted");
      navigate(-1);
    } catch (error) {
      console.error("❌ Error deleting post:", error);
      alert(t("delete_error") || "Error deleting post");
    }
  };

  const handleReportPost = async () => {
    if (
      !window.confirm(
        t("confirm_report_post") ||
          "Are you sure you want to report this post?",
      )
    )
      return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      await supabase.from("post_reports").insert([
        {
          post_id: post.id,
          user_id: user.id,
          reason: "user_report",
          status: "pending",
        },
      ]);

      alert(t("report_success") || "Report sent successfully!");
    } catch (error) {
      console.error("❌ Error reporting post:", error);
      alert(t("report_error") || "Error sending report");
    }
  };

  const handleUpdatePost = (updatedPost) => {
    setPost(updatedPost);
    setEditingPost(null);
  };

  const handleSavePost = async () => {
    if (!userInfo) {
      alert(t("login_to_save") || "Please log in to save posts");
      return;
    }

    try {
      setSavingPost(true);

      if (isSaved) {
        // Remove save
        await supabase
          .from("post_saves")
          .delete()
          .eq("post_id", post.id)
          .eq("user_id", userInfo.id);

        setIsSaved(false);
        alert(t("post_unsaved_success") || "Post removed from saved");
      } else {
        // Add save
        await supabase.from("post_saves").insert([
          {
            post_id: post.id,
            user_id: userInfo.id,
          },
        ]);

        setIsSaved(true);
        alert(t("post_saved_success") || "Post saved!");
      }
    } catch (error) {
      console.error("❌ Error saving post:", error);
      alert(t("save_error") || "Error saving post");
    } finally {
      setSavingPost(false);
    }
  };

  const handleSharePost = async () => {
    try {
      setSharing(true);

      // Update share count
      const { data } = await supabase
        .from("posts")
        .update({
          share_count: (post.share_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .select()
        .single();

      if (data) {
        setPost(data);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error("❌ Error sharing post:", error);
      alert(t("share_error") || "Error sharing post");
    } finally {
      setSharing(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const shareUrl = `${window.location.origin}/post/${postId}`;
      await navigator.clipboard.writeText(shareUrl);

      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    } catch (err) {
      console.error("❌ Failed to copy:", err);

      const textArea = document.createElement("textarea");
      textArea.value = `${window.location.origin}/post/${postId}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);

      setCopyStatus(true);
      setTimeout(() => setCopyStatus(false), 2000);
    }
  };

  const shareToSocial = (platform) => {
    const shareUrl = `${window.location.origin}/post/${postId}`;
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

  const getReactionCounts = () => {
    const reactions = post.post_reactions || [];
    return {
      truth: reactions.filter((r) => r.reaction_type === "truth").length,
      false: reactions.filter((r) => r.reaction_type === "false").length,
    };
  };

  const getCommentReactionCounts = (comment) => {
    const reactions = comment.comment_reactions || [];
    return {
      truth: reactions.filter((r) => r.reaction_type === "truth").length,
      false: reactions.filter((r) => r.reaction_type === "false").length,
    };
  };

  const toggleMediaExpansion = (index) => {
    setExpandedMedia((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const getMediaDisplayClass = (type, isExpanded) => {
    if (isExpanded) {
      return "w-full max-h-[80vh]";
    }
    switch (type) {
      case "image":
        return "w-full max-h-[500px] object-contain";
      case "video":
        return "w-full max-h-[500px]";
      default:
        return "w-full";
    }
  };

  const ShareModal = () => {
    const shareUrl = `${window.location.origin}/post/${postId}`;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
        <div
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("share_post") || "Share Post"}
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
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
                      src={post.users.avatar_url}
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
                onClick={() => shareToSocial("facebook")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
              >
                <Facebook className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Facebook
                </span>
              </button>

              <button
                onClick={() => shareToSocial("twitter")}
                className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-xl transition-colors"
              >
                <Twitter className="w-8 h-8 text-blue-400 dark:text-blue-300 mb-2" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Twitter
                </span>
              </button>

              <button
                onClick={() => shareToSocial("linkedin")}
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
                {t("copy_link") || "Copy Link"}
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-2 bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-700 overflow-hidden">
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {shareUrl}
                  </p>
                </div>
                <button
                  onClick={copyToClipboard}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    copyStatus
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {copyStatus ? (
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

  const isOwner = userInfo && post && post.user_id === userInfo.id;

  // Create userProfile object for Layout from userInfo
  const userProfile = userInfo
    ? {
        ...userInfo,
        // Add fields expected by Layout
        has_completed_onboarding: userInfo.hasCompletedOnboarding || true,
        email: userInfo.email,
        unique_name: userInfo.uniqueName,
        country: userInfo.country,
      }
    : null;

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error(t("logout_error"), error);
      alert(t("logout_failed"));
    }
  };

  if (userLoading) {
    return (
      <Layout userProfile={null} loading={true}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout userProfile={userProfile} loading={false}>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </Layout>
    );
  }

  if (error || !post) {
    return (
      <Layout userProfile={userProfile} loading={false}>
        <div className="text-center py-12 text-red-600 dark:text-red-400">
          <p>{error || t("post_not_found") || "Post not found"}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          >
            {t("go_back") || "Back"}
          </button>
        </div>
      </Layout>
    );
  }

  const reactionCounts = getReactionCounts();
  const userReaction = post.post_reactions?.find(
    (r) => r.user_id === userInfo?.id,
  );

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
          // Display modal instead of main content
          <div className="h-full">
            <CreatePostModal
              onClose={() => setShowCreatePostModal(false)}
              userCountry={userInfo?.country || "EARTH"}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto h-full">
            {/* Back button */}
            <button
              onClick={() => navigate(-1)}
              className="mb-6 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              {t("back") || "Back"}
            </button>

            {/* Post in minimalist style */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 mb-6">
              {/* Post header */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="relative flex-shrink-0">
                      {post.users?.avatar_url ? (
                        <img
                          src={post.users.avatar_url}
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
                      {/* REMOVED globe icon from avatar */}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 dark:text-white truncate">
                          {post.users?.unique_name || t("anonymous")}
                        </h3>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(post.created_at)}
                            {post.last_edited_at && (
                              <span className="ml-2 text-gray-400 dark:text-gray-500 text-xs">
                                (edited)
                              </span>
                            )}
                          </p>
                          {post.users?.country &&
                            post.users.country !== "EARTH" && (
                              <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3 text-gray-400" />
                                <span className="text-xs text-blue-600 dark:text-blue-400">
                                  {getCountryDisplayName(post.users.country)}{" "}
                                  {/* FIXED: using translation */}
                                </span>
                              </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {comments.length || 0} {t("comments") || "comments"}
                          </span>
                          <span>
                            {post.view_count || 0} {t("views") || "views"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Post menu */}
                  {userInfo && (
                    <div className="relative ml-2 flex-shrink-0">
                      <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-10">
                          {isOwner ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingPost(post);
                                  setShowMenu(false);
                                }}
                                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                              >
                                <Edit className="w-3.5 h-3.5" />
                                {t("edit") || "Edit"}
                              </button>
                              <button
                                onClick={handleDeletePost}
                                className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {t("delete") || "Delete"}
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={handleReportPost}
                              className="w-full px-3 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                            >
                              <Flag className="w-3.5 h-3.5" />
                              {t("report") || "Report"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Post content */}
                <div className="mb-3">
                  <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Media files */}
                {post.media_urls && post.media_urls.length > 0 && (
                  <div className="mb-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {post.media_urls.map((url, index) => {
                        const mediaKey = index;
                        const isExpanded = expandedMedia[mediaKey];
                        const mediaType =
                          post.media_types?.[index] || "document";

                        return (
                          <div key={index} className="relative">
                            <div
                              className={`rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 ${
                                isExpanded
                                  ? "fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
                                  : ""
                              }`}
                            >
                              {mediaType === "image" ? (
                                <div className="relative">
                                  <img
                                    src={url}
                                    alt={`Media ${index + 1}`}
                                    className={`${
                                      isExpanded
                                        ? "w-full max-h-[80vh] cursor-zoom-out"
                                        : "w-full max-h-[400px] object-contain cursor-zoom-in hover:opacity-95 transition-opacity"
                                    }`}
                                    onClick={() => toggleMediaExpansion(index)}
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
                                    className={`${
                                      isExpanded
                                        ? "w-full max-h-[80vh] cursor-zoom-out"
                                        : "w-full max-h-[400px] cursor-zoom-in"
                                    }`}
                                    onClick={() =>
                                      isExpanded && toggleMediaExpansion(index)
                                    }
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

                            {/* Close button for expanded media */}
                            {isExpanded && (
                              <button
                                onClick={() => toggleMediaExpansion(index)}
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
                  </div>
                )}

                {/* Action panel */}
                <div className="border-t dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between">
                    {/* Reaction buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReaction("truth")}
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
                        onClick={() => handleReaction("false")}
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

                    {/* Other actions */}
                    <div className="flex items-center gap-0">
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden">
                        <MessageCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors hidden">
                        <Repeat className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </button>

                      <button
                        onClick={handleSharePost}
                        disabled={sharing}
                        className={`p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors ${
                          sharing ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        title={t("share") || "Share"}
                      >
                        {sharing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                        ) : (
                          <Send className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        )}
                      </button>

                      <button
                        onClick={handleSavePost}
                        disabled={savingPost}
                        className={`p-1.5 rounded-full transition-colors ${
                          savingPost
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
                        {savingPost ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
                        ) : isSaved ? (
                          <BookmarkCheck className="w-4 h-4" />
                        ) : (
                          <Bookmark className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments section in minimalist style */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b dark:border-gray-700">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {t("comments") || "Comments"} ({comments.length})
                </h3>
              </div>

              {/* Add comment form */}
              {userInfo && (
                <div className="p-4 border-b dark:border-gray-700">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {userInfo.avatarUrl ? (
                        <img
                          src={userInfo.avatarUrl}
                          alt={userInfo.uniqueName || t("anonymous")}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-gray-800"
                          onError={(e) => {
                            e.target.style.display = "none";
                            const parent = e.target.parentElement;
                            const fallback = document.createElement("div");
                            fallback.className =
                              "w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold";
                            fallback.textContent =
                              userInfo.uniqueName?.[0]?.toUpperCase() || "U";
                            parent.appendChild(fallback);
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {userInfo.uniqueName?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {userInfo.uniqueName || t("anonymous")}
                        </span>
                        {userInfo.country && userInfo.country !== "EARTH" && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {getCountryDisplayName(userInfo.country)}{" "}
                              {/* FIXED: using translation */}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={commentInput}
                          onChange={(e) => setCommentInput(e.target.value)}
                          placeholder={
                            t("write_comment") || "Write a comment..."
                          }
                          className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white"
                          onKeyPress={(e) =>
                            e.key === "Enter" && handleComment()
                          }
                        />
                        <button
                          onClick={handleComment}
                          disabled={!commentInput.trim() || postingComment}
                          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {postingComment
                            ? t("posting") || "Posting..."
                            : t("post") || "Post"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments list */}
              <div className="divide-y dark:divide-gray-700">
                {comments.length === 0 ? (
                  <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                    <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">
                      {t("no_comments_yet") || "No comments yet"}
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => {
                    const commentReactionCounts =
                      getCommentReactionCounts(comment);
                    const userCommentReaction = comment.comment_reactions?.find(
                      (r) => r.user_id === userInfo?.id,
                    );

                    return (
                      <div
                        key={comment.id}
                        className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                      >
                        {editingComment?.id === comment.id ? (
                          // Editing comment
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {comment.users?.avatar_url ? (
                                <img
                                  src={comment.users.avatar_url}
                                  alt={
                                    comment.users?.unique_name || t("anonymous")
                                  }
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const parent = e.target.parentElement;
                                    const fallback =
                                      document.createElement("div");
                                    fallback.className =
                                      "w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs";
                                    fallback.textContent =
                                      comment.users?.unique_name?.[0]?.toUpperCase() ||
                                      "U";
                                    parent.appendChild(fallback);
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                  {comment.users?.unique_name?.[0]?.toUpperCase() ||
                                    "U"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {comment.users?.unique_name ||
                                      t("anonymous")}
                                  </span>
                                  {comment.users?.country &&
                                    comment.users.country !== "EARTH" && (
                                      <div className="flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-blue-600 dark:text-blue-400">
                                          {getCountryDisplayName(
                                            comment.users.country,
                                          )}{" "}
                                          {/* FIXED: using translation */}
                                        </span>
                                      </div>
                                    )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mb-2">
                                <input
                                  type="text"
                                  value={editCommentText}
                                  onChange={(e) =>
                                    setEditCommentText(e.target.value)
                                  }
                                  className="w-full px-3 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white"
                                  placeholder={
                                    t("edit_comment") || "Edit comment..."
                                  }
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={handleUpdateComment}
                                  disabled={!editCommentText.trim()}
                                  className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50"
                                >
                                  {t("save") || "Save"}
                                </button>
                                <button
                                  onClick={() => setEditingComment(null)}
                                  className="px-3 py-1.5 text-xs bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-300 rounded-full hover:bg-gray-400 dark:hover:bg-gray-600"
                                >
                                  {t("cancel") || "Cancel"}
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          // Display comment
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0">
                              {comment.users?.avatar_url ? (
                                <img
                                  src={comment.users.avatar_url}
                                  alt={
                                    comment.users?.unique_name || t("anonymous")
                                  }
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white dark:border-gray-800"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    const parent = e.target.parentElement;
                                    const fallback =
                                      document.createElement("div");
                                    fallback.className =
                                      "w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs";
                                    fallback.textContent =
                                      comment.users?.unique_name?.[0]?.toUpperCase() ||
                                      "U";
                                    parent.appendChild(fallback);
                                  }}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                  {comment.users?.unique_name?.[0]?.toUpperCase() ||
                                    "U"}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                                    {comment.users?.unique_name ||
                                      t("anonymous")}
                                  </h4>
                                  {comment.users?.country &&
                                    comment.users.country !== "EARTH" && (
                                      <div className="flex items-center gap-1">
                                        <Globe className="w-3 h-3 text-gray-400" />
                                        <span className="text-xs text-blue-600 dark:text-blue-400">
                                          {getCountryDisplayName(
                                            comment.users.country,
                                          )}{" "}
                                          {/* FIXED: using translation */}
                                        </span>
                                      </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatDate(comment.created_at)}
                                    {comment.updated_at !==
                                      comment.created_at && (
                                      <span className="ml-1 text-gray-400 dark:text-gray-500">
                                        (edited)
                                      </span>
                                    )}
                                  </p>
                                  {userInfo &&
                                    (userInfo.id === comment.user_id ||
                                      userInfo.id === post.user_id) && (
                                      <div className="relative">
                                        <button
                                          onClick={() =>
                                            setShowCommentMenu(
                                              showCommentMenu === comment.id
                                                ? null
                                                : comment.id,
                                            )
                                          }
                                          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                                        >
                                          <MoreVertical className="w-3 h-3 text-gray-500" />
                                        </button>

                                        {showCommentMenu === comment.id && (
                                          <div className="absolute right-0 mt-1 w-32 bg-white dark:bg-gray-800 rounded-lg shadow-xl border dark:border-gray-700 z-10">
                                            {userInfo.id ===
                                              comment.user_id && (
                                              <button
                                                onClick={() =>
                                                  handleEditComment(comment)
                                                }
                                                className="w-full px-3 py-2 text-left text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                                              >
                                                <Edit className="w-3 h-3" />
                                                {t("edit") || "Edit"}
                                              </button>
                                            )}
                                            {(userInfo.id === comment.user_id ||
                                              userInfo.id === post.user_id) && (
                                              <button
                                                onClick={() =>
                                                  handleDeleteComment(
                                                    comment.id,
                                                  )
                                                }
                                                className="w-full px-3 py-2 text-left text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                                {t("delete") || "Delete"}
                                              </button>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                </div>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap leading-relaxed mb-2">
                                {comment.content}
                              </p>

                              {/* Reaction buttons for comments */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    handleCommentReaction(comment.id, "truth")
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                                    userCommentReaction?.reaction_type ===
                                    "truth"
                                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{t("truth") || "Truth"}</span>
                                  {commentReactionCounts.truth > 0 && (
                                    <span className="ml-1">
                                      ({commentReactionCounts.truth})
                                    </span>
                                  )}
                                </button>
                                <button
                                  onClick={() =>
                                    handleCommentReaction(comment.id, "false")
                                  }
                                  className={`flex items-center gap-1 px-2 py-1 text-xs rounded-full transition-colors ${
                                    userCommentReaction?.reaction_type ===
                                    "false"
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
                                  }`}
                                >
                                  <XCircle className="w-3 h-3" />
                                  <span>{t("false") || "False"}</span>
                                  {commentReactionCounts.false > 0 && (
                                    <span className="ml-1">
                                      ({commentReactionCounts.false})
                                    </span>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit post modal */}
      {editingPost && (
        <EditPostModal
          post={editingPost}
          onClose={() => setEditingPost(null)}
          onUpdate={handleUpdatePost}
        />
      )}

      {/* Share modal */}
      {showShareModal && <ShareModal />}
    </Layout>
  );
};

export default PostPage;
