// hooks/useEmailAuth.js
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useEmailAuth() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Send magic link to email
  const sendMagicLink = async (email) => {
    if (!email || !email.trim()) {
      return { success: false, error: "Please enter your email" };
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/onboarding`,
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setEmailSent(true);
      return { success: true };
    } catch (error) {
      console.error("Error sending link:", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset state
  const reset = () => {
    setEmailSent(false);
    setLoading(false);
  };

  return {
    sendMagicLink,
    reset,
    loading,
    emailSent,
    setEmailSent,
  };
}
