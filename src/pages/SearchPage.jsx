// src/pages/SearchPage.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "../lib/supabase";
import Layout from "../components/Layout";
import useUserInfo from "../hooks/useUserInfo";
import {
  Search,
  X,
  Filter,
  Calendar,
  MapPin,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

const SearchPage = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { userInfo } = useUserInfo();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({
    posts: [],
    complaints: [],
    helpRequests: [],
    users: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [filters, setFilters] = useState({
    type: "all",
    dateRange: "all",
    country: "all",
  });

  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    setSearchQuery(query);

    if (query.trim()) {
      performSearch(query);
    }
  }, [location.search]);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error(t("user_error") || "Error getting user");
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
        throw new Error(t("profile_not_found") || "Profile not found");
      }

      if (!profile?.has_completed_onboarding) {
        navigate("/onboarding");
        return;
      }

      setUserProfile(profile);
    } catch (error) {
      console.error("Error loading profile:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      alert(t("logout_failed") || "Failed to logout");
    }
  };

  const handleCreatePost = () => {
    navigate("/create-post");
  };

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults({
        posts: [],
        complaints: [],
        helpRequests: [],
        users: [],
      });
      return;
    }

    setIsLoading(true);
    try {
      const searchTerm = `%${query}%`;

      const { data: postsData } = await supabase
        .from("posts")
        .select("*, users!inner(unique_name, avatar_url)")
        .or(`content.ilike.${searchTerm},country_code.ilike.${searchTerm}`)
        .eq("is_deleted", false)
        .limit(20);

      const { data: complaintsData } = await supabase
        .from("complaints")
        .select("*, users!inner(unique_name, avatar_url)")
        .or(
          `title.ilike.${searchTerm},description.ilike.${searchTerm},violation_description.ilike.${searchTerm},country_code.ilike.${searchTerm},city.ilike.${searchTerm}`,
        )
        .eq("status", "published")
        .limit(20);

      const { data: helpRequestsData } = await supabase
        .from("help_requests")
        .select("*, users!inner(unique_name, avatar_url)")
        .or(
          `title.ilike.${searchTerm},description.ilike.${searchTerm},country_code.ilike.${searchTerm}`,
        )
        .eq("status", "active")
        .limit(20);

      const { data: usersData } = await supabase
        .from("users")
        .select("id, unique_name, avatar_url, country, bio")
        .or(
          `unique_name.ilike.${searchTerm},email.ilike.${searchTerm},country.ilike.${searchTerm},bio.ilike.${searchTerm}`,
        )
        .limit(20);

      setSearchResults({
        posts: postsData || [],
        complaints: complaintsData || [],
        helpRequests: helpRequestsData || [],
        users: usersData || [],
      });
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults({
      posts: [],
      complaints: [],
      helpRequests: [],
      users: [],
    });
    navigate("/search");
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getResultCount = () => {
    switch (activeTab) {
      case "posts":
        return searchResults.posts.length;
      case "complaints":
        return searchResults.complaints.length;
      case "help":
        return searchResults.helpRequests.length;
      case "users":
        return searchResults.users.length;
      default:
        return (
          searchResults.posts.length +
          searchResults.complaints.length +
          searchResults.helpRequests.length +
          searchResults.users.length
        );
    }
  };

  const renderResults = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (!searchQuery.trim()) {
      return (
        <div className="text-center py-20">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("search_placeholder")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t("enter_search_query")}
          </p>
        </div>
      );
    }

    if (getResultCount() === 0) {
      return (
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t("no_results_found")}
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            {t("try_different_keywords")}
          </p>
        </div>
      );
    }

    return (
      <>
        {activeTab === "all" && (
          <div className="space-y-8">
            {searchResults.posts.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t("posts")} ({searchResults.posts.length})
                </h3>
                <div className="grid gap-4">
                  {searchResults.posts.map((post) => (
                    <div
                      key={post.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={post.users?.avatar_url || "/default-avatar.png"}
                          alt={post.users?.unique_name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white">
                              {post.users?.unique_name}
                            </h4>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatDate(post.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                            {post.content}
                          </p>
                          {post.country_code &&
                            post.country_code !== "EARTH" && (
                              <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                <MapPin className="w-4 h-4" />
                                {post.country_code}
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.complaints.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {t("complaints")} ({searchResults.complaints.length})
                </h3>
                <div className="grid gap-4">
                  {searchResults.complaints.map((complaint) => (
                    <div
                      key={complaint.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/complaints/${complaint.id}`)}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {complaint.title}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {complaint.violation_description ||
                          complaint.description}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <User className="w-4 h-4" />
                            {complaint.users?.unique_name}
                          </span>
                          {complaint.country_code && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              {complaint.country_code}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(complaint.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.helpRequests.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  {t("help_requests")} ({searchResults.helpRequests.length})
                </h3>
                <div className="grid gap-4">
                  {searchResults.helpRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/help/${request.id}`)}
                    >
                      <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                        {request.title}
                      </h4>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                        {request.description}
                      </p>
                      <div className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-4">
                          <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <User className="w-4 h-4" />
                            {request.users?.unique_name}
                          </span>
                          {request.country_code && (
                            <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              {request.country_code}
                            </span>
                          )}
                        </div>
                        <span className="text-gray-500 dark:text-gray-400">
                          {formatDate(request.created_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {searchResults.users.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t("users")} ({searchResults.users.length})
                </h3>
                <div className="grid gap-4">
                  {searchResults.users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/user/${user.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar_url || "/default-avatar.png"}
                          alt={user.unique_name}
                          className="w-12 h-12 rounded-full"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {user.unique_name}
                          </h4>
                          {user.bio && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm mt-1 line-clamp-1">
                              {user.bio}
                            </p>
                          )}
                          {user.country && (
                            <div className="flex items-center gap-1 mt-2 text-sm text-gray-500 dark:text-gray-400">
                              <MapPin className="w-4 h-4" />
                              {user.country}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab !== "all" && (
          <div className="space-y-4">
            {searchResults[activeTab]?.map((item) => {
              if (activeTab === "posts") {
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/post/${item.id}`)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={item.users?.avatar_url || "/default-avatar.png"}
                        alt={item.users?.unique_name}
                        className="w-10 h-10 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            {item.users?.unique_name}
                          </h4>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(item.created_at)}
                          </span>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 line-clamp-2">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }

              if (activeTab === "users") {
                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/user/${item.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.avatar_url || "/default-avatar.png"}
                        alt={item.unique_name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {item.unique_name}
                        </h4>
                        {item.bio && (
                          <p className="text-gray-700 dark:text-gray-300 text-sm mt-1">
                            {item.bio}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() =>
                    navigate(
                      activeTab === "complaints"
                        ? `/complaints/${item.id}`
                        : `/help/${item.id}`,
                    )
                  }
                >
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                    {item.title}
                  </h4>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                    {item.violation_description || item.description}
                  </p>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-gray-500 dark:text-gray-400">
                      {item.users?.unique_name}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {formatDate(item.created_at)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  };

  const tabs = [
    { id: "all", label: t("all") },
    { id: "posts", label: t("posts") },
    { id: "complaints", label: t("complaints") },
    { id: "help", label: t("help_requests") },
    { id: "users", label: t("users") },
  ];

  return (
    <Layout
      userProfile={userProfile}
      onLogout={handleLogout}
      loading={loading}
      error={error}
      walletAddress={userInfo?.wallet_address}
      getTranslatedCountry={() => {}}
      onCreatePost={handleCreatePost}
    >
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>

              <form onSubmit={handleSearchSubmit} className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("search_placeholder")}
                    className="w-full py-3 pl-12 pr-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    autoFocus
                  />
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-600 text-white"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {tab.label}
                      {tab.id !== "all" &&
                        searchResults[tab.id]?.length > 0 && (
                          <span className="ml-2 text-xs opacity-80">
                            ({searchResults[tab.id].length})
                          </span>
                        )}
                    </button>
                  ))}
                </div>

                <button
                  className="p-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  title={t("filters")}
                >
                  <Filter className="w-5 h-5" />
                </button>
              </div>

              {searchQuery.trim() && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  {isLoading ? (
                    <span>{t("searching")}...</span>
                  ) : (
                    <span>
                      {t("found")} {getResultCount()} {t("results_for")} "
                      {searchQuery}"
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderResults()}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
