//App.jsx
import { useState, useEffect } from "react";
import { supabase } from "./lib/supabase";
import { useNavigate } from "react-router-dom";
import { useGoogleAuth } from "./hooks/useGoogleAuth";
import { useEmailAuth } from "./hooks/useEmailAuth";
import { useWeb3Auth } from "./hooks/useWeb3Auth";
import { useUsernameAuth } from "./hooks/useUsernameAuth";
import { useTranslation } from "react-i18next";
import AuthUI from "./components/AuthUI";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeForm, setActiveForm] = useState(null);
  const [email, setEmail] = useState("");

  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const { handleGoogleLogin } = useGoogleAuth();
  const {
    sendMagicLink,
    reset: resetEmailAuth,
    loading: emailLoading,
    emailSent,
    setEmailSent,
  } = useEmailAuth();
  const web3Auth = useWeb3Auth();

  const {
    signInWithUsername,
    signUpWithUsername,
    loading: usernameLoading,
    error: usernameError,
    setError: setUsernameError,
  } = useUsernameAuth();

  useEffect(() => {
    console.log("- Current language:", i18n.language);
    const initializeAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        console.log("Initial session:", session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("User found, checking onboarding status...");
          await checkOnboardingStatus(session.user.id);
        }
      } catch (error) {
        console.error("Error getting session:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event, session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      } else {
        web3Auth.disconnect();
        setUsernameError("");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkOnboardingStatus = async (userId) => {
    try {
      console.log("Checking onboarding for user:", userId);

      const { data, error } = await supabase
        .from("users")
        .select("has_completed_onboarding")
        .eq("id", userId)
        .single();

      if (error) {
        console.log("User not found in users table, will create...");
        const { error: insertError } = await supabase.from("users").insert({
          id: userId,
          has_completed_onboarding: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error creating user record:", insertError);
        }

        navigate("/onboarding");
        return;
      }

      console.log("Onboarding status:", data?.has_completed_onboarding);
      navigate(data?.has_completed_onboarding ? "/country" : "/onboarding");
    } catch (error) {
      console.error("Error checking onboarding:", error);
      navigate("/onboarding");
    }
  };

  const handleGoogleLoginWithError = async () => {
    try {
      await handleGoogleLogin();
    } catch (error) {
      console.error("Error logging in with Google:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    const result = await sendMagicLink(email);
    if (result.success) {
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleWeb3Login = async () => {
    try {
      console.log("Starting Web3 login process...");
      const result = await web3Auth.login();

      if (result.success) {
        alert("✅ Web3 authentication successful!");

        const { data: userData } = await supabase.auth.getUser();
        console.log("Web3 user authenticated:", userData.user);

        if (userData.user) {
          await checkOnboardingStatus(userData.user.id);
        }
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Web3 login error in App.jsx:", error);
      alert(`Web3 authentication error: ${error.message}`);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };

  const handleLogout = async () => {
    try {
      console.log("Logging out...");
      await supabase.auth.signOut();
      web3Auth.disconnect();
      setUser(null);
      alert("You have successfully logged out");
    } catch (error) {
      console.error("Logout error:", error);
      alert(`Logout error: ${error.message}`);
    }
  };

  const resetForms = () => {
    setActiveForm(null);
    resetEmailAuth();
    setEmail("");
    setUsernameError("");
    web3Auth.setError("");
    web3Auth.setMessage("");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {t("loading")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4 transition-colors duration-200">
      {!user ? (
        <div className="w-full max-w-2xl">
          {/* Logo added */}
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-32 w-auto object-contain"
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Human Rights Policy
              <br />
              Decentralized Autonomous Organization
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Allow no harm to yourself. Do no harm to others.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl transition-colors duration-200">
            <AuthUI
              activeForm={activeForm}
              email={email}
              setEmail={setEmail}
              emailLoading={emailLoading}
              emailSent={emailSent}
              web3Auth={web3Auth}
              onSelect={{
                google: handleGoogleLoginWithError,
                email: () => setActiveForm("email"),
                web3: () => setActiveForm("web3"),
              }}
              onEmailSubmit={handleEmailLogin}
              onWeb3Submit={handleWeb3Login}
              onBack={resetForms}
              usernameLoading={usernameLoading}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl transition-colors duration-200">
          {/* Language remains the same as automatically determined on first load */}

          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <span className="text-white text-2xl font-bold">
                {user.email ? user.email.charAt(0).toUpperCase() : "U"}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t("welcome")}
              {user.user_metadata?.name ? `, ${user.user_metadata.name}` : ""}!
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              {t("successfully_logged_in")}
            </p>

            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl transition-colors duration-200">
              {user.email &&
                !user.email.includes("@web3") &&
                !user.email.includes("@temp-web3") && (
                  <p className="text-gray-700 dark:text-gray-200">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                )}

              {user.user_metadata?.unique_name && (
                <p className="text-gray-700 dark:text-gray-200">
                  <span className="font-medium">Username:</span>{" "}
                  {user.user_metadata.unique_name}
                </p>
              )}

              {localStorage.getItem("web3_wallet_address") && (
                <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg border border-purple-100 dark:border-purple-700 transition-colors duration-200">
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-200 mb-1">
                    <span className="inline-flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M10 3.22l-.61-.6a5.5 5.5 0 00-7.78 7.77L10 18.78l8.39-8.4a5.5 5.5 0 00-7.78-7.77l-.61.61z" />
                      </svg>{" "}
                      {t("web3_address")}:
                    </span>
                  </p>
                  <p className="font-mono text-sm text-purple-600 dark:text-purple-300 bg-white dark:bg-gray-800 p-2 rounded border border-purple-200 dark:border-purple-600 transition-colors duration-200">
                    {web3Auth.formatWalletAddress(
                      localStorage.getItem("web3_wallet_address"),
                    )}
                  </p>
                  <p className="mt-1 text-xs text-purple-500 dark:text-purple-400">
                    🔗 {t("authenticated_via_web3")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => navigate("/country")}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-900 via-blue-950 to-blue-900 hover:from-black hover:via-gray-900 hover:to-blue-950 active:bg-gradient-to-r active:from-black active:via-gray-900 active:to-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-all duration-200"
            >
              {t("profile")}
            </button>
            <button
              onClick={() => navigate("/onboarding")}
              className="w-full flex justify-center py-3 px-4 border border-blue-300 dark:border-blue-600 rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-800 via-blue-900 to-blue-800 hover:from-gray-900 hover:via-blue-950 hover:to-blue-900 active:bg-gradient-to-r active:from-black active:via-gray-900 active:to-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-all duration-200"
            >
              {t("complete_onboarding")}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-gray-900 via-blue-950 to-blue-900 hover:from-black hover:via-gray-900 hover:to-blue-950 active:bg-gradient-to-r active:from-black active:via-gray-900 active:to-blue-950 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-700 transition-all duration-200"
            >
              {t("logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
