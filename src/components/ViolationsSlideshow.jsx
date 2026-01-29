// src/components/ViolationsSlideshow.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Image as ImageIcon, AlertCircle, Loader } from "lucide-react";

const ViolationsSlideshow = () => {
  const [images, setImages] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Load images from complaints
  const loadImages = async () => {
    try {
      setLoading(true);

      // Get latest 20 published complaints with files
      const { data: complaints, error } = await supabase
        .from("complaints")
        .select("evidence_files, id, title, address, country_code, created_at")
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;

      // Extract all images from files
      const allImages = [];

      complaints.forEach((complaint) => {
        if (
          complaint.evidence_files &&
          Array.isArray(complaint.evidence_files)
        ) {
          complaint.evidence_files.forEach((file) => {
            // Filter only images
            if (file.type && file.type.startsWith("image/")) {
              allImages.push({
                url: file.url,
                complaintId: complaint.id,
                title: complaint.title,
                address: complaint.address,
                countryCode: complaint.country_code,
                date: complaint.created_at,
                fileName: file.name,
              });
            }
          });
        }
      });

      // Shuffle images for variety
      const shuffled = [...allImages].sort(() => Math.random() - 0.5);
      setImages(shuffled);

      if (shuffled.length > 0) {
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error("Error loading violation images:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize and update every 5 minutes
  useEffect(() => {
    loadImages();

    // Update images every 5 minutes
    const refreshInterval = setInterval(loadImages, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, []);

  // Timer for automatic image change every 15 seconds
  useEffect(() => {
    if (images.length <= 1 || loading) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 15 * 1000); // 15 seconds

    return () => clearInterval(timer);
  }, [images.length, loading]);

  // Manual image change
  const nextImage = (e) => {
    e.stopPropagation(); // Prevent navigation to complaint page
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation(); // Prevent navigation to complaint page
    if (images.length <= 1) return;
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );
  };

  // Navigate to complaint details page
  const handleSlideClick = () => {
    if (images.length === 0) return;
    const currentImage = images[currentIndex];
    navigate(`/complaints/${currentImage.complaintId}`);
  };

  // Click on indicator
  const handleIndicatorClick = (index, e) => {
    e.stopPropagation(); // Prevent navigation to complaint page
    setCurrentIndex(index);
  };

  // Format date (залишаємо функцію на випадок, якщо вона потрібна десь інде)
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading && images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg">
        <Loader className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading violation images...
        </p>
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-3">
          <ImageIcon className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          No violation images yet
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Users haven't uploaded images for complaints yet
        </p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="relative">
      {/* Clickable image container */}
      <div
        className="relative overflow-hidden rounded-lg border border-gray-300 dark:border-gray-600 bg-black cursor-pointer transition-transform duration-200 hover:scale-[1.005] active:scale-[0.995]"
        onClick={handleSlideClick}
        title="Click to view violation details"
      >
        {/* Square-shaped image */}
        <div className="aspect-square relative">
          <img
            src={currentImage.url}
            alt={`Violation: ${currentImage.title}`}
            className="w-full h-full object-cover transition-opacity duration-500"
            onError={(e) => {
              e.target.src =
                'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"><rect width="400" height="400" fill="%231f2937"/><text x="200" y="200" font-family="Arial" font-size="14" fill="%239ca3af" text-anchor="middle" dy=".3em">Image not available</text></svg>';
            }}
          />

          {/* Navigation buttons */}
          {images.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                aria-label="Previous image"
              >
                ←
              </button>
              <button
                onClick={nextImage}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/60 hover:bg-black/80 text-white rounded-full flex items-center justify-center transition-colors opacity-0 hover:opacity-100 group-hover:opacity-100"
                aria-label="Next image"
              >
                →
              </button>
            </>
          )}

          {/* Image information */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4">
            <div className="text-white">
              <h4 className="text-sm font-semibold truncate mb-1">
                {currentImage.title}
              </h4>

              {currentImage.address && (
                <p className="text-xs text-gray-300 truncate mb-1">
                  {currentImage.address}
                </p>
              )}

              {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentImage.date && (
                    <span className="text-xs text-gray-400">
                      {formatDate(currentImage.date)}
                    </span>
                  )}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViolationsSlideshow;
