//src/components/UserRegistration.jsx
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import countries from "../utils/countries";

export default function UserRegistration({
  onComplete,
  userEmail = "",
  walletAddress = "",
  authMethod = "",
}) {
  // Find Earth country from array for default value
  const defaultCountry =
    countries.find((country) => country.code === "EARTH") || countries[0];

  const [userData, setUserData] = useState({
    unique_name: "",
    date_of_birth: "",
    country: defaultCountry.code, // use code instead of string
    has_accepted_terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [checkingName, setCheckingName] = useState(false);
  const [nameError, setNameError] = useState("");
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const currentLanguage = i18n.language;

  const getCountryName = (countryCode) => {
    const country = countries.find((c) => c.code === countryCode);
    if (!country) return "";

    // Always return translation from countries array
    return country.name[currentLanguage] || country.name.en;
  };

  const getColorClasses = (isActive = false) => {
    return {
      gradient: isActive
        ? "from-black via-gray-900 to-blue-950"
        : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900",
      hover:
        "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950",
    };
  };

  const colorClasses = getColorClasses();

  const handleUserDataChange = (e) => {
    const { name, value, type, checked } = e.target;
    setUserData({
      ...userData,
      [name]: type === "checkbox" ? checked : value,
    });

    if (name === "unique_name") {
      setNameError("");
    }
  };

  const checkNameUnique = async (name) => {
    if (!name.trim()) {
      return { isUnique: false, error: t("name_cannot_be_empty") };
    }

    try {
      const { data, error } = await supabase
        .from("users")
        .select("unique_name")
        .eq("unique_name", name.trim())
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        return { isUnique: false, error: t("name_already_taken") };
      }

      return { isUnique: true, error: "" };
    } catch (error) {
      console.error("Name uniqueness check error:", error.message);
      return { isUnique: false, error: t("name_check_error") };
    }
  };

  const validateUserData = async () => {
    if (!userData.unique_name.trim()) {
      setNameError(t("please_enter_unique_name"));
      return false;
    }

    if (!userData.date_of_birth) {
      alert(t("please_enter_date_of_birth"));
      return false;
    }

    if (!userData.country) {
      alert(t("please_select_country"));
      return false;
    }

    if (!userData.has_accepted_terms) {
      alert(t("please_accept_terms"));
      return false;
    }

    // Date of birth validation
    const birthDate = new Date(userData.date_of_birth);
    const today = new Date();

    if (birthDate > today) {
      alert(t("date_of_birth_invalid_future"));
      return false;
    }

    // Minimum age check (13 years)
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 13);

    if (birthDate > minDate) {
      alert(t("must_be_at_least_13_years_old"));
      return false;
    }

    // Maximum age check (120 years)
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 120);

    if (birthDate < maxDate) {
      alert(t("date_of_birth_invalid_past"));
      return false;
    }

    setCheckingName(true);
    const nameCheck = await checkNameUnique(userData.unique_name);
    setCheckingName(false);

    if (!nameCheck.isUnique) {
      setNameError(nameCheck.error);
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!(await validateUserData())) {
      return;
    }

    setLoading(true);

    try {
      // Pass only date of birth
      onComplete({
        unique_name: userData.unique_name,
        date_of_birth: userData.date_of_birth,
        country: userData.country,
        has_accepted_terms: userData.has_accepted_terms,
      });
    } catch (error) {
      console.error("Registration error:", error);
      alert(`${t("error")}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("web3_wallet_address");
    localStorage.removeItem("web3_signature");
    localStorage.removeItem("web3_message");
    localStorage.removeItem("web3_nonce");
    navigate("/");
  };

  const getMaxDateOfBirth = () => {
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 13);
    return maxDate.toISOString().split("T")[0];
  };

  const getMinDateOfBirth = () => {
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(today.getFullYear() - 120);
    return minDate.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-6 space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {t("user_registration")}
          </h2>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-sm font-medium text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
          >
            {t("logout")}
          </button>
        </div>

        <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200 dark:border-blue-700">
          <p className="text-sm text-gray-700 dark:text-gray-300">
            {userEmail && !userEmail.includes("@web3.local")
              ? `${t("email")}: ${userEmail}`
              : ""}
            {walletAddress
              ? `${userEmail ? " • " : ""}${t("web3_address")}: ${walletAddress.slice(0, 10)}...`
              : ""}
          </p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("unique_name")} *
            </label>
            <input
              type="text"
              name="unique_name"
              value={userData.unique_name}
              onChange={handleUserDataChange}
              className={`w-full p-2 rounded-full font-medium transition-all duration-300
                border-2 ${nameError ? "border-red-500" : "border-blue-300 dark:border-gray-600"}
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-transparent
                placeholder-blue-900/70 dark:placeholder-gray-400
                text-center
                hover:bg-gray-50 dark:hover:bg-gray-600`}
              placeholder={t("enter_unique_name")}
              required
            />
            {nameError && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                {nameError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("date_of_birth")} *
            </label>
            <input
              type="date"
              name="date_of_birth"
              value={userData.date_of_birth}
              onChange={handleUserDataChange}
              className="w-full p-2 rounded-full font-medium transition-all duration-300
                border-2 border-blue-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-transparent
                placeholder-blue-900/70 dark:placeholder-gray-400
                text-center
                hover:bg-gray-50 dark:hover:bg-gray-600"
              min={getMinDateOfBirth()}
              max={getMaxDateOfBirth()}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {t("country")} *
            </label>
            <select
              name="country"
              value={userData.country}
              onChange={handleUserDataChange}
              className="w-full p-2 rounded-full font-medium transition-all duration-300
                border-2 border-blue-300 dark:border-gray-600
                bg-white dark:bg-gray-700
                text-gray-900 dark:text-white
                focus:outline-none focus:ring-1 focus:ring-blue-900 focus:border-transparent
                placeholder-blue-900/70 dark:placeholder-gray-400
                text-center
                hover:bg-gray-50 dark:hover:bg-gray-600
                appearance-none"
              required
            >
              {countries.map((country) => (
                <option
                  key={country.code}
                  value={country.code}
                  className="bg-white dark:bg-gray-700"
                >
                  {getCountryName(country.code)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-start p-4 border border-blue-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700">
            <input
              type="checkbox"
              name="has_accepted_terms"
              id="has_accepted_terms"
              checked={userData.has_accepted_terms}
              onChange={handleUserDataChange}
              className="mt-0.5 mr-3 h-4 w-4 text-blue-600 dark:text-blue-500 focus:ring-blue-900 border-blue-300 dark:border-gray-600 rounded"
              required
            />
            <label
              htmlFor="has_accepted_terms"
              className="text-sm text-gray-700 dark:text-gray-300"
            >
              {t("accept_terms_agreement")}{" "}
              <a
                href="/terms-of-service"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                {t("terms_of_service_link")}
              </a>{" "}
              {t("and")}{" "}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 underline hover:text-blue-800 dark:hover:text-blue-300"
                onClick={(e) => e.stopPropagation()}
              >
                {t("privacy_policy_link")}
              </a>
              {" *"}
            </label>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!userData.has_accepted_terms || checkingName || loading}
            className={`
              w-full px-3 py-3 rounded-full font-medium transition-all duration-300
              flex items-center justify-center gap-2 text-sm text-white transform
              bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
              ring-1 ring-transparent
              hover:scale-[1.02] shadow hover:shadow-md
              hover:ring-transparent
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow
              ${checkingName || loading ? "cursor-wait" : ""}
            `}
          >
            {checkingName || loading ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {checkingName ? t("checking_name") : t("processing")}
              </>
            ) : (
              t("complete_registration")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
