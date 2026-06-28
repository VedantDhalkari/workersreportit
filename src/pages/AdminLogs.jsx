import React, { useEffect, useState, useMemo } from "react";
import { API } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import axios from "axios";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLogs() {
      try {
        const { data } = await API.get("/admin/logs", {
          signal: controller.signal,
        });
        setLogs(Array.isArray(data.logs) ? data.logs : []);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error("Error fetching logs:", err);
          alert("Failed to load activity logs");
        }
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === "admin") fetchLogs();
    return () => controller.abort();
  }, [user]);

  // Build a unique-user summary: latest log per user
  const summary = useMemo(() => {
    const map = {};
    logs.forEach((log) => {
      const u = log.user || { name: "System", _id: "system" };
      const key = u._id;
      // if we haven’t seen this user yet, or this log is newer, keep it
      if (!map[key] || new Date(log.createdAt) > new Date(map[key].createdAt)) {
        map[key] = {
          id: key,
          name: u.name,
          ip: log.ip || "N/A",
          lastActivity: log.createdAt,
          isOnline: log.action === "login",
        };
      }
    });
    return Object.values(map);
  }, [logs]);

  if (loading) {
    return (
      <div className="text-center py-12 mt-5">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Loading user statuses…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 mt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold mb-6">User Status Overview</h1>

          {summary.length === 0 ? (
            <p className="text-gray-600">No activity records found.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">
                      IP Address
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {summary.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {u.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {u.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.ip}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(u.lastActivity).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        {u.isOnline ? (
                          <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
                        ) : (
                          <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-blue-600 hover:underline">
                        <Link to={`/users/${u.id}/logs`}>View Full Logs →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
