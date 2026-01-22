// src/hooks/usePosts.js
import { useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

export default function usePosts() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Create post
  const createPost = useCallback(
    async (postData) => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        const { data: profile } = await supabase
          .from("users")
          .select("country")
          .eq("id", user.id)
          .single();

        const post = {
          user_id: user.id,
          country_code: profile?.country || "EARTH",
          content: postData.content,
          media_urls: postData.mediaUrls || [],
          media_types: postData.mediaTypes || [],
          share_count: 0,
        };

        console.log("Saving post to database:", post);

        const { data, error: insertError } = await supabase
          .from("posts")
          .insert([post])
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

        if (insertError) {
          throw new Error(insertError.message);
        }

        console.log("Post saved successfully:", data);
        return data;
      } catch (error) {
        console.error("❌ Error creating post:", error);
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // Update post
  const updatePost = useCallback(
    async (postId, updateData) => {
      setLoading(true);
      setError("");

      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        const updatePayload = {
          content: updateData.content,
          media_urls: updateData.media_urls || [],
          media_types: updateData.media_types || [],
          updated_at: new Date().toISOString(),
        };

        if (updateData.edit_count !== undefined) {
          updatePayload.edit_count = updateData.edit_count;
        }

        if (!updatePayload.last_edited_at) {
          updatePayload.last_edited_at = new Date().toISOString();
        }

        console.log("Updating post:", { postId, updatePayload });

        const { data, error: updateError } = await supabase
          .from("posts")
          .update(updatePayload)
          .eq("id", postId)
          .eq("user_id", user.id)
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

        if (updateError) {
          console.error("❌ Update error details:", updateError);
          throw new Error(updateError.message);
        }

        console.log("Post updated successfully:", data);
        return data;
      } catch (error) {
        console.error("❌ Error updating post:", error);
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // Get posts for country (with option to get all posts)
  const getCountryPosts = useCallback(
    async (countryCode, page = 0, limit = 20) => {
      setLoading(true);
      setError("");

      try {
        const from = page * limit;
        const to = from + limit - 1;

        let query = supabase
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
            id
          ),
          post_reposts (
            id
          ),
          post_saves (
            id
          )
        `,
            { count: "exact" },
          )
          .eq("is_deleted", false);

        if (countryCode && countryCode !== "EARTH" && countryCode !== "") {
          query = query.eq("country_code", countryCode);
        }

        const {
          data,
          error: fetchError,
          count,
        } = await query
          .order("created_at", { ascending: false })
          .range(from, to);

        if (fetchError) {
          throw new Error(fetchError.message);
        }

        return { posts: data, totalCount: count };
      } catch (error) {
        console.error("❌ Error fetching posts:", error);
        setError(error.message);
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Get all posts (without country filtering)
  const getAllPosts = useCallback(
    async (page = 0, limit = 20) => {
      return await getCountryPosts(null, page, limit);
    },
    [getCountryPosts],
  );

  // Get posts of a specific user
  const getUserPosts = useCallback(async (userId, page = 0, limit = 20) => {
    console.log("🔍 getUserPosts called with:", { userId, page, limit });
    setLoading(true);
    setError("");

    try {
      const from = page * limit;
      const to = from + limit - 1;

      console.log("📊 Fetching user posts from Supabase...");

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
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
            id
          ),
          post_reposts (
            id
          ),
          post_saves (
            id
          )
        `,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) {
        console.error("❌ Supabase fetch error:", fetchError);
        throw new Error(fetchError.message);
      }

      console.log("✅ Successfully fetched user posts:", data?.length || 0);

      return { posts: data, totalCount: count };
    } catch (error) {
      console.error("❌ Error fetching user posts:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // Add reaction
  const addReaction = useCallback(
    async (postId, reactionType) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        // First remove other reactions of the same type
        await supabase.from("post_reactions").delete().match({
          post_id: postId,
          user_id: user.id,
          reaction_type: reactionType,
        });

        // Add new reaction
        const { data, error } = await supabase
          .from("post_reactions")
          .insert([
            {
              post_id: postId,
              user_id: user.id,
              reaction_type: reactionType,
            },
          ])
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        console.error("❌ Error adding reaction:", error);
        throw error;
      }
    },
    [t],
  );

  // Delete post
  const deletePost = useCallback(
    async (postId) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        const { error } = await supabase
          .from("posts")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .eq("id", postId)
          .eq("user_id", user.id);

        if (error) {
          throw new Error(error.message);
        }

        return true;
      } catch (error) {
        console.error("❌ Error deleting post:", error);
        throw error;
      }
    },
    [t],
  );

  // Add comment
  const addComment = useCallback(
    async (postId, content) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        const { data, error } = await supabase
          .from("post_comments")
          .insert([
            {
              post_id: postId,
              user_id: user.id,
              content,
            },
          ])
          .select(
            `
          *,
          users (
            id,
            unique_name,
            avatar_url
          )
        `,
          )
          .single();

        if (error) {
          throw new Error(error.message);
        }

        return data;
      } catch (error) {
        console.error("❌ Error adding comment:", error);
        throw error;
      }
    },
    [t],
  );

  // Save edit history
  const saveEditHistory = useCallback(async (postId, oldData, newData) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { error } = await supabase.from("post_edit_history").insert({
        post_id: postId,
        user_id: user.id,
        old_content: oldData.content,
        new_content: newData.content,
        old_media_urls: oldData.media_urls || [],
        new_media_urls: newData.media_urls || [],
        old_media_types: oldData.media_types || [],
        new_media_types: newData.media_types || [],
        edited_at: new Date().toISOString(),
      });

      if (error) {
        console.error("❌ Error saving edit history:", error);
      }
    } catch (error) {
      console.error("❌ Error in saveEditHistory:", error);
    }
  }, []);

  // ✅ SHARE POST FUNCTION
  const sharePost = useCallback(async (postId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data: post, error: postError } = await supabase
        .from("posts")
        .select("share_count")
        .eq("id", postId)
        .single();

      if (postError) {
        console.error("❌ Error fetching post:", postError);
        throw new Error(postError.message);
      }

      const currentShareCount = post.share_count || 0;
      const newShareCount = currentShareCount + 1;

      const { error: updateError } = await supabase
        .from("posts")
        .update({
          share_count: newShareCount,
          updated_at: new Date().toISOString(),
        })
        .eq("id", postId);

      if (updateError) {
        console.error("❌ Error updating share count:", updateError);
        throw new Error(updateError.message);
      }

      console.log(
        `✅ Post ${postId} shared successfully. New share count: ${newShareCount}`,
      );

      return {
        success: true,
        shareUrl: `${window.location.origin}/post/${postId}`,
        shareCount: newShareCount,
      };
    } catch (error) {
      console.error("❌ Error sharing post:", error);
      return {
        success: true,
        shareUrl: `${window.location.origin}/post/${postId}`,
        shareCount: 1,
      };
    }
  }, []);

  // ✅ GET SHARE COUNT FUNCTION
  const getShareCount = useCallback(async (postId) => {
    try {
      const { data: post, error } = await supabase
        .from("posts")
        .select("share_count")
        .eq("id", postId)
        .single();

      if (error) {
        console.error("❌ Error getting share count:", error);
        return 0;
      }

      return post.share_count || 0;
    } catch (error) {
      console.error("❌ Error in getShareCount:", error);
      return 0;
    }
  }, []);

  // ✅ CHECK IF USER HAS SHARED FUNCTION
  const hasUserShared = useCallback(async (postId) => {
    try {
      const storageKey = `post_shared_${postId}`;
      const hasShared = localStorage.getItem(storageKey);

      return !!hasShared;
    } catch (error) {
      console.error("❌ Error checking if user shared:", error);
      return false;
    }
  }, []);

  // ✅ SAVE POST FUNCTION
  const savePost = useCallback(
    async (postId) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        // Check if already saved
        const { data: existingSave, error: checkError } = await supabase
          .from("post_saves")
          .select("id")
          .eq("user_id", user.id)
          .eq("post_id", postId)
          .single();

        // If record found - delete (remove from saved)
        if (existingSave && !checkError) {
          const { error: deleteError } = await supabase
            .from("post_saves")
            .delete()
            .eq("id", existingSave.id);

          if (deleteError) throw new Error(deleteError.message);

          return {
            success: true,
            saved: false,
            action: "removed",
            saveId: existingSave.id,
          };
        } else {
          // If not found - add
          const { data, error: insertError } = await supabase
            .from("post_saves")
            .insert([
              {
                user_id: user.id,
                post_id: postId,
              },
            ])
            .select()
            .single();

          if (insertError) throw new Error(insertError.message);

          return {
            success: true,
            saved: true,
            action: "added",
            data,
          };
        }
      } catch (error) {
        console.error("❌ Error saving/unsaving post:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [t],
  );

  // ✅ CHECK IF POST IS SAVED BY USER FUNCTION
  const isPostSaved = useCallback(async (postId) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return false;

      const { data, error } = await supabase
        .from("post_saves")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .single();

      // If "not found" error - return false
      if (error && error.code === "PGRST116") return false;
      if (error) throw new Error(error.message);

      return !!data;
    } catch (error) {
      console.error("❌ Error checking if post is saved:", error);
      return false;
    }
  }, []);

  // ✅ GET ALL SAVED POSTS BY USER FUNCTION
  const getSavedPosts = useCallback(async (userId, page = 0, limit = 20) => {
    setLoading(true);
    setError("");

    try {
      const from = page * limit;
      const to = from + limit - 1;

      console.log("📥 Fetching saved posts for user:", userId);

      const {
        data,
        error: fetchError,
        count,
      } = await supabase
        .from("post_saves")
        .select(
          `
          id,
          created_at,
          posts:post_id (
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
              id
            ),
            post_reposts (
              id
            ),
            post_saves!inner (
              id
            )
          )
          `,
          { count: "exact" },
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (fetchError) {
        console.error("❌ Error fetching saved posts:", fetchError);
        throw new Error(fetchError.message);
      }

      // Transform data
      const savedPosts = data.map((save) => ({
        ...save.posts,
        saved_at: save.created_at,
        save_id: save.id,
      }));

      console.log("✅ Successfully fetched saved posts:", savedPosts.length);

      return { posts: savedPosts, totalCount: count };
    } catch (error) {
      console.error("❌ Error in getSavedPosts:", error);
      setError(error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ BULK CHECK SAVED STATUSES FUNCTION
  const checkSavedStatuses = useCallback(async (postIds) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !postIds.length) return {};

      const { data, error } = await supabase
        .from("post_saves")
        .select("post_id")
        .eq("user_id", user.id)
        .in("post_id", postIds);

      if (error) {
        console.error("❌ Error checking saved statuses:", error);
        return {};
      }

      // Create object with statuses: { postId: true/false }
      const statusMap = {};
      postIds.forEach((postId) => {
        statusMap[postId] = data.some((save) => save.post_id === postId);
      });

      return statusMap;
    } catch (error) {
      console.error("❌ Error in checkSavedStatuses:", error);
      return {};
    }
  }, []);

  // ✅ REMOVE SAVED POST FUNCTION
  const removeSavedPost = useCallback(
    async (saveId) => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        // Remove record from saved
        const { error } = await supabase
          .from("post_saves")
          .delete()
          .eq("id", saveId)
          .eq("user_id", user.id); // Check that user is removing their own saved posts

        if (error) throw new Error(error.message);

        return {
          success: true,
          saveId,
        };
      } catch (error) {
        console.error("❌ Error removing saved post:", error);
        return {
          success: false,
          error: error.message,
        };
      }
    },
    [t],
  );

  return {
    loading,
    error,
    createPost,
    updatePost,
    getCountryPosts,
    getAllPosts,
    getUserPosts,
    addReaction,
    deletePost,
    addComment,
    saveEditHistory,
    // ✅ COMMUNITY FUNCTIONS
    sharePost,
    getShareCount,
    hasUserShared,
    // ✅ SAVE FUNCTIONS
    savePost,
    isPostSaved,
    getSavedPosts,
    checkSavedStatuses,
    removeSavedPost, // ✅ ADD NEW FUNCTION
  };
}
