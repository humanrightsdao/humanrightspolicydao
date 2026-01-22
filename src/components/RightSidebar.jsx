// src/components/RightSidebar.jsx
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Copy, Check } from "lucide-react";
import ViolationsSlideshow from "./ViolationsSlideshow";

const RightSidebar = ({ activeRightMenu, onRightMenuClick }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [copiedWallet, setCopiedWallet] = useState(null);

  const getColorClasses = (isActive = false) => {
    return {
      gradient: isActive
        ? "from-black via-gray-900 to-blue-950"
        : "from-gray-900 via-blue-950 to-blue-800 dark:from-gray-900 dark:via-blue-950 dark:to-blue-900",
      hover:
        "hover:from-black hover:via-gray-900 hover:to-blue-950 dark:hover:from-black dark:hover:via-gray-850 dark:hover:to-blue-950",
    };
  };

  // Click handler for violations
  const handleViolationsClick = () => {
    navigate("/complaints-list");
  };

  // Wallet address copy handler
  const handleCopyAddress = (address, walletType) => {
    navigator.clipboard
      .writeText(address)
      .then(() => {
        setCopiedWallet(walletType);
        setTimeout(() => setCopiedWallet(null), 2000);
      })
      .catch((err) => {
        console.error("Copy error: ", err);
      });
  };

  // Main menu items
  const menuItems = [
    {
      key: "violations",
      icon: AlertCircle,
      label: t("violations"),
      onClick: handleViolationsClick,
    },
  ];

  // Wallet data for support
  const walletData = [
    {
      type: "ethereum",
      name: t("wallet_ethereum") || "Ethereum",
      address:
        t("address_ethereum") || "0x663268040985F90F1EDdB06fb68C9eb4A253BbdF",
    },
    {
      type: "bitcoin",
      name: t("wallet_bitcoin") || "Bitcoin",
      address:
        t("address_bitcoin") ||
        "bc1pufqffktke7zzeah42uh24wq6hsdhwqj2j8n3006mwnlaspn77a8qvsg3hz",
    },
    {
      type: "ton",
      name: t("wallet_ton") || "TON",
      address:
        t("address_ton") || "UQAzdo0EM6VvuPMT5Xo-Kpf_XthwaC8AIXlq_RNSHn_eHS_0",
    },
    {
      type: "solana",
      name: t("wallet_solana") || "Solana",
      address:
        t("address_solana") || "7KGUoT1pJHWTpBWVoY6LpzJoJMrLurNURho6MNnoBTK1",
    },
    {
      type: "tether",
      name: t("wallet_tether") || "Tether (ERC-20)",
      address:
        t("address_tether") || "0x5254A74760EfFE7b8Bcb245490A39ABDAB910A9C",
    },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Main content with scroll */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-4">
          {/* Header for mobile devices */}
          <div className="lg:hidden mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {t("additional_options")}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("additional_options_description")}
            </p>
          </div>

          {/* Violations slideshow */}
          <div className="mb-6">
            <ViolationsSlideshow />
          </div>

          {/* Information block */}
          <div className="mt-4 pt-4 border-t border-blue-950 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              {t("information") || "Information"}
            </h4>

            <div className="space-y-3">
              {/* Development support block - compact */}
              <div>
                {/* Changed: added max-width for wider text */}
                <div className="mb-2 max-w-[240px]">
                  <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                    {t("sidebar_info_description") ||
                      "This platform is designed to promote peaceful coexistence and mutual respect among all people based on the Human Rights Policy."}
                  </p>
                </div>

                <div className="mb-2">
                  <h5 className="text-xs font-medium text-gray-900 dark:text-white flex items-center gap-1">
                    <span className="text-blue-600 dark:text-blue-400">♥</span>
                    {t("support_development") || "Support platform development"}
                  </h5>
                </div>

                {/* Changed: reduced spacing between wallet elements */}
                <div className="space-y-0.5">
                  {walletData.map((wallet) => (
                    <div key={wallet.type} className="group relative">
                      <button
                        onClick={() =>
                          handleCopyAddress(wallet.address, wallet.type)
                        }
                        className="w-full flex items-center justify-between p-1.5 text-xs rounded transition-all duration-200 hover:bg-white dark:hover:bg-gray-800/50"
                        title={`Click to copy the address ${wallet.name}`}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <span className="font-medium text-gray-800 dark:text-gray-200 min-w-[70px] text-left text-[11px]">
                            {wallet.name}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400 truncate text-left text-[10px] flex-1">
                            {wallet.address}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 ml-2">
                          {copiedWallet === wallet.type ? (
                            <>
                              <Check className="w-3 h-3 text-green-500" />
                            </>
                          ) : (
                            <Copy className="w-3 h-3 text-gray-400 hover:text-blue-500" />
                          )}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional bottom information */}
      <div className="p-4 border-t border-blue-950 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
          <p>© {new Date().getFullYear()} HRP DAO</p>
          <p className="mt-1">
            {t("all_rights_reserved") || "All rights reserved"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RightSidebar;
