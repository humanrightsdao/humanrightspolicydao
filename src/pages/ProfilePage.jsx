// src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Edit,
  Globe,
  Cake,
  Link as LinkIcon,
  Wallet,
  Camera,
  ExternalLink,
  Scale,
  TrendingUp,
  Shield,
  MessageSquare,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useCountry } from "../hooks/useCountry";
import useUserInfo from "../hooks/useUserInfo";
import ProfileEditModal from "../components/ProfileEditModal";
import Layout from "../components/Layout";
import { useNavigate } from "react-router-dom";
import CountryFeed from "../components/CountryFeed";
import { supabase } from "../lib/supabase";
import CreatePostModal from "../components/CreatePostModal";

const ProfilePage = () => {
  const { t, i18n } = useTranslation(); // ДОДАНО i18n
  const navigate = useNavigate();
  const { userInfo, loading: userLoading, error: userError } = useUserInfo();
  const { getTranslatedCountryName } = useCountry(i18n.language); // ДОДАНО i18n.language

  const [showEditModal, setShowEditModal] = useState(false);
  const [countryRatings, setCountryRatings] = useState(null);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState("");
  const [isSavingRating, setIsSavingRating] = useState(false);
  const [activeRating, setActiveRating] = useState({
    human_rights: 0,
    economic_freedom: 0,
    political_freedom: 0,
    freedom_of_speech: 0,
  });
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);

  const getGradientClasses = (isActive = false) => {
    return isActive
      ? "from-black via-gray-900 to-blue-950"
      : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900";
  };

  const getHoverClasses = () => {
    return "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950";
  };

  // Завантаження рейтингів користувача
  const loadCountryRatings = async () => {
    if (!userInfo?.country || userInfo.country === "EARTH") {
      setCountryRatings(null);
      return;
    }

    setRatingsLoading(true);
    setRatingsError("");

    try {
      const { data, error } = await supabase
        .from("country_ratings")
        .select("*")
        .eq("user_id", userInfo.id)
        .eq("country_code", userInfo.country)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setCountryRatings(data);
        setActiveRating({
          human_rights: data.human_rights_rating || 0,
          economic_freedom: data.economic_freedom_rating || 0,
          political_freedom: data.political_freedom_rating || 0,
          freedom_of_speech: data.freedom_of_speech_rating || 0,
        });
      } else {
        setCountryRatings(null);
        setActiveRating({
          human_rights: 0,
          economic_freedom: 0,
          political_freedom: 0,
          freedom_of_speech: 0,
        });
      }
    } catch (error) {
      console.error("Error loading country ratings:", error);
      setRatingsError(t("ratings_load_error") || "Error loading ratings");
    } finally {
      setRatingsLoading(false);
    }
  };

  // Збереження рейтингу
  const saveRating = async (ratingType, value) => {
    if (!userInfo?.country || userInfo.country === "EARTH" || !userInfo?.id) {
      return;
    }

    setIsSavingRating(true);

    const ratingField = `${ratingType}_rating`;
    const updateData = {
      user_id: userInfo.id,
      country_code: userInfo.country,
      [ratingField]: value,
      updated_at: new Date().toISOString(),
    };

    // Оновлюємо активний рейтинг
    setActiveRating((prev) => ({
      ...prev,
      [ratingType]: value,
    }));

    try {
      // Перевіряємо чи існує запис
      const { data: existing } = await supabase
        .from("country_ratings")
        .select("id")
        .eq("user_id", userInfo.id)
        .eq("country_code", userInfo.country)
        .single();

      let result;
      if (existing) {
        // Оновлюємо існуючий запис
        result = await supabase
          .from("country_ratings")
          .update(updateData)
          .eq("id", existing.id)
          .select()
          .single();
      } else {
        // Створюємо новий запис
        result = await supabase
          .from("country_ratings")
          .insert(updateData)
          .select()
          .single();
      }

      if (result.error) {
        throw result.error;
      }

      // Оновлюємо локальний стан
      setCountryRatings(result.data);

      // Показуємо повідомлення про успіх
      const ratingName = getRatingName(ratingType);
      console.log(`✅ Rating "${ratingName}" saved: ${value}/10`);
    } catch (error) {
      console.error("Error saving rating:", error);
      // Відновлюємо попереднє значення при помилці
      loadCountryRatings();
    } finally {
      setIsSavingRating(false);
    }
  };

  // Отримання назви рейтингу
  const getRatingName = (ratingType) => {
    switch (ratingType) {
      case "human_rights":
        return t("human_rights_level") || "Human rights level";
      case "economic_freedom":
        return t("economic_freedom_level") || "Economic freedom level";
      case "political_freedom":
        return t("political_freedom_level") || "Political freedom level";
      case "freedom_of_speech":
        return t("freedom_of_speech_level") || "Freedom of speech level";
      default:
        return ratingType;
    }
  };

  // Завантажуємо рейтинги при зміні користувача або країни
  useEffect(() => {
    if (userInfo && !userLoading) {
      loadCountryRatings();
    }
  }, [userInfo, userLoading]);

  // Спрощений варіант без попереднього перегляду
  const RatingLine = ({
    title,
    icon: Icon,
    ratingType,
    value,
    onRatingChange,
  }) => {
    const handleClick = (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const width = rect.width;
      const percent = Math.max(0, Math.min(100, (x / width) * 100));
      const newValue = Math.ceil(percent / 10); // 1-10

      onRatingChange(ratingType, newValue);
    };

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {title}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {value > 0 ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {value}/10
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {t("not_rated") || "Not rated"}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Спрощена лінія для редагування */}
        <div className="space-y-2">
          {/* Лінія для кліків */}
          <div
            className="relative h-8 cursor-pointer group"
            onClick={handleClick}
          >
            {/* Фонова лінія */}
            <div className="absolute top-1/2 left-0 right-0 h-2 bg-gray-300 dark:bg-gray-700 rounded-full -translate-y-1/2 group-hover:bg-gray-400 dark:group-hover:bg-gray-600 transition-colors">
              {/* Заповнена частина лінії */}
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-500 to-blue-700 rounded-full transition-all duration-300"
                style={{ width: `${value * 10}%` }}
              ></div>

              {/* Поділки */}
              <div className="absolute top-1/2 left-0 right-0 flex justify-between -translate-y-1/2 pointer-events-none">
                {[...Array(11)].map((_, index) => (
                  <div
                    key={index}
                    className={`w-0.5 h-3 ${
                      index === 0 || index === 10
                        ? "bg-gray-500 dark:bg-gray-400"
                        : "bg-gray-400 dark:bg-gray-500"
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Індикатор значення */}
            {value > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                style={{ left: `${value * 10}%` }}
              >
                <div className="w-3 h-3 bg-blue-600 dark:bg-blue-500 rounded-full border-2 border-white dark:border-gray-800 shadow"></div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Компонент для відображення всіх рейтингів
  const RatingDisplay = () => {
    const ratings = [
      {
        type: "human_rights",
        title: t("human_rights_level") || "Human rights level",
        icon: Shield,
        value: activeRating.human_rights,
      },
      {
        type: "economic_freedom",
        title: t("economic_freedom_level") || "Economic freedom level",
        icon: TrendingUp,
        value: activeRating.economic_freedom,
      },
      {
        type: "political_freedom",
        title: t("political_freedom_level") || "Political freedom level",
        icon: Scale,
        value: activeRating.political_freedom,
      },
      {
        type: "freedom_of_speech",
        title: t("freedom_of_speech_level") || "Freedom of speech level",
        icon: MessageSquare,
        value: activeRating.freedom_of_speech,
      },
    ];

    return (
      <div className="space-y-6">
        {ratings.map((rating) => (
          <div key={rating.type}>
            <RatingLine
              title={rating.title}
              icon={rating.icon}
              ratingType={rating.type}
              value={rating.value}
              onRatingChange={saveRating}
            />
          </div>
        ))}
      </div>
    );
  };

  // Функція для відкриття модального вікна створення посту
  const handleCreatePost = () => {
    setShowCreatePostModal(true);
  };

  // Закриття модального вікна створення посту
  const handleCloseCreatePostModal = () => {
    setShowCreatePostModal(false);
  };

  if (showCreatePostModal && userInfo) {
    return (
      <Layout
        userProfile={userInfo}
        walletAddress={userInfo?.walletAddress}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("web3_wallet_address");
          window.location.href = "/";
        }}
        loading={userLoading}
        error={userError}
        onCreatePost={handleCreatePost}
      >
        <CreatePostModal
          onClose={handleCloseCreatePostModal}
          userCountry={userInfo?.country || "EARTH"}
        />
      </Layout>
    );
  }

  if (showEditModal) {
    return (
      <Layout
        userProfile={userInfo}
        walletAddress={userInfo?.walletAddress}
        onLogout={() => {
          localStorage.removeItem("token");
          localStorage.removeItem("web3_wallet_address");
          window.location.href = "/";
        }}
        loading={userLoading}
        error={userError}
        onCreatePost={handleCreatePost}
      >
        <div className="min-h-[calc(100vh-3rem)] flex items-center justify-center p-2">
          <div className="w-full max-w-2xl">
            <ProfileEditModal
              userInfo={userInfo}
              onClose={() => setShowEditModal(false)}
            />
          </div>
        </div>
      </Layout>
    );
  }

  if (userLoading) {
    return (
      <Layout
        userProfile={userInfo}
        walletAddress={userInfo?.walletAddress}
        onLogout={() => {}}
        loading={true}
        onCreatePost={handleCreatePost}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-900"></div>
        </div>
      </Layout>
    );
  }

  if (userError) {
    return (
      <Layout
        userProfile={userInfo}
        walletAddress={userInfo?.walletAddress}
        onLogout={() => {}}
        error={userError}
        onCreatePost={handleCreatePost}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-sm text-red-600 dark:text-red-400">
              {userError}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-3 py-1.5 text-sm bg-blue-900 text-white rounded-full hover:bg-blue-800 transition-colors"
            >
              {t("retry")}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!userInfo) {
    return (
      <Layout
        userProfile={null}
        walletAddress={null}
        onLogout={() => {}}
        onCreatePost={handleCreatePost}
      >
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t("user_not_found")}
          </p>
        </div>
      </Layout>
    );
  }

  const profileContent = (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("profile")}
          </h1>
        </div>
        <button
          onClick={() => setShowEditModal(true)}
          className={`
            px-5 py-2.5 text-white rounded-full font-medium transition-all duration-300
            flex items-center gap-2 whitespace-nowrap text-sm
            bg-gradient-to-r ${getGradientClasses(true)} ${getHoverClasses()}
            hover:scale-[1.02] shadow hover:shadow-md
          `}
        >
          <Edit className="w-3 h-3" />
          {t("edit_profile")}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-4">
          <div>
            <div className="flex flex-col items-center">
              <div className="relative mb-2">
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-white dark:border-gray-800 shadow">
                  {userInfo.avatarUrl ? (
                    <img
                      src={userInfo.avatarUrl}
                      alt={userInfo.uniqueName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        const fallback =
                          e.target.parentElement.querySelector(
                            ".avatar-fallback",
                          );
                        if (fallback) {
                          fallback.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    className="avatar-fallback w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold"
                    style={{ display: userInfo.avatarUrl ? "none" : "flex" }}
                  >
                    {userInfo.uniqueName?.[0]?.toUpperCase() || "U"}
                  </div>
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-blue-900 text-white flex items-center justify-center hover:bg-blue-800 transition-colors text-xs"
                >
                  <Camera className="w-2.5 h-2.5" />
                </button>
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {userInfo.uniqueName}
              </h2>
              <p className="text-base text-gray-600 dark:text-gray-400 mt-0.5">
                {userInfo.email}
              </p>
              <div className="mt-2 flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400">
                <Globe className="w-3 h-3" />
                {getTranslatedCountryName(userInfo.country) || t("earth")}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  <Cake className="w-3 h-3 inline mr-1" /> {/* ЗМІНЕНО */}
                  {t("date_of_birth")}
                </label>
                <div className="p-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-full">
                  <p className="text-gray-900 dark:text-white">
                    {userInfo.dateOfBirth
                      ? new Date(userInfo.dateOfBirth).toLocaleDateString()
                      : t("not_set")}
                  </p>
                </div>
              </div>

              {userInfo.walletAddress && (
                <div className="space-y-1">
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                    <Wallet className="w-3 h-3 inline mr-1" />
                    {t("wallet_address")}
                  </label>
                  <div className="p-2 text-sm bg-gray-50 dark:bg-gray-700 rounded-full">
                    <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                      {userInfo.walletAddress}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1 mt-3">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                {t("about_me")}
              </label>
              <div className="p-3 text-sm bg-gray-50 dark:bg-gray-700 rounded-xl min-h-[60px]">
                <p className="text-gray-900 dark:text-white whitespace-pre-line">
                  {userInfo.bio || t("no_bio_provided")}
                </p>
              </div>
            </div>
          </div>

          {/* ОНОВЛЕНА СЕКЦІЯ СОЦІАЛЬНИХ ПОСИЛАНЬ - КОМПАКТНО */}
          <div className="bg-white dark:bg-gray-700 rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
              {t("social_networks")}
            </h3>
            {userInfo.socialLinks && userInfo.socialLinks.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userInfo.socialLinks.map((link, index) => (
                  <a
                    key={link.id || index}
                    href={link.url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`
                      flex items-center gap-1.5 px-3 py-2 text-xs
                      bg-gray-50 dark:bg-gray-600 hover:bg-gray-100 dark:hover:bg-gray-500
                      text-gray-800 dark:text-gray-200 rounded-full
                      transition-all duration-200 hover:scale-[1.02]
                      border border-gray-200 dark:border-gray-500
                      min-w-0 flex-shrink-0
                    `}
                    title={`${link.platform || "Social"}: ${link.username || ""}`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <LinkIcon className="w-3 h-3 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                      <span className="font-medium truncate max-w-[80px]">
                        {link.platform || "Social"}
                      </span>
                      <span className="text-gray-600 dark:text-gray-300 truncate max-w-[60px]">
                        @{link.username?.replace("@", "") || ""}
                      </span>
                    </div>
                    <ExternalLink className="w-2.5 h-2.5 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                  </a>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 text-center py-4">
                {t("no_social_links")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Роздільна лінія */}
      <div className="my-8 border-t border-gray-300 dark:border-gray-700"></div>

      {/* Секція рейтингів країн */}
      <div className="mt-8 mb-8">
        {ratingsLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : ratingsError ? (
          <div className="text-center py-6">
            <p className="text-sm text-red-600 dark:text-red-400 mb-2">
              {ratingsError}
            </p>
            <button
              onClick={loadCountryRatings}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {t("retry")}
            </button>
          </div>
        ) : !userInfo.country || userInfo.country === "EARTH" ? (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 text-center">
            <Globe className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400 mb-2">
              {t("no_country_selected") || "Country not selected"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-4">
              {t("select_country_to_rate") ||
                "Select a country in profile settings to be able to rate"}
            </p>
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2 text-sm bg-blue-900 text-white rounded-full hover:bg-blue-800 transition-colors inline-flex items-center gap-1"
            >
              <Edit className="w-3 h-3" />
              {t("edit_profile")}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <RatingDisplay />

            {isSavingRating && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                  {t("saving") || "Saving..."}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Роздільна лінія */}
      <div className="my-8 border-t border-gray-300 dark:border-gray-700"></div>

      {/* Пости користувача - використовуємо CountryFeed з userId */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("my_posts") || "My Posts"}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("all_my_posts") || "All my posts from all countries"}
          </p>
        </div>

        {/* ВИКОРИСТОВУЄМО CountryFeed з userId для відображення постів користувача */}
        <CountryFeed
          userId={userInfo.id}
          countryCode={null}
          filterByCountry={false}
        />
      </div>
    </div>
  );

  return (
    <Layout
      userProfile={userInfo}
      walletAddress={userInfo?.walletAddress}
      onLogout={() => {
        localStorage.removeItem("token");
        localStorage.removeItem("web3_wallet_address");
        window.location.href = "/";
      }}
      loading={userLoading}
      error={userError}
      onCreatePost={handleCreatePost}
    >
      <div className="py-2 px-1">{profileContent}</div>
    </Layout>
  );
};

export default ProfilePage;
