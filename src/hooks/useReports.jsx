import { useState, useEffect } from "react";
import { API } from "../context/AuthContext";

export function useReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await API.get("/reports");
        // always take everything—no role-based filtering here
        setReports(res.data.reports || []);
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  const addReport = (report) => {
    setReports((prev) => [...prev, report]);
  };

  return { reports, loading, addReport };
}
