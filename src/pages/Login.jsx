import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import logo from "../assets/img/logo.png"; // Adjust the path as necessary

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   setError(null);
  //   login(email, password);

  //   setError(err.response?.data?.message || 'Invalid credentials');
  // };

  const handleSubmit = async e => {
    e.preventDefault();
    setError(null); // Reset error on new submission
    
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid credentials or Not approved yet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex flex-col items-center justify-center p-4">
      {/* Main Card Container */}
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8 transform transition-transform duration-300 hover:scale-[1.01]">
        {/* Logo Header */}
        <div className="mb-10 text-center">
          <div className="inline-flex items-center justify-center space-x-3">
        
              <img src={logo} alt="Logo" />
       
          </div>
          <p className="mt-4 text-gray-600">
            Field Reporting Management System
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setError(null); // Clear error on change
                  setEmail(e.target.value);
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative rounded-md shadow-sm">
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-center p-2 mb-4 rounded-lg bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Sign in to your account
          </button>
        </form>

        {/* Footer Links */}
        <div className="mt-8 text-center space-y-4">
          <a
            href="#forgot-password"
            className="text-sm text-red-600 hover:text-red-700 font-medium inline-block"
          >
            Forgot your password?
          </a>
          <p className="text-sm text-gray-600">
            Not registered?{" "}
            <Link
              to="/signup"
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
