// src/pages/TermsOfService.jsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function TermsOfService() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-black p-4">
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-6 md:p-8">
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 mb-4"
          >
            ← {t("back_to_home")}
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("terms_of_service_title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t("terms_last_updated")}: 18 {t("january")} 2026
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead">
            <strong>Human Rights Policy DAO</strong> («{t("terms_platform")}», «
            {t("terms_we")}», «{t("terms_us")}») — {t("terms_description")}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            1. {t("terms_nature_of_platform")}
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            1.1. {t("terms_technical_provider")}
          </h3>
          <p>{t("terms_technical_provider_description")}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            1.2. {t("terms_user_responsibility")}
          </h3>
          <p>{t("terms_user_responsibility_description")}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            1.3. {t("terms_not_official")}
          </h3>
          <p>{t("terms_not_official_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            2. {t("terms_prohibited_content")}
          </h2>
          <p>{t("terms_prohibited_content_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("terms_prohibited_law_violation")}</li>
            <li>{t("terms_prohibited_personal_data")}</li>
            <li>{t("terms_prohibited_false_information")}</li>
            <li>{t("terms_prohibited_intellectual_property")}</li>
            <li>{t("terms_prohibited_child_exploitation")}</li>
            <li>{t("terms_prohibited_spam")}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            3. {t("terms_disclaimer")}
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            3.1. {t("terms_as_is")}
          </h3>
          <p>{t("terms_as_is_description")}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            3.2. {t("terms_limitation_of_liability")}
          </h3>
          <p>{t("terms_limitation_1")}</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("terms_limitation_2")}</li>
            <li>{t("terms_limitation_3")}</li>
            <li>{t("terms_limitation_4")}</li>
            <li>{t("terms_limitation_5")}</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            3.3. {t("terms_damages_exclusion")}
          </h3>
          <p>{t("terms_damages_exclusion_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            4. {t("terms_license_grant")}
          </h2>
          <p>{t("terms_license_grant_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            5. {t("terms_moderation_deletion")}
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.1. {t("terms_right_to_remove")}
          </h3>
          <p>{t("terms_right_to_remove_description")}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            5.2. {t("terms_no_notification")}
          </h3>
          <p>{t("terms_no_notification_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            6. {t("terms_evidence_obligations")}
          </h2>
          <p>{t("terms_evidence_obligations_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("terms_evidence_lawful")}</li>
            <li>{t("terms_evidence_privacy")}</li>
            <li>{t("terms_evidence_criminal")}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            7. {t("terms_access_termination")}
          </h2>
          <p>{t("terms_access_termination_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            8. {t("terms_changes")}
          </h2>
          <p>{t("terms_changes_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            9. {t("terms_governing_law_disputes")}
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            9.1. {t("terms_governing_law")}
          </h3>
          <p>{t("terms_governing_law_description")}</p>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            9.2. {t("terms_dispute_resolution")}
          </h3>
          <p>{t("terms_dispute_resolution_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            10. {t("terms_contact")}
          </h2>
          <p>{t("terms_contact_description")}</p>

          <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {t("terms_acceptance")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
