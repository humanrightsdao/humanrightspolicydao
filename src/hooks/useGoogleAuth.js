// hooks/useGoogleAuth.js
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export function useGoogleAuth() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/onboarding`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error("Google login error:", error.message);
      throw error; // Return error for handling in component
    }
  };

  return { handleGoogleLogin };
}
