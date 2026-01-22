//pages/Onboarding.jsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import UserRegistration from "../components/UserRegistration";
import { humanRightsLessons } from "../utils/humanRightsLessons";
import { humanRightsTests } from "../utils/humanRightsTests";
import { getRandomTestsForUser } from "../utils/humanRightsTests";

const policyUrl =
  "https://ipfs.io/ipfs/QmRXQP1s6rVaiXxrr6jY6Y7EfK1CYvyc82F99siunckoQr/";

function HumanRightsLessons({
  onComplete,
  onBack,
  userData,
  userEmail,
  walletAddress,
  authMethod,
}) {
  const { t } = useTranslation();
  const [currentLesson, setCurrentLesson] = useState(0);
  const [lessonsRead, setLessonsRead] = useState(new Set());

  useEffect(() => {
    const markCurrentAsRead = () => {
      const newRead = new Set(lessonsRead);
      newRead.add(humanRightsLessons[currentLesson].id);
      setLessonsRead(newRead);
    };

    markCurrentAsRead();
  }, [currentLesson]);

  const handleNext = () => {
    if (currentLesson < humanRightsLessons.length - 1) {
      setCurrentLesson(currentLesson + 1);
    } else {
      const allLessonsRead = new Set(lessonsRead);
      allLessonsRead.add(humanRightsLessons[currentLesson].id);

      if (allLessonsRead.size === humanRightsLessons.length) {
        onComplete();
      } else {
        alert(t("onboarding.please_read_all_lessons"));
      }
    }
  };

  const handlePrev = () => {
    if (currentLesson > 0) {
      setCurrentLesson(currentLesson - 1);
    }
  };

  const handleComplete = () => {
    const allLessonsRead = new Set(lessonsRead);
    allLessonsRead.add(humanRightsLessons[currentLesson].id);

    if (allLessonsRead.size === humanRightsLessons.length) {
      onComplete();
    } else {
      alert(t("onboarding.please_read_all_lessons"));
    }
  };

  const handleLessonSelect = (index) => {
    setCurrentLesson(index);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("onboarding.lesson_progress", {
                current: currentLesson + 1,
                total: humanRightsLessons.length,
              })}
            </h2>
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentLesson + 1) / humanRightsLessons.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {t(humanRightsLessons[currentLesson].titleKey)}
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {t(humanRightsLessons[currentLesson].contentKey)}
          </p>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={currentLesson === 0 ? onBack : handlePrev}
            className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white transition-colors"
          >
            ←{" "}
            {currentLesson === 0
              ? t("onboarding.back_to_policy")
              : t("onboarding.previous_lesson")}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t("onboarding.read")}: {lessonsRead.size}/
              {humanRightsLessons.length}
            </div>
            {currentLesson === humanRightsLessons.length - 1 ? (
              <button
                onClick={handleComplete}
                className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300"
              >
                {t("onboarding.complete_learning")}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
              >
                {t("onboarding.next_lesson")}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 grid grid-cols-5 gap-2">
          {humanRightsLessons.map((lesson, index) => (
            <div
              key={lesson.id}
              onClick={() => handleLessonSelect(index)}
              className={`h-2 rounded-full cursor-pointer transition-all ${
                index === currentLesson
                  ? "bg-blue-600"
                  : lessonsRead.has(lesson.id)
                    ? "bg-green-500"
                    : "bg-gray-300 dark:bg-gray-600"
              }`}
              title={`${t("onboarding.lessons")} ${index + 1}: ${t(lesson.titleKey)}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HumanRightsTests({
  onComplete,
  onBack,
  loading,
  userData,
  userEmail,
  walletAddress,
  authMethod,
}) {
  const { t } = useTranslation();
  const [currentTest, setCurrentTest] = useState(0);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [userTests, setUserTests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load random 10 tests on first render
  useEffect(() => {
    const loadRandomTests = () => {
      setIsLoading(true);

      // Add small delay for better UX
      setTimeout(() => {
        try {
          const randomTests = getRandomTestsForUser();

          // Make sure we got exactly 10 questions
          if (randomTests.length !== 10) {
            console.warn(
              `Received ${randomTests.length} questions instead of 10. Generating new ones.`,
            );
            // If not 10 questions, generate again
            const newTests = getRandomTestsForUser();
            setUserTests(newTests);
          } else {
            setUserTests(randomTests);
          }

          setIsLoading(false);
        } catch (error) {
          console.error("Error generating tests:", error);
          setIsLoading(false);
        }
      }, 100);
    };

    loadRandomTests();
  }, []);

  const handleAnswer = (answer) => {
    const newAnswers = {
      ...answers,
      [currentTest]: answer,
    };
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentTest < userTests.length - 1) {
      setCurrentTest(currentTest + 1);
    }
  };

  const handlePrev = () => {
    if (currentTest > 0) {
      setCurrentTest(currentTest - 1);
    }
  };

  const handleSubmit = () => {
    if (userTests.length === 0) return;

    // Check if all questions are answered
    const allAnswered = Object.keys(answers).length === userTests.length;

    if (!allAnswered) {
      alert(t("onboarding.answer_all_questions"));
      return;
    }

    let correctCount = 0;

    userTests.forEach((test, index) => {
      if (answers[index] === test.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setSubmitted(true);

    if (correctCount === userTests.length) {
      onComplete();
    }
  };

  const handleRetry = () => {
    setIsLoading(true);
    setSubmitted(false);
    setCurrentTest(0);
    setAnswers({});
    setScore(0);

    // Generate new random tests on retry
    setTimeout(() => {
      const newRandomTests = getRandomTestsForUser();
      setUserTests(newRandomTests);
      setIsLoading(false);
    }, 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            {t("onboarding.generating_random_tests")}...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            {t("onboarding.selecting_10_questions")}
          </p>
        </div>
      </div>
    );
  }

  if (userTests.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 dark:border-red-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-red-600 dark:text-red-400">
            {t("onboarding.failed_to_load_tests")}
          </p>
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                const newTests = getRandomTestsForUser();
                setUserTests(newTests);
                setIsLoading(false);
              }, 100);
            }}
            className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
          >
            {t("onboarding.retry")}
          </button>
        </div>
      </div>
    );
  }

  const currentTestData = userTests[currentTest];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("onboarding.test_progress", {
                current: currentTest + 1,
                total: userTests.length,
              })}
            </h2>
            <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-blue-800 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentTest + 1) / userTests.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </div>

        {submitted ? (
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {t("onboarding.test_results")}
            </h3>
            <div className="text-center">
              <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                {score}/{userTests.length}
              </div>
              <p className="text-gray-700 dark:text-gray-300 mb-4">
                {score === userTests.length
                  ? t("onboarding.congratulations")
                  : t("onboarding.correct_answers", {
                      score,
                      total: userTests.length,
                    })}
              </p>

              {score === userTests.length ? (
                <div>
                  {loading ? (
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-blue-600 dark:border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-3 text-gray-600 dark:text-gray-300">
                        {t("onboarding.processing")}
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-green-600 dark:text-green-400 font-medium">
                        {t("onboarding.test_complete_success")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t("onboarding.all_10_correct")}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-red-600 dark:text-red-400 font-medium">
                    {t("onboarding.must_answer_all")}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    {t("onboarding.need_perfect_score")}
                  </p>
                  <button
                    onClick={handleRetry}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                  >
                    {t("onboarding.try_again_with_new_tests")}
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl shadow-md">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {t(currentTestData.questionKey)}
                </h3>
              </div>
              <div className="space-y-3">
                {currentTestData.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option.value)}
                    className={`
                      w-full p-4 text-left rounded-xl font-medium transition-all duration-300
                      border-2 ${
                        answers[currentTest] === option.value
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                      }
                      text-gray-900 dark:text-white
                      hover:border-blue-500 dark:hover:border-blue-500
                      hover:scale-[1.02] hover:shadow-md
                    `}
                  >
                    <div className="flex items-center justify-between">
                      <span>{t(option.key)}</span>
                      {answers[currentTest] === option.value && (
                        <span className="text-blue-500 font-bold">✓</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <button
                onClick={currentTest === 0 ? onBack : handlePrev}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-300 hover:text-blue-900 dark:hover:text-white transition-colors"
              >
                ←{" "}
                {currentTest === 0
                  ? t("onboarding.back_to_lessons")
                  : t("onboarding.previous_test")}
              </button>

              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {t("onboarding.answered")}: {Object.keys(answers).length}/
                  {userTests.length}
                </div>
                {currentTest === userTests.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={Object.keys(answers).length < userTests.length}
                    className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-full font-medium hover:from-green-700 hover:to-green-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t("onboarding.complete_test")}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-full font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-300"
                  >
                    {t("onboarding.next_test")}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-8">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                {t("onboarding.test_navigation")}
              </div>
              <div className="grid grid-cols-10 gap-1">
                {userTests.map((test, index) => (
                  <div
                    key={test.id}
                    onClick={() => setCurrentTest(index)}
                    className={`h-2 rounded-full cursor-pointer transition-all ${
                      index === currentTest
                        ? "bg-blue-600"
                        : answers[index]
                          ? "bg-green-500"
                          : "bg-gray-300 dark:bg-gray-600"
                    }`}
                    title={`${t("onboarding.tests")} ${index + 1}`}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function Onboarding() {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState("userData");
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [authMethod, setAuthMethod] = useState("");
  const [hasVisitedPolicy, setHasVisitedPolicy] = useState(false);
  const [hasAgreedToPolicy, setHasAgreedToPolicy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error) throw error;

      if (!user) {
        navigate("/");
        return;
      }

      const web3Address = localStorage.getItem("web3_wallet_address");
      const userMetadata = user.user_metadata || {};

      if (web3Address || userMetadata.wallet_address) {
        const addr = web3Address || userMetadata.wallet_address;
        setWalletAddress(addr);
        setAuthMethod("web3");

        if (user.email && user.email.includes("@web3.local")) {
          setUserEmail(`Web3 Wallet: ${addr.slice(0, 10)}...`);
        } else {
          setUserEmail(user.email || "");
        }
      } else if (user.email) {
        setUserEmail(user.email);
        setAuthMethod("email");
      } else {
        setAuthMethod("google");
      }

      const { data: existingUser } = await supabase
        .from("users")
        .select("has_completed_onboarding")
        .eq("id", user.id)
        .single();

      if (existingUser?.has_completed_onboarding) {
        navigate("/country");
      }
    } catch (error) {
      console.error("Error checking user:", error.message);
      navigate("/");
    }
  };

  const handleUserDataComplete = (data) => {
    setUserData(data);
    setCurrentStep("welcome");
  };

  const handleWelcomeContinue = () => {
    if (hasVisitedPolicy && hasAgreedToPolicy) {
      setCurrentStep("lessons");
    } else {
      alert(t("onboarding.view_policy_first"));
    }
  };

  const handleLessonsComplete = () => {
    setCurrentStep("tests");
  };

  const handleTestsComplete = async () => {
    await completeOnboarding();
  };

  const completeOnboarding = async () => {
    setLoading(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        alert("User not found. Please log in again.");
        navigate("/");
        return;
      }

      if (!userData) {
        alert("User data missing. Please fill out the form again.");
        setCurrentStep("userData");
        setLoading(false);
        return;
      }

      const walletAddr =
        walletAddress || localStorage.getItem("web3_wallet_address");

      const { error: upsertError } = await supabase.from("users").upsert(
        {
          id: user.id,
          email: user.email || null,
          wallet_address: walletAddr || null,
          unique_name: userData.unique_name.trim(),
          date_of_birth: userData.date_of_birth,
          country: userData.country,
          has_accepted_terms: userData.has_accepted_terms,
          has_completed_onboarding: true,
          has_completed_lessons: true,
          has_completed_tests: true,
          has_accepted_human_rights_policy: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        },
      );

      if (upsertError) throw upsertError;

      const { data: updatedUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;

      if (!updatedUser?.has_completed_onboarding) {
        throw new Error("Failed to save onboarding data");
      }

      localStorage.removeItem("web3_signature");
      localStorage.removeItem("web3_message");
      localStorage.removeItem("web3_nonce");

      navigate("/country");
    } catch (error) {
      console.error("Error completing onboarding:", error.message);
      alert(`${t("error")}: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === "tests") {
      setCurrentStep("lessons");
    } else if (currentStep === "lessons") {
      setCurrentStep("welcome");
    } else if (currentStep === "welcome") {
      setCurrentStep("userData");
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

  const getColorClasses = (isActive = false) => {
    return {
      gradient: isActive
        ? "from-black via-gray-900 to-blue-950"
        : "from-gray-800 via-blue-900 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900",
      hover:
        "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950",
    };
  };

  if (currentStep === "userData") {
    return (
      <UserRegistration
        onComplete={handleUserDataComplete}
        userEmail={userEmail}
        walletAddress={walletAddress}
        authMethod={authMethod}
      />
    );
  }

  if (currentStep === "welcome") {
    const colorClasses = getColorClasses();

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-lg w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 md:p-8">
          <div className="flex justify-center mb-6">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-24 w-auto object-contain"
            />
          </div>

          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-4">
            {t("onboarding.welcome_to_policy")}
          </h1>

          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {t("onboarding.policy_intro")}
            </p>

            <div className="space-y-3">
              <a
                href={policyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setHasVisitedPolicy(true)}
                className="block w-full px-4 py-3 text-center bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-xl hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors font-medium relative"
              >
                {t("onboarding.read_policy")}
                {hasVisitedPolicy && (
                  <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-green-500">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                )}
              </a>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="flex items-start space-x-3">
              <input
                type="checkbox"
                id="policyAgreement"
                checked={hasAgreedToPolicy}
                onChange={(e) => setHasAgreedToPolicy(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="policyAgreement"
                className="text-gray-700 dark:text-gray-300 text-sm"
              >
                {t("onboarding.policy_agreement")}
              </label>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleWelcomeContinue}
              disabled={!hasVisitedPolicy || !hasAgreedToPolicy}
              className={`
                w-full px-3 py-3 rounded-full font-medium transition-all duration-300
                flex items-center justify-center gap-2 text-sm text-white transform
                bg-gradient-to-r ${colorClasses.gradient} ${colorClasses.hover}
                ring-1 ring-transparent
                hover:scale-[1.02] shadow hover:shadow-md
                hover:transparent
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow
              `}
            >
              {t("onboarding.continue_to_learning")}
            </button>

            <button
              onClick={() => setCurrentStep("userData")}
              className="w-full px-3 py-3 rounded-full font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              {t("onboarding.back_to_edit_data")}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {userData && (
                  <span className="font-medium">
                    {userData.unique_name}, {userData.country}
                  </span>
                )}
                {userEmail && !userEmail.includes("@web3.local")
                  ? ` • ${t("email")}: ${userEmail}`
                  : ""}
                {walletAddress
                  ? ` • ${t("web3_address")}: ${walletAddress.slice(0, 10)}...`
                  : ""}
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 transition-colors"
              >
                {t("onboarding.logout")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentStep === "lessons") {
    return (
      <HumanRightsLessons
        onComplete={handleLessonsComplete}
        onBack={handleBack}
        userData={userData}
        userEmail={userEmail}
        walletAddress={walletAddress}
        authMethod={authMethod}
      />
    );
  }

  if (currentStep === "tests") {
    return (
      <HumanRightsTests
        onComplete={handleTestsComplete}
        onBack={handleBack}
        loading={loading}
        userData={userData}
        userEmail={userEmail}
        walletAddress={walletAddress}
        authMethod={authMethod}
      />
    );
  }

  return null;
}
