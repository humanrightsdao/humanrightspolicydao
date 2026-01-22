// src/pages/PrivacyPage.jsx
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export default function PrivacyPage() {
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
            {t("privacy_policy_title")}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            {t("privacy_last_updated")}: 18 {t("january")} 2026
          </p>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead">
            <strong>Human Rights Policy DAO</strong> («{t("privacy_we")}», «
            {t("privacy_platform")}») {t("privacy_respects")}
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            1. {t("privacy_data_we_collect")}
          </h2>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            1.1. {t("privacy_voluntary_data")}
          </h3>
          <p>{t("privacy_voluntary_data_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("privacy_data_email")}</li>
            <li>{t("privacy_data_username")}</li>
            <li>{t("privacy_data_avatar")}</li>
            <li>{t("privacy_data_country")}</li>
            <li>{t("privacy_data_bio")}</li>
            <li>{t("privacy_data_content")}</li>
            <li>{t("privacy_data_geolocation")}</li>
          </ul>

          <h3 className="text-xl font-semibold mt-6 mb-3">
            1.2. {t("privacy_technical_data")}
          </h3>
          <p>{t("privacy_technical_data_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("privacy_technical_ip")}</li>
            <li>{t("privacy_technical_user_agent")}</li>
            <li>{t("privacy_technical_timestamp")}</li>
            <li>{t("privacy_technical_cookies")}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            2. {t("privacy_data_we_dont_collect")}
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("privacy_dont_precise_location")}</li>
            <li>{t("privacy_dont_payment_cards")}</li>
            <li>{t("privacy_dont_passport")}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            3. {t("privacy_purpose_of_use")}
          </h2>
          <p>{t("privacy_purpose_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("privacy_purpose_access")}</li>
            <li>{t("privacy_purpose_display")}</li>
            <li>{t("privacy_purpose_moderation")}</li>
            <li>{t("privacy_purpose_support")}</li>
            <li>{t("privacy_purpose_analytics")}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            4. {t("privacy_legal_basis_gdpr")}
          </h2>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>{t("privacy_basis_consent")}</strong> —{" "}
              {t("privacy_basis_consent_description")}
            </li>
            <li>
              <strong>{t("privacy_basis_contract")}</strong> —{" "}
              {t("privacy_basis_contract_description")}
            </li>
            <li>
              <strong>{t("privacy_basis_legitimate_interest")}</strong> —{" "}
              {t("privacy_basis_interest_description")}
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            5. {t("privacy_storage_deletion")}
          </h2>
          <p>{t("privacy_storage_content")}</p>
          <p>{t("privacy_deletion_account")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            6. {t("privacy_third_party_sharing")}
          </h2>
          <p>{t("privacy_sharing_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>
              <strong>Supabase</strong> — {t("privacy_sharing_supabase")}
            </li>
            <li>
              <strong>{t("privacy_sharing_hosting")}</strong> —{" "}
              {t("privacy_sharing_hosting_description")}
            </li>
          </ul>
          <p className="mt-4 font-semibold">{t("privacy_no_selling")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            7. {t("privacy_your_rights_gdpr")}
          </h2>
          <p>{t("privacy_rights_description")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("privacy_right_access")}</li>
            <li>{t("privacy_right_correction")}</li>
            <li>{t("privacy_right_deletion")}</li>
            <li>{t("privacy_right_restriction")}</li>
            <li>{t("privacy_right_portability")}</li>
            <li>{t("privacy_right_objection")}</li>
          </ul>
          <p className="mt-4">{t("privacy_rights_contact")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            8. {t("privacy_international_transfers")}
          </h2>
          <p>{t("privacy_transfers_description")}</p>
          <p>{t("privacy_transfers_mechanisms")}:</p>
          <ul className="list-disc pl-6 mt-2 space-y-2">
            <li>{t("privacy_mechanism_scc")}</li>
            <li>{t("privacy_mechanism_adequacy")}</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            9. {t("privacy_security")}
          </h2>
          <p>{t("privacy_security_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            10. {t("privacy_changes")}
          </h2>
          <p>{t("privacy_changes_description")}</p>

          <h2 className="text-2xl font-bold mt-8 mb-4">
            11. {t("privacy_contact")}
          </h2>
          <p>{t("privacy_contact_description")}</p>

          <div className="mt-10 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-700">
            <p className="font-semibold text-gray-800 dark:text-gray-200">
              {t("privacy_acceptance")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
