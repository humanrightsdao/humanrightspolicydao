// src/pages/NotificationsPage.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Bell,
  Check,
  Trash2,
  Bookmark,
  ChevronRight,
  Globe,
} from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import CreatePostModal from "../components/CreatePostModal";
import useUserInfo from "../hooks/useUserInfo";
import usePosts from "../hooks/usePosts";
import { useCountry } from "../hooks/useCountry"; // ДОДАНО

const NotificationsPage = () => {
  const { t, i18n } = useTranslation();
  const { userInfo } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(i18n.language); // ДОДАНО
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("notifications");
  const [savedPosts, setSavedPosts] = useState([]);
  const [loadingSavedPosts, setLoadingSavedPosts] = useState(false);
  const [savedPostsError, setSavedPostsError] = useState("");
  const { getSavedPosts, removeSavedPost } = usePosts();

  const getCountryDisplayName = (countryCode) => {
    if (!countryCode || countryCode === "EARTH") return "";
    const translated = getTranslatedCountryName(countryCode);
    return translated || countryCode;
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  useEffect(() => {
    if (userInfo?.id) {
      loadNotifications();
      setupRealtimeNotifications();
    }
  }, [userInfo?.id]);

  useEffect(() => {
    if (activeTab === "saved" && userInfo?.id && savedPosts.length === 0) {
      loadSavedPosts();
    }
  }, [activeTab, userInfo]);

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
        navigate("/onboarding");
        return;
      }

      if (!profile?.has_completed_onboarding) {
        navigate("/onboarding");
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error(t("profile_load_error"), error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!userInfo?.id) return;

    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          sender:users!notifications_sender_id_fkey (
            id,
            unique_name,
            avatar_url,
            country
          ),
          post:posts!notifications_post_id_fkey (
            id,
            content,
            media_urls,
            media_types
          ),
          comment:post_comments!notifications_comment_id_fkey (
            id,
            content
          )
        `,
        )
        .eq("recipient_id", userInfo.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("❌ Error loading notifications:", error);
        return;
      }

      const formattedNotifications = data.map((notification) => ({
        id: notification.id,
        title: getNotificationTitle(notification),
        message: getNotificationMessage(notification),
        time: formatTimeAgo(notification.created_at),
        read: notification.is_read,
        type: notification.type,
        data: {
          sender: notification.sender,
          post: notification.post,
          comment: notification.comment,
          metadata: notification.metadata,
        },
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error("❌ Error loading notifications:", error);
    }
  };

  const setupRealtimeNotifications = () => {
    if (!userInfo?.id) return;

    try {
      const channel = supabase
        .channel(`notifications:${userInfo.id}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `recipient_id=eq.${userInfo.id}`,
          },
          (payload) => {
            console.log("🔔 New notification received:", payload.new);
            handleNewNotification(payload.new);
          },
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    } catch (error) {
      console.log("Realtime notifications not available, using polling");
    }
  };

  const handleNewNotification = async (notification) => {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          `
          *,
          sender:users!notifications_sender_id_fkey (
            id,
            unique_name,
            avatar_url,
            country
          ),
          post:posts!notifications_post_id_fkey (
            id,
            content,
            media_urls,
            media_types
          ),
          comment:post_comments!notifications_comment_id_fkey (
            id,
            content
          )
        `,
        )
        .eq("id", notification.id)
        .single();

      if (error) throw error;

      const formattedNotification = {
        id: data.id,
        title: getNotificationTitle(data),
        message: getNotificationMessage(data),
        time: formatTimeAgo(data.created_at),
        read: data.is_read,
        type: data.type,
        data: {
          sender: data.sender,
          post: data.post,
          comment: data.comment,
          metadata: data.metadata,
        },
      };

      setNotifications((prev) => [formattedNotification, ...prev]);
      showToastNotification(formattedNotification);
    } catch (error) {
      console.error("❌ Error processing new notification:", error);
    }
  };

  const showToastNotification = (notification) => {
    const toast = document.createElement("div");
    toast.className = `fixed top-4 right-4 z-50 p-3 rounded-lg shadow-lg border-l-4 ${
      notification.type === "reaction"
        ? "border-pink-500 bg-pink-50 dark:bg-pink-900/20"
        : notification.type === "comment"
          ? "border-green-500 bg-green-50 dark:bg-green-900/20"
          : notification.type === "post"
            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
            : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
    }`;
    toast.style.minWidth = "250px";
    toast.style.maxWidth = "300px";
    toast.style.animation = "slideInRight 0.3s ease-out";

    const icon = getNotificationIcon(notification.type);
    const colorClass = getNotificationColor(notification.type).split(" ")[0];

    toast.innerHTML = `
      <div class="flex items-start gap-2">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full ${colorClass} flex items-center justify-center text-sm">
            ${icon}
          </div>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-bold text-gray-900 dark:text-white text-xs mb-1">${notification.title}</h4>
          <p class="text-gray-700 dark:text-gray-300 text-xs mb-1 line-clamp-2">${notification.message}</p>
          <div class="flex items-center justify-between">
            <span class="text-xs text-gray-500 dark:text-gray-400">${notification.time}</span>
            <button class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
              ${t("close")}
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "slideOutRight 0.3s ease-in";
        setTimeout(() => {
          if (toast.parentNode) {
            document.body.removeChild(toast);
          }
        }, 300);
      }
    }, 5000);

    toast.querySelector("button").onclick = () => {
      toast.style.animation = "slideOutRight 0.3s ease-in";
      setTimeout(() => {
        if (toast.parentNode) {
          document.body.removeChild(toast);
        }
      }, 300);
    };
  };

  const loadSavedPosts = async () => {
    if (!userInfo?.id) return;

    setLoadingSavedPosts(true);
    setSavedPostsError("");

    try {
      const result = await getSavedPosts(userInfo.id, 0, 20);
      setSavedPosts(result.posts);
    } catch (error) {
      console.error("❌ Error loading saved posts:", error);
      setSavedPostsError(error.message || t("saved_posts_load_error"));
    } finally {
      setLoadingSavedPosts(false);
    }
  };

  const handleRemoveSavedPost = async (saveId, postId, e) => {
    e.stopPropagation();

    if (!window.confirm(t("remove_saved_post_confirm"))) {
      return;
    }

    try {
      const result = await removeSavedPost(saveId);

      if (result.success) {
        setSavedPosts((prev) => prev.filter((post) => post.save_id !== saveId));
        console.log("✅ Post removed from saved");
      } else {
        console.error("❌ Failed to remove saved post:", result.error);
        alert(t("remove_saved_post_error"));
      }
    } catch (error) {
      console.error("❌ Error removing saved post:", error);
      alert(t("remove_saved_post_error"));
    }
  };

  const markAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq("id", id);

      if (error) {
        console.error("❌ Error marking notification as read:", error);
      }
    } catch (error) {
      console.error("❌ Error marking notification as read:", error);
    }

    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq("recipient_id", userInfo.id)
        .eq("is_read", false);

      if (error) {
        console.error("❌ Error marking all as read:", error);
      }
    } catch (error) {
      console.error("❌ Error marking all as read:", error);
    }

    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })));
  };

  const deleteNotification = async (id) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("❌ Error deleting notification:", error);
      }
    } catch (error) {
      console.error("❌ Error deleting notification:", error);
    }

    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  };

  const deleteAllNotifications = async () => {
    if (!userInfo?.id) return;

    if (!window.confirm(t("confirm_delete_notifications"))) {
      return;
    }

    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .eq("recipient_id", userInfo.id);

      if (error) {
        console.error("❌ Error deleting all notifications:", error);
      }
    } catch (error) {
      console.error("❌ Error deleting all notifications:", error);
    }

    setNotifications([]);
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

  const getNotificationTitle = (notification) => {
    switch (notification.type) {
      case "post":
        return t("notification_title_post");
      case "reaction":
        return t("notification_title_reaction");
      case "comment":
        return t("notification_title_comment");
      case "comment_reaction":
        return t("notification_title_comment_reaction");
      case "system":
        return t("notification_title_system");
      case "welcome":
        return t("notification_title_welcome");
      default:
        return t("notification_title_default");
    }
  };

  const getNotificationMessage = (notification) => {
    const senderName = notification.sender?.unique_name || t("user");
    const reactionType = notification.metadata?.reaction_type;
    const postContent = notification.post?.content
      ? notification.post.content.substring(0, 30) +
        (notification.post.content.length > 30 ? "..." : "")
      : t("your_personal_profile");
    const commentContent = notification.comment?.content
      ? notification.comment.content.substring(0, 30) +
        (notification.comment.content.length > 30 ? "..." : "")
      : t("comment");

    switch (notification.type) {
      case "post":
        return t("notification_message_post", {
          sender: senderName,
          content: postContent,
        });
      case "reaction":
        if (reactionType === "truth") {
          return t("notification_message_reaction_truth", {
            sender: senderName,
          });
        } else {
          return t("notification_message_reaction_false", {
            sender: senderName,
          });
        }
      case "comment":
        return t("notification_message_comment", {
          sender: senderName,
          content: commentContent,
        });
      case "comment_reaction":
        return t("notification_message_comment_reaction", {
          sender: senderName,
        });
      case "system":
        return (
          notification.metadata?.message || t("notification_message_system")
        );
      case "welcome":
        return t("notification_message_welcome");
      default:
        return t("notification_message_default");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "post":
        return "📝";
      case "reaction":
        return "❤️";
      case "comment":
        return "💬";
      case "comment_reaction":
        return "↩️";
      case "system":
        return "⚙️";
      case "welcome":
        return "🎉";
      default:
        return "🔔";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "post":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400";
      case "reaction":
        return "bg-pink-100 dark:bg-pink-900/30 text-pink-700 dark:text-pink-400";
      case "comment":
        return "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400";
      case "comment_reaction":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400";
      case "system":
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
      case "welcome":
        return "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400";
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return t("just_now");

    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("just_now");
    if (diffMins < 60) return t("minutes_ago", { count: diffMins });
    if (diffHours < 24) return t("hours_ago", { count: diffHours });
    if (diffDays < 7) return t("days_ago", { count: diffDays });

    return date.toLocaleDateString();
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case "post":
      case "reaction":
        if (notification.data?.post?.id) {
          navigate(`/post/${notification.data.post.id}`);
        }
        break;
      case "comment":
      case "comment_reaction":
        if (notification.data?.post?.id) {
          navigate(
            `/post/${notification.data.post.id}#comment-${notification.data.comment?.id}`,
          );
        }
        break;
      default:
        break;
    }
  };

  const SavedPostsSection = () => {
    if (loadingSavedPosts) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (savedPostsError) {
      return (
        <div className="text-center py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-3">
            <p className="text-red-800 dark:text-red-300 text-sm">
              {savedPostsError}
            </p>
            <button
              onClick={loadSavedPosts}
              className="mt-3 px-3 py-1 bg-blue-600 text-white rounded-full hover:bg-blue-700 text-sm"
            >
              {t("retry")}
            </button>
          </div>
        </div>
      );
    }

    if (savedPosts.length === 0) {
      return (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 text-center">
          <Bookmark className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
            {t("no_saved_posts")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            {t("no_saved_posts_description")}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {savedPosts.map((post) => (
          <div
            key={post.save_id || post.id}
            onClick={(e) => {
              if (!e.target.closest(".delete-button")) {
                navigate(`/post/${post.id}`);
              }
            }}
            className="bg-white dark:bg-gray-900 rounded-xl shadow border border-blue-200 dark:border-blue-800 p-4 cursor-pointer hover:shadow-md transition-shadow relative group"
          >
            <button
              onClick={(e) => handleRemoveSavedPost(post.save_id, post.id, e)}
              className="absolute top-2 right-2 delete-button p-1 opacity-0 group-hover:opacity-100 transition-opacity bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-full"
              title={t("remove_from_saved")}
            >
              <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
            </button>

            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0">
                  {post.users?.avatar_url ? (
                    <img
                      src={post.users.avatar_url}
                      alt={post.users?.unique_name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                      {post.users?.unique_name?.[0]?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-1">
                    <span className="font-bold text-gray-900 dark:text-white text-sm">
                      {post.users?.unique_name || t("anonymous")}
                    </span>
                    {post.users?.country && post.users.country !== "EARTH" && (
                      <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs rounded-full">
                        {getCountryDisplayName(post.users.country)}{" "}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 text-xs line-clamp-2 mb-1">
                    {post.content}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span className="text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs">
                        {post.post_reactions?.length || 0} {t("reactions")}
                      </span>
                      <span className="text-xs">
                        {post.post_comments?.length || 0} {t("comments")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="ml-3 flex-shrink-0">
                <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full text-xs flex items-center gap-1">
                  <Bookmark className="w-2.5 h-2.5" />
                  {t("saved")}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {new Date(post.saved_at).toLocaleDateString()}
                </div>
              </div>
            </div>

            {post.media_urls && post.media_urls.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-1 overflow-x-auto pb-1">
                  {post.media_urls.slice(0, 3).map((url, index) => (
                    <div key={index} className="flex-shrink-0">
                      {post.media_types?.[index] === "image" ? (
                        <img
                          src={url}
                          alt={`Media ${index + 1}`}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                          <span className="text-xs text-gray-500">
                            {t("attachment")}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                  {post.media_urls.length > 3 && (
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        +{post.media_urls.length - 3}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
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
      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          userCountry={userInfo?.country || "EARTH"}
        />
      )}

      <div className="h-full p-4">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {activeTab === "notifications" ? (
                  <Bell className="w-6 h-6 text-yellow-600" />
                ) : (
                  <Bookmark className="w-6 h-6 text-blue-600" />
                )}
                {activeTab === "notifications"
                  ? t("notifications")
                  : t("saved_posts")}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                {activeTab === "notifications"
                  ? t("notifications_description")
                  : t("saved_posts_description")}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {activeTab === "notifications" && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 flex items-center gap-1 text-sm"
                    disabled={notifications.filter((n) => !n.read).length === 0}
                  >
                    <Check className="w-3 h-3" />
                    {t("mark_all_read")}
                  </button>
                  {notifications.length > 0 && (
                    <button
                      onClick={deleteAllNotifications}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-full hover:bg-red-700 flex items-center gap-1 text-sm"
                    >
                      <Trash2 className="w-3 h-3" />
                      {t("delete_all")}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-1 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab("notifications")}
                className={`flex-1 px-3 py-2 rounded-lg text-center transition-all text-sm ${
                  activeTab === "notifications"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Bell className="w-4 h-4" />
                  <span className="font-medium">{t("notifications")}</span>
                  {notifications.filter((n) => !n.read).length > 0 && (
                    <span className="bg-red-500 text-white text-xs px-1 py-0.5 rounded-full">
                      {notifications.filter((n) => !n.read).length}
                    </span>
                  )}
                </div>
              </button>

              <button
                onClick={() => setActiveTab("saved")}
                className={`flex-1 px-3 py-2 rounded-lg text-center transition-all text-sm ${
                  activeTab === "saved"
                    ? "bg-blue-600 text-white"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                <div className="flex items-center justify-center gap-1">
                  <Bookmark className="w-4 h-4" />
                  <span className="font-medium">{t("saved_posts")}</span>
                  {savedPosts.length > 0 && (
                    <span className="bg-blue-500 text-white text-xs px-1 py-0.5 rounded-full">
                      {savedPosts.length}
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </div>

        {activeTab === "notifications" ? (
          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-8 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-base font-medium text-gray-900 dark:text-white mb-1">
                  {t("no_notifications")}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {t("no_notifications_description")}
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`bg-white dark:bg-gray-900 rounded-xl shadow border ${
                    !notification.read
                      ? "border-blue-300 dark:border-blue-700"
                      : "border-gray-200 dark:border-gray-700"
                  } p-4 cursor-pointer hover:shadow-md transition-all hover:translate-x-0.5`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg ${getNotificationColor(
                          notification.type,
                        )}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className="font-bold text-gray-900 dark:text-white text-sm">
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full">
                              {t("new")}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-1 line-clamp-2">
                          {notification.message}
                        </p>

                        {notification.data?.sender && (
                          <div className="flex items-center gap-1 mb-1">
                            <div className="flex items-center gap-1">
                              {notification.data.sender.avatar_url ? (
                                <img
                                  src={notification.data.sender.avatar_url}
                                  alt={notification.data.sender.unique_name}
                                  className="w-4 h-4 rounded-full"
                                />
                              ) : (
                                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs">
                                  {notification.data.sender.unique_name?.[0]?.toUpperCase() ||
                                    "U"}
                                </div>
                              )}
                              <span className="text-xs font-medium text-gray-900 dark:text-white">
                                {notification.data.sender.unique_name}
                              </span>
                            </div>
                            {notification.data.sender.country &&
                              notification.data.sender.country !== "EARTH" && (
                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                  <Globe className="w-2.5 h-2.5" />
                                  <span className="text-xs">
                                    {getCountryDisplayName(
                                      notification.data.sender.country,
                                    )}{" "}
                                  </span>
                                </div>
                              )}
                          </div>
                        )}

                        <div className="flex items-center justify-between">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {notification.time}
                          </p>
                          <ChevronRight className="w-3 h-3 text-gray-400" />
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="p-1 hover:bg-green-100 dark:hover:bg-green-900/20 rounded-full"
                          title={t("mark_as_read")}
                        >
                          <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-full"
                        title={t("delete")}
                      >
                        <Trash2 className="w-3 h-3 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <SavedPostsSection />
        )}
      </div>

      <style jsx="true">{`
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
      `}</style>
    </Layout>
  );
};

export default NotificationsPage;
