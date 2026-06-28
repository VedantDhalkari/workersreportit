import React, { useState, useEffect } from "react";
// import PropTypes from "prop-types";
import { API } from "../context/AuthContext";

/**
 * Custom hook to fetch and return report images as data URLs
 * @param {string} reportId - The ID of the report to fetch images for
 * @returns {{ images: string[], loading: boolean, error: Error|null }}
 */
export function useReportImages(reportId) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportId) return;

    setLoading(true);
    setError(null);

    API.get(`/api/reports/${reportId}/images`)
      .then((res) => {
        const urls = res.data.images.map((img) =>
          `data:${img.contentType};base64,${img.data}`
        );
        setImages(urls);
      })
      .catch((err) => {
        console.error(`Failed to load images for report ${reportId}:`, err);
        setError(err);
      })
      .finally(() => setLoading(false));
  }, [reportId]);

  return { images, loading, error };
}

/**
 * ReportCard component: displays a report title and its images
 */
export default function ReportCard({ report }) {
  const { id, title } = report;
  const { images, loading, error } = useReportImages(id);

  return (
    <div className="p-4 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>

      {loading && <p>Loading images… 📷</p>}
      {error && <p className="text-red-600">Error loading images</p>}

      <div className="grid grid-cols-3 gap-2 mt-2">
        {!loading && !images.length && <p>No images available</p>}
        {images.map((src, idx) => (
          <img
            key={idx}
            src={src}
            alt={`Report ${id} image ${idx + 1}`}
            className="w-full h-32 object-cover rounded"
          />
        ))}
      </div>
    </div>
  );
}

// ReportCard.propTypes = {
//   report: PropTypes.shape({
//     id: PropTypes.string.isRequired,
//     title: PropTypes.string.isRequired,
//   }).isRequired,
// };
