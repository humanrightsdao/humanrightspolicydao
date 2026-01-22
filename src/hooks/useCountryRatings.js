// src/hooks/useCountryRatings.js
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

export default function useCountryRatings() {
  const [ratingsData, setRatingsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Function to get average ratings for a country
  const getAverageRatings = async (countryCode) => {
    if (!countryCode || countryCode === "EARTH") {
      return null;
    }

    setLoading(true);
    setError("");

    try {
      const { data, error: fetchError } = await supabase
        .from("country_ratings")
        .select(
          `
          country_code,
          human_rights_rating,
          economic_freedom_rating,
          political_freedom_rating,
          freedom_of_speech_rating
        `,
        )
        .eq("country_code", countryCode);

      if (fetchError) {
        throw fetchError;
      }

      if (!data || data.length === 0) {
        setRatingsData({
          countryCode,
          averageRatings: null,
          totalRatings: 0,
          message: "No ratings for this country",
        });
        return null;
      }

      // Calculate average values
      const totals = {
        human_rights: 0,
        economic_freedom: 0,
        political_freedom: 0,
        freedom_of_speech: 0,
      };

      data.forEach((rating) => {
        if (rating.human_rights_rating)
          totals.human_rights += rating.human_rights_rating;
        if (rating.economic_freedom_rating)
          totals.economic_freedom += rating.economic_freedom_rating;
        if (rating.political_freedom_rating)
          totals.political_freedom += rating.political_freedom_rating;
        if (rating.freedom_of_speech_rating)
          totals.freedom_of_speech += rating.freedom_of_speech_rating;
      });

      const count = data.length;
      const averageRatings = {
        human_rights: Math.round((totals.human_rights / count) * 10) / 10,
        economic_freedom:
          Math.round((totals.economic_freedom / count) * 10) / 10,
        political_freedom:
          Math.round((totals.political_freedom / count) * 10) / 10,
        freedom_of_speech:
          Math.round((totals.freedom_of_speech / count) * 10) / 10,
      };

      const result = {
        countryCode,
        averageRatings,
        totalRatings: count,
        data, // Keep all data for further analysis
      };

      setRatingsData(result);
      return result;
    } catch (err) {
      console.error("Error fetching average ratings:", err);
      setError(err.message || "Error loading ratings");
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Function to reset data
  const resetRatings = () => {
    setRatingsData(null);
    setError("");
  };

  return {
    ratingsData,
    loading,
    error,
    getAverageRatings,
    resetRatings,
  };
}
