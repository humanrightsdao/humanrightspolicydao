// src/hooks/useUserInfo.js
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "react-i18next";

// GLOBAL CACHE for all hook instances
let cachedUserInfo = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes caching

// Multiple request guard
let isLoadingInProgress = false;

export default function useUserInfo() {
  const { t } = useTranslation();
  const [userInfo, setUserInfo] = useState(cachedUserInfo);
  const [loading, setLoading] = useState(!cachedUserInfo);
  const [error, setError] = useState("");

  // Ref for tracking mounting
  const isMounted = useRef(true);

  // Function for parsing social links
  const parseSocialLinks = useCallback((links) => {
    if (!links) return [];

    try {
      // If it's already an array - return it
      if (Array.isArray(links)) {
        return links;
      }

      // If it's a JSON string - parse it
      if (typeof links === "string") {
        const parsed = JSON.parse(links);
        return Array.isArray(parsed) ? parsed : [];
      }

      // In other cases - empty array
      return [];
    } catch (error) {
      console.error("❌ Error parsing social links:", error);
      return [];
    }
  }, []);

  // Function for loading user information
  const loadUserInfo = useCallback(
    async (forceRefresh = false) => {
      console.log("🔄 loadUserInfo started", {
        forceRefresh,
        isLoadingInProgress,
      });

      // Prevent multiple concurrent requests
      if (isLoadingInProgress && !forceRefresh) {
        console.log("⏳ Another load is in progress, skipping...");
        return cachedUserInfo;
      }

      isLoadingInProgress = true;

      const now = Date.now();

      // Check cache: if there's cached data and it's not older than CACHE_DURATION
      if (
        !forceRefresh &&
        cachedUserInfo &&
        now - cacheTimestamp < CACHE_DURATION
      ) {
        console.log("💾 Using cached user info");
        if (isMounted.current) {
          setUserInfo(cachedUserInfo);
          setLoading(false);
        }
        isLoadingInProgress = false;
        return cachedUserInfo;
      }

      if (isMounted.current) {
        setLoading(true);
        setError("");
      }

      try {
        // Check authorization
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw new Error(t("user_error") || "Error loading user");
        }

        if (!user) {
          console.log("👤 No user found");
          cachedUserInfo = null;
          cacheTimestamp = 0;
          if (isMounted.current) {
            setUserInfo(null);
            setLoading(false);
          }
          isLoadingInProgress = false;
          return null;
        }

        console.log("👤 User ID:", user.id);
        console.log("👤 User email:", user.email);

        // Get profile from database
        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        console.log("📊 Profile from DB:", profile);

        if (profileError) {
          console.warn("⚠️ Profile not found, creating new one");
          // If profile doesn't exist, create a basic one
          const { data: newProfile, error: createError } = await supabase
            .from("users")
            .insert({
              id: user.id,
              email: user.email,
              unique_name:
                user.user_metadata?.unique_name ||
                `user_${user.id.slice(0, 8)}`,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              has_completed_onboarding: false,
              social_links: "[]",
              role: "user",
            })
            .select()
            .single();

          if (createError) {
            throw new Error(
              t("create_profile_error") || "Error creating profile",
            );
          }

          const userData = {
            id: newProfile.id,
            email: newProfile.email,
            uniqueName: newProfile.unique_name,
            country: newProfile.country || "EARTH",
            walletAddress: newProfile.wallet_address || null,
            dateOfBirth: newProfile.date_of_birth || null,
            age: calculateAge(newProfile.date_of_birth),
            bio: newProfile.bio || null,
            socialLinks: parseSocialLinks(newProfile.social_links),
            avatarUrl: newProfile.avatar_url || null,
            hasAcceptedTerms: newProfile.has_accepted_terms || false,
            hasCompletedOnboarding:
              newProfile.has_completed_onboarding || false,
            emailConfirmedAt: newProfile.email_confirmed_at || null,
            hasAcceptedHumanRightsPolicy:
              newProfile.has_accepted_human_rights_policy || false,
            hasCompletedLessons: newProfile.has_completed_lessons || false,
            hasCompletedTests: newProfile.has_completed_tests || false,
            createdAt: newProfile.created_at,
            updatedAt: newProfile.updated_at,
            role: newProfile.role || "user",
          };

          console.log("✅ Created new user data:", userData);
          cachedUserInfo = userData;
          cacheTimestamp = now;

          if (isMounted.current) {
            setUserInfo(userData);
          }

          isLoadingInProgress = false;
          return userData;
        }

        // Form structured user information
        const socialLinks = parseSocialLinks(profile.social_links);

        const userData = {
          id: profile.id,
          email: profile.email,
          uniqueName: profile.unique_name,
          country: profile.country || "EARTH",
          walletAddress: profile.wallet_address || null,
          dateOfBirth: profile.date_of_birth || null,
          age: calculateAge(profile.date_of_birth),
          bio: profile.bio || null,
          socialLinks: socialLinks,
          avatarUrl: profile.avatar_url || null,
          hasAcceptedTerms: profile.has_accepted_terms || false,
          hasCompletedOnboarding: profile.has_completed_onboarding || false,
          emailConfirmedAt: profile.email_confirmed_at || null,
          hasAcceptedHumanRightsPolicy:
            profile.has_accepted_human_rights_policy || false,
          hasCompletedLessons: profile.has_completed_lessons || false,
          hasCompletedTests: profile.has_completed_tests || false,
          createdAt: profile.created_at,
          updatedAt: profile.updated_at,
          role: profile.role || "user",
        };

        console.log("✅ Parsed user data:", {
          hasAvatar: !!userData.avatarUrl,
          role: userData.role,
          socialLinks: userData.socialLinks,
          socialLinksCount: userData.socialLinks.length,
        });

        // Check for Web3 address in localStorage
        const web3Addr = localStorage.getItem("web3_wallet_address");
        if (web3Addr && !userData.walletAddress) {
          userData.walletAddress = web3Addr;
        }

        cachedUserInfo = userData;
        cacheTimestamp = now;

        if (isMounted.current) {
          setUserInfo(userData);
        }

        isLoadingInProgress = false;
        return userData;
      } catch (error) {
        console.error("❌ Error loading profile:", error.message || error);

        if (isMounted.current) {
          setError(error.message);
        }

        isLoadingInProgress = false;
        return null;
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
        console.log("🏁 loadUserInfo completed");
      }
    },
    [t, parseSocialLinks],
  );

  // Function for updating user information
  const updateUserInfo = useCallback(
    async (updates) => {
      try {
        console.log("🔄 updateUserInfo called with:", updates);

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        // Prepare data for update
        const updateData = {
          updated_at: new Date().toISOString(),
        };

        // Add fields that need to be updated
        if (updates.unique_name !== undefined) {
          updateData.unique_name = updates.unique_name;
        }
        if (updates.bio !== undefined) {
          updateData.bio = updates.bio;
        }
        if (updates.country !== undefined) {
          updateData.country = updates.country;
        }
        if (updates.date_of_birth !== undefined) {
          updateData.date_of_birth = updates.date_of_birth;
        }
        if (updates.avatar_url !== undefined) {
          updateData.avatar_url = updates.avatar_url;
        }
        if (updates.role !== undefined) {
          updateData.role = updates.role;
        }

        // Handle social links
        if (updates.socialLinks !== undefined) {
          const linksToSave = Array.isArray(updates.socialLinks)
            ? updates.socialLinks
            : [];
          updateData.social_links = JSON.stringify(linksToSave);
        }

        if (updates.social_links !== undefined) {
          const linksToSave = Array.isArray(updates.social_links)
            ? updates.social_links
            : [];
          updateData.social_links = JSON.stringify(linksToSave);
        }

        console.log("📤 Updating user with data:", updateData);

        const { data, error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Update error:", updateError);
          throw new Error(updateError.message);
        }

        console.log("✅ User updated successfully:", data);

        // Update local state and cache
        const updatedUserInfo = {
          ...userInfo,
          updatedAt: updateData.updated_at,
        };

        // Update specific fields
        if (updates.unique_name !== undefined) {
          updatedUserInfo.uniqueName = updates.unique_name;
        }
        if (updates.bio !== undefined) {
          updatedUserInfo.bio = updates.bio;
        }
        if (updates.country !== undefined) {
          updatedUserInfo.country = updates.country;
        }
        if (updates.date_of_birth !== undefined) {
          updatedUserInfo.dateOfBirth = updates.date_of_birth;
          updatedUserInfo.age = calculateAge(updates.date_of_birth);
        }
        if (updates.avatar_url !== undefined) {
          updatedUserInfo.avatarUrl = updates.avatar_url;
        }
        if (updates.role !== undefined) {
          updatedUserInfo.role = updates.role;
        }

        // Update social links
        if (updates.socialLinks !== undefined) {
          updatedUserInfo.socialLinks = Array.isArray(updates.socialLinks)
            ? updates.socialLinks
            : [];
        }
        if (updates.social_links !== undefined) {
          updatedUserInfo.socialLinks = Array.isArray(updates.social_links)
            ? updates.social_links
            : [];
        }

        // Update cache
        cachedUserInfo = updatedUserInfo;
        cacheTimestamp = Date.now();

        console.log("✅ Updated local user info and cache:", updatedUserInfo);

        if (isMounted.current) {
          setUserInfo(updatedUserInfo);
        }

        return updatedUserInfo;
      } catch (error) {
        console.error(
          t("update_profile_error") || "Error updating profile",
          error,
        );
        throw error;
      }
    },
    [userInfo, t],
  );

  // Function for uploading avatar
  const uploadAvatar = useCallback(
    async (file) => {
      try {
        console.log(
          "🔄 uploadAvatar called with file:",
          file.name,
          file.type,
          file.size,
        );

        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          throw new Error(
            t("user_not_authenticated") || "User not authenticated",
          );
        }

        // Check file type
        if (!file.type.startsWith("image/")) {
          throw new Error(
            t("avatar_file_type_error") || "Please select an image",
          );
        }

        // Allowed file types
        const allowedTypes = [
          "image/jpeg",
          "image/png",
          "image/webp",
          "image/gif",
        ];
        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            t("avatar_file_format_error") ||
              "Allowed formats: JPG, PNG, WebP, GIF",
          );
        }

        // Maximum size 5MB
        if (file.size > 5 * 1024 * 1024) {
          throw new Error(
            t("avatar_file_size_error") || "File size should not exceed 5MB",
          );
        }

        // Get current avatar to delete old version
        const currentAvatarUrl = userInfo?.avatarUrl;
        if (currentAvatarUrl) {
          try {
            const oldFileName = currentAvatarUrl.split("/").pop();
            console.log("🗑️ Deleting old avatar:", oldFileName);
            await supabase.storage
              .from("user-content")
              .remove([`avatars/${user.id}/${oldFileName}`]);
          } catch (deleteError) {
            console.warn("⚠️ Failed to delete old avatar:", deleteError);
          }
        }

        // Generate unique filename
        const fileExt = file.name.split(".").pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `avatars/${user.id}/${fileName}`;

        console.log("📤 Uploading avatar to:", filePath);

        // Upload file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from("user-content")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) {
          console.error("❌ Upload error:", uploadError);
          throw new Error(uploadError.message);
        }

        // Get public URL with additional parameter for caching
        const {
          data: { publicUrl },
        } = supabase.storage.from("user-content").getPublicUrl(filePath, {
          download: false,
        });

        // Add timestamp to prevent caching
        const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

        console.log("✅ Avatar uploaded, public URL:", urlWithTimestamp);

        // Update user profile with new avatar
        const { error: updateError } = await supabase
          .from("users")
          .update({
            avatar_url: urlWithTimestamp,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user.id);

        if (updateError) {
          console.error("❌ Profile update error:", updateError);
          throw new Error(updateError.message);
        }

        // Update local state and cache
        const updatedUserInfo = {
          ...userInfo,
          avatarUrl: urlWithTimestamp,
          updatedAt: new Date().toISOString(),
        };

        cachedUserInfo = updatedUserInfo;
        cacheTimestamp = Date.now();

        if (isMounted.current) {
          setUserInfo(updatedUserInfo);
        }

        console.log("✅ Avatar updated in state and cache");
        return urlWithTimestamp;
      } catch (error) {
        console.error("❌ Avatar upload error:", error.message || error);
        throw error;
      }
    },
    [userInfo, t],
  );

  // Function for deleting avatar
  const deleteAvatar = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error(
          t("user_not_authenticated") || "User not authenticated",
        );
      }

      // Delete file from storage
      const currentAvatarUrl = userInfo?.avatarUrl;
      if (currentAvatarUrl) {
        try {
          const fileName = currentAvatarUrl.split("/").pop();
          await supabase.storage
            .from("user-content")
            .remove([`avatars/${user.id}/${fileName}`]);
        } catch (deleteError) {
          console.warn("⚠️ Failed to delete avatar file:", deleteError);
        }
      }

      // Update user profile (remove avatar_url)
      const { error: updateError } = await supabase
        .from("users")
        .update({
          avatar_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update local state and cache
      const updatedUserInfo = {
        ...userInfo,
        avatarUrl: null,
        updatedAt: new Date().toISOString(),
      };

      cachedUserInfo = updatedUserInfo;
      cacheTimestamp = Date.now();

      if (isMounted.current) {
        setUserInfo(updatedUserInfo);
      }

      return true;
    } catch (error) {
      console.error(t("avatar_delete_error") || "Error deleting avatar", error);
      throw error;
    }
  }, [userInfo, t]);

  // Function for updating a specific field
  const updateUserField = useCallback(
    async (field, value) => {
      return await updateUserInfo({ [field]: value });
    },
    [updateUserInfo],
  );

  // Function for formatting wallet address
  const formatWalletAddress = useCallback(
    (address, startChars = 6, endChars = 4) => {
      if (!address) return "";
      if (address.length <= startChars + endChars) return address;
      return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
    },
    [],
  );

  // Function for getting age from date of birth
  function calculateAge(dateOfBirth) {
    if (!dateOfBirth) return null;

    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  // Function for getting avatar (with fallback to initials)
  const getAvatar = useCallback(() => {
    if (userInfo?.avatarUrl) {
      return userInfo.avatarUrl;
    }
    return null;
  }, [userInfo]);

  // Function for clearing cache
  const clearCache = useCallback(() => {
    cachedUserInfo = null;
    cacheTimestamp = 0;
    isLoadingInProgress = false;

    if (isMounted.current) {
      setUserInfo(null);
    }
  }, []);

  // Load information on initialization
  useEffect(() => {
    console.log(
      "🎯 useUserInfo useEffect triggered, cache exists:",
      !!cachedUserInfo,
    );

    // Set mounting
    isMounted.current = true;

    const init = async () => {
      if (!cachedUserInfo) {
        await loadUserInfo();
      } else {
        // If there's cache, just set the state
        if (isMounted.current) {
          setUserInfo(cachedUserInfo);
          setLoading(false);
        }
      }
    };

    init();

    // Cleanup on unmount
    return () => {
      isMounted.current = false;
    };
  }, [loadUserInfo]);

  // Authentication change listener - ONLY FOR SIGNOUT SIGNALS
  useEffect(() => {
    // Listen only to SIGNED_OUT events
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔐 Auth state changed:", event);

        if (event === "SIGNED_OUT") {
          // Clear cache on sign out
          clearCache();
        }
        // DO NOT call loadUserInfo for SIGNED_IN - this is done by the first useEffect
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [clearCache]);

  return {
    // Main data
    userInfo,
    loading,
    error,

    // Methods for working with data
    loadUserInfo,
    updateUserInfo,
    updateUserField,
    uploadAvatar,
    deleteAvatar,
    formatWalletAddress,

    // Utility functions
    calculateAge,

    // Quick access to main fields
    getEmail: () => userInfo?.email || "",
    getUniqueName: () => userInfo?.uniqueName || "",
    getCountry: () => userInfo?.country || "EARTH",
    getWalletAddress: () => userInfo?.walletAddress || "",
    getDateOfBirth: () => userInfo?.dateOfBirth || null,
    getAge: () => userInfo?.age || null,
    getSocialLinks: () => userInfo?.socialLinks || [],
    getAvatarUrl: () => userInfo?.avatarUrl || null,
    getAvatar: getAvatar,

    // State checks
    isAuthenticated: !!userInfo,
    hasWallet: !!userInfo?.walletAddress,
    hasAvatar: !!userInfo?.avatarUrl,
    getRole: () => userInfo?.role || "user",
    isAdmin: () => userInfo?.role === "admin",
    isModerator: () =>
      userInfo?.role === "moderator" || userInfo?.role === "admin",

    // Caching
    clearCache,
  };
}
