import React, { useEffect, useState } from "react";
import { API } from "../context/AuthContext";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { motion, AnimatePresence } from "framer-motion";

// Role Titles Map
// const roleTitles = {
//   admin: "System Administrator",
//   manager: "Project Manager",
//  agent: ["project-engineer", "fitter", "electrician"],
// };

// 🔄 Real roles mapped to internal dashboard roles
const roleMap = {
  admin: "admin",
  "project-manager": "manager",
  "project-engineer": "agent",
  fitter: "agent",
  electrician: "agent",
};

const handleDownload = () => {
  const link = document.createElement("a");
  link.href = "/app/app-release.apk";
  link.setAttribute("download", "reportit.apk");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Modern Icon Components
const Icons = {
  Users: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  Pending: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Reports: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  Check: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Clock: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Trending: () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  ),
};

// Premium StatCard Component with animations
function StatCard({ title, value, color, icon: Icon, delay = 0 }) {
  const gradients = {
    blue: "from-blue-500 to-blue-600",
    yellow: "from-yellow-500 to-orange-500",
    green: "from-green-500 to-emerald-600",
    purple: "from-purple-500 to-indigo-600",
  };
  
  const bgGradients = {
    blue: "bg-gradient-to-br from-blue-50 to-blue-100",
    yellow: "bg-gradient-to-br from-yellow-50 to-orange-50",
    green: "bg-gradient-to-br from-green-50 to-emerald-50",
    purple: "bg-gradient-to-br from-purple-50 to-indigo-50",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
      className={`${bgGradients[color]} rounded-2xl p-6 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl transition-all duration-300`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <motion.p 
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
            className="text-4xl font-bold text-gray-900 mt-2"
          >
            {value ?? 0}
          </motion.p>
        </div>
        <motion.div 
          whileHover={{ rotate: 360, scale: 1.1 }}
          transition={{ duration: 0.3 }}
          className={`bg-gradient-to-br ${gradients[color]} p-4 rounded-2xl shadow-md`}
        >
          <div className="text-white">
            <Icon />
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// Modern ActivityItem Component
function ActivityItem({ description, timestamp, type }) {
  const typeConfig = {
    report: { 
      icon: "📋", 
      gradient: "from-blue-500 to-cyan-500",
      bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
      border: "border-blue-200"
    },
    approval: { 
      icon: "✅", 
      gradient: "from-green-500 to-emerald-500",
      bg: "bg-gradient-to-r from-green-50 to-emerald-50",
      border: "border-green-200"
    },
    default: { 
      icon: "📌", 
      gradient: "from-gray-500 to-gray-600",
      bg: "bg-gradient-to-r from-gray-50 to-gray-100",
      border: "border-gray-200"
    },
  };

  const config = typeConfig[type] || typeConfig.default;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ x: 5 }}
      className={`${config.bg} p-4 rounded-xl border ${config.border} mb-3 transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className={`bg-gradient-to-br ${config.gradient} w-10 h-10 rounded-lg flex items-center justify-center text-white text-xl shadow-sm`}>
            {config.icon}
          </div>
          <div className="flex-1">
            <p className="text-gray-800 font-medium">{description}</p>
            <p className="text-sm text-gray-500 mt-1 flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {new Date(timestamp).toLocaleString()}
            </p>
          </div>
        </div>
        <span className={`px-3 py-1 text-xs font-semibold rounded-full bg-white shadow-sm text-${config.gradient.split(' ')[1]}`}>
          {type}
        </span>
      </div>
    </motion.div>
  );
}

// Modern Loading Skeleton
function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState({
    stats: {},
    activity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const dashboardRole = roleMap[user.role];
      try {
        const endpoints = {
          admin: "/admin/dashboard-stats",
          manager: "/manager/dashboard-stats",
          agent: "/agent/dashboard-stats",
        };

        if (!dashboardRole) {
          console.error("Unrecognized role:", user.role);
          return;
        }
        const endpoint = endpoints[dashboardRole];
        const { data } = await API.get(endpoint);

        if (user.role === "project-engineer" || user.role === "fitter" || user.role === "electrician") {
          setDashboardData({
            stats: {
              totalReports: data.totalReports,
              minutes: data.minutes,
            },
            activity: [],
          });
        } else {
          setDashboardData({
            stats: data.stats || {},
            activity: data.activity || [],
          });
        }
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchData();
  }, [user]);

  const roleBasedStats = {
    admin: [
      { title: "Total Users", value: dashboardData.stats.totalUsers, color: "blue", icon: Icons.Users },
      { title: "Pending Approvals", value: dashboardData.stats.pendingApprovals, color: "yellow", icon: Icons.Pending },
      { title: "Active Reports", value: dashboardData.stats.activeReports, color: "purple", icon: Icons.Reports },
    ],
    manager: [
      { title: "Team Reports", value: dashboardData.stats.teamReports, color: "blue", icon: Icons.Reports },
      { title: "Completed Projects", value: dashboardData.stats.completedProjects, color: "green", icon: Icons.Check },
      { title: "Ongoing Projects", value: dashboardData.stats.ongoingProjects, color: "purple", icon: Icons.Trending },
    ],
    agent: [
      { title: "Total Reports", value: dashboardData.stats.totalReports, color: "blue", icon: Icons.Reports },
      { title: "Minutes Since Login", value: dashboardData.stats.minutes, color: "green", icon: Icons.Clock },
    ],
  };

  const currentRole = roleMap[user?.role] || "Unknown Role";
  const roleDisplayNames = {
    admin: "System Administrator",
    manager: "Project Manager",
    agent: "Field Agent"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <Navbar />

      <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section with Gradient Background */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl mb-8 overflow-hidden"
          >
            <div className="relative px-8 py-12">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-10 rounded-full -ml-24 -mb-24"></div>
              
              <div className="relative z-10">
                <h1 className="text-4xl font-bold text-white mb-2">
                  Welcome back,{" "}
                  <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                    {user?.name}
                  </span>
                  <span className="text-3xl">!</span>
                </h1>
                <p className="text-blue-100 text-lg flex items-center mt-2">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {roleDisplayNames[currentRole] || currentRole}
                </p>
              </div>
            </div>
          </motion.div>

          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <LoadingSkeleton />
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {roleBasedStats[currentRole]?.map((stat, idx) => (
                    <StatCard key={idx} {...stat} delay={idx * 0.1} />
                  ))}
                </div>

                {/* Activity Section for Admin/Manager */}
                {dashboardData.activity.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                      <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Recent Activity
                      </h2>
                    </div>
                    <div className="p-6 max-h-96 overflow-y-auto custom-scrollbar">
                      {dashboardData.activity.map((activity, index) => (
                        <ActivityItem key={index} {...activity} />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Download App Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-8 text-center"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleDownload}
                    className="group relative bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="relative flex items-center">
                      <svg className="w-6 h-6 mr-2 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Precimac App (APK)
                    </span>
                  </motion.button>
                  <p className="text-sm text-gray-500 mt-3">Version 1.0.0 • Latest Release</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>
    </div>
  );
}