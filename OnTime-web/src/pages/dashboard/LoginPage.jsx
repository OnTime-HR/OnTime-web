// src/pages/dashboard/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAdmin } from '../../services/authService'; // FIXED: Changed import from loginAdminPrimary
import { ShieldAlert, Lock } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanEmail = email.trim();
    const cleanPassword = password;

    try {
      // FIXED: Invoking the updated, streamlined authentication service
      await loginAdmin(cleanEmail, cleanPassword);
      
      // Clear temporary storage elements cleanly if any existed
      sessionStorage.clear();

      // Navigate directly into your secure workspace dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error("Caught raw login error object:", err);
      
      // Parse Firebase auth codes to provide user-friendly interface messages
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Invalid administrative credentials. Please verify your email and password.");
      } else if (err.code === 'auth/invalid-email') {
        setError("The email address format is invalid.");
      } else {
        setError(err.message || "Authentication validation failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto w-full max-w-md">
        <div className="flex justify-center">
          <div className="bg-orange-100 p-3 rounded-2xl">
            <Lock className="text-[#F9A825]" size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-2xl font-black text-gray-900 tracking-tight">
          OnTime Admin Portal
        </h2>
        <p className="mt-2 text-center text-xs text-gray-500 font-medium">
          Authorized Closed Corporate Administration Terminal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-4 flex gap-3 text-xs text-red-600 font-medium items-start">
              <ShieldAlert className="shrink-0 mt-0.5" size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Admin Email Address
              </label>
              <input
                type="email"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#F9A825] transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                Portal Security Password
              </label>
              <input
                type="password"
                required
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm outline-none focus:border-[#F9A825] transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#F9A825] text-white font-bold text-sm py-3 rounded-xl shadow-md hover:bg-orange-500 transition-all disabled:opacity-50"
            >
              {loading ? 'Verifying Credentials...' : 'Authenticate Access'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;