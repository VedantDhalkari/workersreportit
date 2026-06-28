// src/components/Navbar.jsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/img/logo.png"; // Adjust the path as necessary

export default function Navbar() {
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 inset-x-0 bg-white/80 backdrop-blur-md border-b border-gray-200 z-50 mb-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/"
              className="flex items-center space-x-2"
              aria-label="Go to dashboard"
            >
              <div className="bg-white-600 w-8 h-8 rounded-lg flex items-center justify-left w-25">
                <img
                  className=" h-10 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  aria-hidden="true"
                  src={logo}
                />
              </div>
    
            </Link>
          </div>

          {/* Desktop Menu */}
          <ul className="hidden md:flex items-center space-x-8" role="menubar">
            {/* ... existing desktop menu items ... */}
            <ul
              className="hidden md:flex items-center space-x-8"
              role="menubar"
            >
             
              {user?.role === "admin" && (
                <>


                 <li role="none">
                <Link
                  to="/dashboard"
                  role="menuitem"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
              </li>

              <li role="none">
                <Link
                  to="/reports"
                  role="menuitem"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  New Report
                </Link>
              </li>

              <li role="none">
                <Link
                  to="/view"
                  role="menuitem"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  View Reports
                </Link>
              </li>
                  <li role="none">
                    <Link
                      to="/admin/users"
                      role="menuitem"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Manage Users
                    </Link>
                  </li>
                  <li role="none">
                    <Link
                      to="/admin/logs"
                      role="menuitem"
                      className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      View Logs
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </ul>

          {/* Desktop User & Logout */}
          <div className="hidden md:flex items-center space-x-4">
            <span className="text-sm text-gray-600" aria-live="polite">
              Welcome, {user?.name}
            </span>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-700 px-3 py-2 rounded-md text-sm font-medium border border-red-100 hover:border-red-200 transition-colors"
              aria-label="Log out"
            >
              Logout
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-md text-gray-600 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Open main menu"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
          >
            {!isMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div
            className="md:hidden absolute top-16 inset-x-0 bg-white/95 backdrop-blur-sm border-b border-gray-200"
            id="mobile-menu"
            role="menu"
          >
            <div className="px-4 py-2 space-y-1">
              <div className="px-3 py-2 text-sm font-medium text-gray-600">
                Welcome, {user?.name}
              </div>
              <Link
                to="/dashboard"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                Dashboard
              </Link>
              {/* {user?.role === "field-agent" && ( */}
                <Link
                  to="/reports"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                  role="menuitem"
                >
                  New Report
                </Link>
              {/* )} */}
              <Link
                to="/view"
                onClick={() => setIsMenuOpen(false)}
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                role="menuitem"
              >
                View Reports
              </Link>
              {user?.role === "admin" && (
                <>
                  <Link
                    to="/admin/users"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    Manage Users
                  </Link>
                  <Link
                    to="/admin/logs"
                    onClick={() => setIsMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
                    role="menuitem"
                  >
                    View Logs
                  </Link>
                </>
              )}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-100"
                role="menuitem"
              >
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
