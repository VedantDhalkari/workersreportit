// UserLogs.jsx - New component for individual user logs
import React, { useEffect, useState } from 'react';
import { API } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

export default function UserLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userInfo, setUserInfo] = useState(null);
  const { userId } = useParams();
  const navigate = useNavigate();
//   const { userId } = useParams();


  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        const [userRes, logsRes] = await Promise.all([
          API.get(`/admin/users/${userId}`, { signal: controller.signal }),
          API.get(`/admin/users/${userId}/logs`, { signal: controller.signal })
        ]);

        setUserInfo(userRes.data.user);
        setLogs(Array.isArray(logsRes.data.logs) ? logsRes.data.logs : []);
      } catch (err) {
        if (!axios.isCancel(err)) {
          console.error('Error fetching data:', err);
          alert('Failed to load user logs');
        }
      } finally {
        setLoading(false);
      }
    }

    fetchData();
    return () => controller.abort();
  }, [userId]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 mt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center text-gray-600 hover:text-blue-600"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-800 text-center">
              Activity Logs for <span className='text-red-800'>{userInfo?.name || 'User'}</span> 
            </h1>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              <p className="mt-4 text-gray-600">Loading user logs...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">Timestamp</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">Action</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">IP Address</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">Device</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-blue-800">Details</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.ip || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span>{log.userAgent?.browser || 'Unknown'}</span>
                          <span className="text-xs text-gray-500">{log.userAgent || 'Unknown OS'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs break-words">
                        {log.details || 'No additional details'}
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