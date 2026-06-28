// src/pages/ReportDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReportActivity from '../components/ReportActivity';
import { API } from '../context/AuthContext';

export default function ReportDetail() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await API.get(`/reports/${reportId}`); // your existing endpoint
        setReport(data.report);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [reportId]);

  if (loading) return <div>Loading…</div>;
  if (!report) return <div>Report not found</div>;

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* --- GitHub-style header card for the report itself --- */}
      <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
        <h2 className="text-xl font-bold">{report.projectNumber}</h2>
        <p className="text-gray-600">{report.customer}</p>
        <p className="mt-2">{Array.isArray(report.workDone) ? report.workDone.join(', ') : report.workDone}</p>
        <p className="text-sm text-gray-500 mt-1">{new Date(report.createdAt).toLocaleString()}</p>
      </div>

      {/* --- Live comment thread below, styled like X/Twitter threads --- */}
      <ReportActivity reportId={reportId} />
    </div>
  );
}
