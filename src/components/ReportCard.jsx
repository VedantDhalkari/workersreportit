import React from "react";
import { useReportImages } from "../hooks/useReportImages";

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
