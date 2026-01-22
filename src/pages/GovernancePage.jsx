// src/pages/GovernancePage.jsx
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Wrench, Grid, ArrowRight } from "lucide-react";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import CreatePostModal from "../components/CreatePostModal";
import useUserInfo from "../hooks/useUserInfo";

const GovernancePage = () => {
  const { t } = useTranslation();
  const { userInfo, loading: userLoading, error: userError } = useUserInfo();
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Authentication check
    if (!userLoading && !userInfo) {
      navigate("/");
      return;
    }

    // Onboarding check
    if (!userLoading && userInfo && !userInfo.hasCompletedOnboarding) {
      navigate("/onboarding");
      return;
    }
  }, [userInfo, userLoading, navigate]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
    } catch (error) {
      console.error(t("logout_error"), error);
      alert(t("logout_failed"));
    }
  };

  const services = [
    {
      id: 1,
      title: "Currency exchange",
      description: "Exchange of cryptocurrencies and fiat currencies",
      icon: "💱",
      color: "from-green-500 to-emerald-600",
    },
    {
      id: 2,
      title: "Money transfer",
      description: "Fast international transfers",
      icon: "💸",
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: 3,
      title: "Payments",
      description: "Payment of bills and services",
      icon: "💳",
      color: "from-purple-500 to-pink-600",
    },
    {
      id: 4,
      title: "Investments",
      description: "Investment opportunities",
      icon: "📈",
      color: "from-yellow-500 to-orange-600",
    },
    {
      id: 5,
      title: "Insurance",
      description: "Financial insurance",
      icon: "🛡️",
      color: "from-red-500 to-rose-600",
    },
    {
      id: 6,
      title: "Loans",
      description: "Consumer and business loans",
      icon: "🏦",
      color: "from-indigo-500 to-violet-600",
    },
  ];

  return (
    <Layout
      userProfile={userInfo}
      onLogout={handleLogout}
      loading={userLoading}
      error={userError}
      onCreatePost={() => setShowCreatePostModal(true)}
    >
      {showCreatePostModal && (
        <CreatePostModal
          onClose={() => setShowCreatePostModal(false)}
          userCountry={userInfo?.country || "EARTH"}
        />
      )}
      <div className="h-full p-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Wrench className="w-8 h-8 text-orange-600" />
              {t("services") || "Services"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {t("services_description") || "Financial and banking services"}
            </p>
          </div>
        </div>

        {/* Services list */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Grid className="w-5 h-5" />
            {t("available_services") || "Available services"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow border border-gray-200 dark:border-gray-700 p-6 hover:shadow-xl transition-shadow duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${service.color} flex items-center justify-center text-3xl`}
                  >
                    {service.icon}
                  </div>
                  <ArrowRight className="w-5 h-5 text-gray-400" />
                </div>

                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {service.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {service.description}
                </p>

                <button className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full hover:from-blue-700 hover:to-blue-800 transition-all font-medium">
                  {t("learn_more") || "Learn more"}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Additional information */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-700 rounded-2xl p-8 text-white">
          <h2 className="text-2xl font-bold mb-4">
            {t("need_help") || "Need help?"}
          </h2>
          <p className="mb-6">
            {t("services_support_description") ||
              "Our support service is always ready to help you with the selection and use of services."}
          </p>
          <button className="px-6 py-3 bg-white text-blue-700 rounded-full hover:bg-blue-50 font-medium">
            {t("contact_support") || "Contact support"}
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default GovernancePage;
