// src/components/ReportComments.jsx
import React, { useEffect, useState } from "react";
import { API } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";

// Role badge component
const RoleBadge = ({ role }) => {
  const getRoleStyle = () => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 border-red-200";
      case "manager":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "field-agent":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleStyle()}`}
    >
      {role}
    </span>
  );
};

export default function ReportComments({ reportId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [draft, setDraft] = useState("");

  // Load comments
  useEffect(() => {
    (async () => {
      try {
        const { data } = await API.get(`/report-activity/${reportId}`);
        setComments(data.comments || []);
      } catch (err) {
        console.error("Load comments failed:", err);
      }
    })();
  }, [reportId]);

  // Post new comment
  const post = async () => {
    if (!draft.trim()) return;
    try {
      await API.post(`/report-activity/${reportId}/comment`, { message: draft });
      setDraft("");
      // Reload comments
      const { data } = await API.get(`/report-activity/${reportId}`);
      setComments(data.comments || []);
    } catch (err) {
      console.error("Post comment failed:", err);
    }
  };

  return (
    <div className="flex space-x-4">
      {/* Vertical timeline */}
      <div className="flex-none w-10 relative">
        <div className="absolute top-0 left-5 w-0.5 bg-gray-200 h-full" />
      </div>
      
      <div className="flex-1 space-y-6 pb-4">
        {comments.map((comment, index) => (
          <div key={index} className="group flex space-x-3">
            {/* User avatar */}
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                {comment.user?.name?.charAt(0) || "U"}
              </div>
            </div>

            {/* Comment body */}
            <div className="flex-1 min-w-0">
              <div className="bg-white p-4 rounded-lg border border-gray-200 hover:border-gray-300 shadow-sm">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    {comment.user?.name || "Unknown User"}
                  </span>
                  <RoleBadge role={comment.user?.role} />
                  <span className="text-gray-500 text-xs">
                    {new Date(comment.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {comment.message}
                </p>
              </div>
            </div>
          </div>
        ))}

        {/* New comment input */}
        <div className="pt-4 border-t border-gray-200">
          <div className="flex space-x-3">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-700">
                {user?.name?.charAt(0) || "Y"}
              </div>
            </div>
            <div className="flex-1">
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-500 text-sm"
                rows={3}
                placeholder="Add a comment..."
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={post}
                  disabled={!draft.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
                >
                  Comment
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}