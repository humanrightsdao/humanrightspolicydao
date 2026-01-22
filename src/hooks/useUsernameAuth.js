// hooks/useUsernameAuth.js
import { useState } from "react";
import { supabase } from "../lib/supabase";

export function useUsernameAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sign in with unique username
  const signInWithUsername = async (username, password) => {
    if (!username || !password) {
      return { success: false, error: "Please enter username and password" };
    }

    setLoading(true);
    setError(null);

    try {
      // Get user email by unique username
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("email, unique_name, wallet_address")
        .eq("unique_name", username.trim())
        .single();

      if (userError) {
        if (userError.code === "PGRST116") {
          throw new Error("User with this username not found");
        }
        throw userError;
      }

      if (!userData || !userData.email) {
        throw new Error("User with this username not found");
      }

      // Check if this is a Web3 user
      if (userData.email.includes("@web3.local") || userData.wallet_address) {
        throw new Error(
          "This account does not have a password. Please use Web3 wallet or set password via 'Forgot password?'",
        );
      }

      // Attempt to sign in with email and password
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: userData.email,
          password: password,
        });

      if (signInError) {
        if (signInError.message.includes("Invalid login credentials")) {
          throw new Error("Incorrect password");
        }
        throw signInError;
      }

      return { success: true, data };
    } catch (error) {
      console.error("Sign in error:", error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Register new user with username and password
  const signUpWithUsername = async (username, email, password) => {
    if (!username || !email || !password) {
      return { success: false, error: "Please fill in all fields" };
    }

    setLoading(true);
    setError(null);

    try {
      // Check if username is already taken
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("unique_name")
        .eq("unique_name", username.trim())
        .single();

      if (!checkError && existingUser) {
        throw new Error("User with this username already exists");
      }

      // Check if email is already registered
      const { data: existingEmail } = await supabase
        .from("users")
        .select("email")
        .eq("email", email.trim())
        .single();

      if (existingEmail) {
        throw new Error("User with this email already exists");
      }

      // Register user with password
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email: email.trim(),
          password: password.trim(),
          options: {
            data: {
              username: username.trim(),
              unique_name: username.trim(),
            },
            emailRedirectTo: `${window.location.origin}/onboarding`,
          },
        },
      );

      if (signUpError) throw signUpError;

      // Create record in users table
      if (authData.user) {
        const { error: insertError } = await supabase.from("users").insert({
          id: authData.user.id,
          email: email.trim(),
          unique_name: username.trim(),
          has_completed_onboarding: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error("Error creating user record:", insertError);
          throw new Error("Error creating account");
        }
      }

      return { success: true, data: authData };
    } catch (error) {
      console.error("Registration error:", error.message);
      setError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    if (!email) {
      return { success: false, error: "Please enter email" };
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/forgot-password`,
        },
      );

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Password reset error:", error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    signInWithUsername,
    signUpWithUsername,
    resetPassword,
    loading,
    error,
    setError,
  };
}
