// main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { I18nextProvider } from "react-i18next";
import i18n from "./i18n";
import App from "./App";
import Onboarding from "./pages/Onboarding";
import CountryPage from "./pages/CountryPage";
import SettingsPage from "./pages/SettingsPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import SupportPage from "./pages/SupportPage";
import ComplaintsPage from "./pages/ComplaintsPage";
import GovernancePage from "./pages/GovernancePage";
import NotificationsPage from "./pages/NotificationsPage";
import PostPage from "./pages/PostPage";
import ThemeProvider from "./components/ThemeProvider";
import ComplaintsListPage from "./pages/ComplaintsListPage";
import ModerationPage from "./pages/ModerationPage";
import ComplaintDetailsPage from "./pages/ComplaintDetailsPage";
import ViolationsMap from "./pages/ViolationsMap";
import HelpRequestPage from "./pages/HelpRequestPage";
import UserProfilePage from "./pages/UserProfilePage";
import SearchPage from "./pages/SearchPage";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPage from "./pages/PrivacyPage";
import "./index.css";

// Adding Web3 to the global window object
if (window.ethereum) {
  window.web3 = window.ethereum;
} else if (window.web3) {
  window.web3 = new Web3(window.web3.currentProvider);
} else {
  console.warn(
    "Web3 not detected. Please install MetaMask or another Web3 wallet.",
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/country" element={<CountryPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route path="/help/:id" element={<HelpRequestPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />
            <Route path="/governance" element={<GovernancePage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/post/:postId" element={<PostPage />} />
            <Route path="/complaints-list" element={<ComplaintsListPage />} />
            <Route path="/moderation" element={<ModerationPage />} />
            <Route path="/complaints/:id" element={<ComplaintDetailsPage />} />
            <Route path="/violations-map" element={<ViolationsMap />} />
            <Route path="/user/:userId" element={<UserProfilePage />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-page" element={<PrivacyPage />} />
            <Route path="/search" element={<SearchPage />} />{" "}
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </I18nextProvider>
  </React.StrictMode>,
);
