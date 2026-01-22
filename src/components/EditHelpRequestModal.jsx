// src/components/EditHelpRequestModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  Plus,
  Check,
  Heart,
  Brain,
  HandHeart,
  Pill,
  Home,
  BookOpen,
  Briefcase,
  Scale,
  Utensils,
  Shirt,
  FileText,
  Image as ImageIcon,
  Video,
  File,
  AlertCircle,
  Trash2,
  Upload,
} from "lucide-react";
import { supabase } from "../lib/supabase";

const EditHelpRequestModal = ({ request, userProfile, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const modalRef = useRef(null);
  const fileInputRef = useRef(null);

  // Help types with localization
  const helpTypes = [
    {
      id: "financial",
      icon: Heart,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      id: "psychological",
      icon: Brain,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/20",
    },
    {
      id: "physical",
      icon: HandHeart,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      id: "medical",
      icon: Pill,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/20",
    },
    {
      id: "educational",
      icon: BookOpen,
      color: "text-indigo-600 dark:text-indigo-400",
      bgColor: "bg-indigo-100 dark:bg-indigo-900/20",
    },
    {
      id: "housing",
      icon: Home,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/20",
    },
    {
      id: "food",
      icon: Utensils,
      color: "text-orange-600 dark:text-orange-400",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      id: "clothing",
      icon: Shirt,
      color: "text-pink-600 dark:text-pink-400",
      bgColor: "bg-pink-100 dark:bg-pink-900/20",
    },
    {
      id: "legal",
      icon: Scale,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800/50",
    },
    {
      id: "employment",
      icon: Briefcase,
      color: "text-cyan-600 dark:text-cyan-400",
      bgColor: "bg-cyan-100 dark:bg-cyan-900/20",
    },
  ];

  // Initial form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    helpTypes: [],
    bankDetails: {
      bankName: "",
      accountNumber: "",
      iban: "",
      swift: "",
    },
    cryptoWallets: [],
    paypalEmail: "",
  });

  const [attachments, setAttachments] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [onClose]);

  // Initialize form when opening
  useEffect(() => {
    if (request) {
      setFormData({
        title: request.title || "",
        description: request.description || "",
        helpTypes: request.help_types || [],
        bankDetails: request.bank_details || {
          bankName: "",
          accountNumber: "",
          iban: "",
          swift: "",
        },
        cryptoWallets: request.crypto_wallets || [],
        paypalEmail: request.paypal_email || "",
      });

      // Already uploaded attachments
      const existingAttachments = (request.attachments || []).map((url) => ({
        url,
        name: url.split("/").pop(),
        type: "existing",
        uploaded: true,
      }));
      setAttachments(existingAttachments);
    }
  }, [request]);

  // Handle form changes
  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBankDetailsChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        [field]: value,
      },
    }));
  };

  const handleHelpTypeToggle = (typeId) => {
    setFormData((prev) => {
      const isSelected = prev.helpTypes.includes(typeId);
      const newTypes = isSelected
        ? prev.helpTypes.filter((t) => t !== typeId)
        : [...prev.helpTypes, typeId];
      return { ...prev, helpTypes: newTypes };
    });
  };

  const handleCryptoWalletChange = (index, value) => {
    const newWallets = [...formData.cryptoWallets];
    newWallets[index] = value;
    setFormData((prev) => ({ ...prev, cryptoWallets: newWallets }));
  };

  const addCryptoWallet = () => {
    setFormData((prev) => ({
      ...prev,
      cryptoWallets: [...prev.cryptoWallets, ""],
    }));
  };

  const removeCryptoWallet = (index) => {
    const newWallets = formData.cryptoWallets.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, cryptoWallets: newWallets }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    // Check file size (max 20MB)
    const oversizedFiles = files.filter((file) => file.size > 20 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      alert(t("file_too_large") || "File should not exceed 20MB");
      return;
    }

    // Add files
    const newAttachments = files.map((file) => ({
      file,
      name: file.name,
      type: file.type,
      size: file.size,
      preview: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      uploaded: false,
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);
    e.target.value = ""; // Clear input
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (fileType) => {
    if (fileType.startsWith("image/")) return <ImageIcon className="w-4 h-4" />;
    if (fileType.startsWith("video/")) return <Video className="w-4 h-4" />;
    if (fileType.includes("pdf")) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // Update request
  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      alert(t("title_required") || "Please enter a title");
      return;
    }
    if (!formData.description.trim()) {
      alert(t("description_required") || "Please enter a description");
      return;
    }
    if (formData.helpTypes.length === 0) {
      alert(t("help_type_required") || "Please select at least one help type");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const uploadedAttachments = [];

      // Upload new files
      const newFiles = attachments.filter((a) => !a.uploaded);
      if (newFiles.length > 0) {
        setUploadingFiles(true);

        for (const fileObj of newFiles) {
          const file = fileObj.file;
          const fileExt = file.name.split(".").pop();
          const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
          const filePath = `${userProfile.id}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from("help-requests")
            .upload(filePath, file, {
              cacheControl: "3600",
              upsert: false,
            });

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl },
          } = supabase.storage.from("help-requests").getPublicUrl(filePath);

          uploadedAttachments.push(publicUrl);
        }
        setUploadingFiles(false);
      }

      // Get URLs of existing files
      const existingAttachments = attachments
        .filter((a) => a.uploaded && a.url)
        .map((a) => a.url);

      const allAttachments = [...existingAttachments, ...uploadedAttachments];

      // Prepare data for update
      const updateData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        help_types: formData.helpTypes,
        updated_at: new Date().toISOString(),
      };

      // Add payment details
      const hasBankDetails = Object.values(formData.bankDetails).some(
        (value) => value.trim() !== "",
      );
      if (hasBankDetails) {
        updateData.bank_details = formData.bankDetails;
      } else {
        updateData.bank_details = null;
      }

      if (
        formData.cryptoWallets.length > 0 &&
        formData.cryptoWallets.some((w) => w.trim() !== "")
      ) {
        updateData.crypto_wallets = formData.cryptoWallets.filter(
          (w) => w.trim() !== "",
        );
      } else {
        updateData.crypto_wallets = null;
      }

      if (formData.paypalEmail.trim()) {
        updateData.paypal_email = formData.paypalEmail.trim();
      } else {
        updateData.paypal_email = null;
      }

      if (allAttachments.length > 0) {
        updateData.attachments = allAttachments;
      } else {
        updateData.attachments = null;
      }

      // Update request
      const { data, error: updateError } = await supabase
        .from("help_requests")
        .update(updateData)
        .eq("id", request.id)
        .select()
        .single();

      if (updateError) throw updateError;

      onSuccess(data);
    } catch (error) {
      console.error("Error updating request:", error);
      setError(error.message);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Clean up preview URLs
  React.useEffect(() => {
    return () => {
      attachments.forEach((attachment) => {
        if (attachment.preview) {
          URL.revokeObjectURL(attachment.preview);
        }
      });
    };
  }, [attachments]);

  if (!request) return null;

  return (
    <div className="h-full flex flex-col">
      <div
        ref={modalRef}
        className="flex-1 bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              aria-label={t("close") || "Close"}
              disabled={loading}
            >
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("edit_help_request") || "Edit Help Request"}
            </h2>
          </div>
        </div>

        {/* Content - main area with scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-1.5 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">
                  {t("error") || "Error"}
                </span>
              </div>
              <p className="mt-1 text-xs text-red-600 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("title") || "Title"} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                placeholder={t("enter_title") || "Enter request title"}
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("description") || "Description"} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                rows={4}
                className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white resize-none outline-none transition-colors"
                placeholder={
                  t("enter_description") || "Describe your need in detail"
                }
                disabled={loading}
              />
            </div>

            {/* Help Types */}
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("help_types") || "Needed Help Types"} *
              </label>
              <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5">
                {helpTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = formData.helpTypes.includes(type.id);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => handleHelpTypeToggle(type.id)}
                      disabled={loading}
                      className={`p-1.5 rounded-lg border transition-all flex flex-col items-center gap-0.5 relative ${
                        isSelected
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                      } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
                      title={t(`help_type_${type.id}`) || type.id}
                    >
                      <Icon className={`w-3.5 h-3.5 ${type.color}`} />
                      <span className="text-[10px] text-gray-700 dark:text-gray-300 truncate w-full text-center">
                        {t(`help_type_${type.id}`) || type.id}
                      </span>
                      {isSelected && (
                        <Check className="w-2.5 h-2.5 text-blue-500 absolute top-0.5 right-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-3 pt-3 border-t dark:border-gray-700">
              <details className="group">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {t("payment_details") || "Payment Details"}
                  </h3>
                  <span className="text-gray-500 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </summary>
                <div className="mt-2 space-y-3">
                  {/* Bank Details */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      {t("bank_details") || "Bank Details"}
                    </h4>
                    <input
                      type="text"
                      value={formData.bankDetails.bankName}
                      onChange={(e) =>
                        handleBankDetailsChange("bankName", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder={t("bank_name") || "Bank Name"}
                      disabled={loading}
                    />
                    <input
                      type="text"
                      value={formData.bankDetails.accountNumber}
                      onChange={(e) =>
                        handleBankDetailsChange("accountNumber", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder={t("account_number") || "Account Number"}
                      disabled={loading}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={formData.bankDetails.iban}
                        onChange={(e) =>
                          handleBankDetailsChange("iban", e.target.value)
                        }
                        className="px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                        placeholder="IBAN"
                        disabled={loading}
                      />
                      <input
                        type="text"
                        value={formData.bankDetails.swift}
                        onChange={(e) =>
                          handleBankDetailsChange("swift", e.target.value)
                        }
                        className="px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                        placeholder="SWIFT/BIC"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Crypto Wallets */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      {t("crypto_wallets") || "Crypto Wallets"}
                    </h4>
                    <div className="space-y-1.5">
                      {formData.cryptoWallets.map((wallet, index) => (
                        <div key={index} className="flex gap-1.5">
                          <input
                            type="text"
                            value={wallet}
                            onChange={(e) =>
                              handleCryptoWalletChange(index, e.target.value)
                            }
                            className="flex-1 px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                            placeholder="0x..."
                            disabled={loading}
                          />
                          <button
                            type="button"
                            onClick={() => removeCryptoWallet(index)}
                            disabled={loading}
                            className="px-3 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 disabled:opacity-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={addCryptoWallet}
                        disabled={loading}
                        className="w-full px-3 py-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        {t("add_crypto_wallet") || "Add Crypto Wallet"}
                      </button>
                    </div>
                  </div>

                  {/* PayPal */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                      PayPal
                    </h4>
                    <input
                      type="email"
                      value={formData.paypalEmail}
                      onChange={(e) =>
                        handleInputChange("paypalEmail", e.target.value)
                      }
                      className="w-full px-3 py-2 text-sm bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-600 dark:focus:border-blue-600 text-gray-900 dark:text-white outline-none transition-colors"
                      placeholder="email@example.com"
                      disabled={loading}
                    />
                  </div>
                </div>
              </details>
            </div>

            {/* Attachments */}
            <div className="pt-3 border-t dark:border-gray-700">
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("attachments") || "Attachments"}
              </label>
              <div className="space-y-2">
                {attachments.length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {attachments.map((file, index) => (
                      <div key={index} className="relative group">
                        {file.preview ||
                        (file.url && file.type === "existing") ? (
                          <div className="w-full h-24 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <img
                              src={file.preview || file.url}
                              alt={file.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-full h-24 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center p-2">
                            {getFileIcon(file.type)}
                            <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center mt-1">
                              {file.name}
                            </span>
                          </div>
                        )}
                        <button
                          onClick={() => removeAttachment(index)}
                          disabled={loading}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-1 opacity-90 hover:opacity-100 transition-opacity disabled:opacity-30 shadow-sm"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingFiles}
                  className="w-full px-3 py-2.5 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 text-gray-600 dark:text-gray-400 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5 text-sm"
                >
                  <Upload className="w-4 h-4" />
                  <span>
                    {uploadingFiles
                      ? t("uploading") || "Uploading..."
                      : t("upload_files") || "Upload files (max 20MB)"}
                  </span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  disabled={loading || uploadingFiles}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium disabled:opacity-50"
            >
              {t("cancel") || "Cancel"}
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || uploadingFiles}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 dark:hover:from-blue-600 dark:hover:to-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 min-w-[100px] justify-center text-sm"
            >
              {loading || uploadingFiles ? (
                <>
                  <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
                  {t("updating") || "Updating..."}
                </>
              ) : (
                t("update_request") || "Update Request"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHelpRequestModal;
