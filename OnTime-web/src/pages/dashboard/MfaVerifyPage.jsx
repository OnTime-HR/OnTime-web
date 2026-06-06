// src/pages/dashboard/MfaVerifyPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyMfaToken } from '../../services/authService';
import { ShieldCheck, ShieldAlert } from 'lucide-react';

const MfaVerifyPage = () => {
    const [token, setToken] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [phoneMask, setPhoneMask] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const cachedMask = sessionStorage.getItem("mfaPhoneMask");
        const cachedUid = sessionStorage.getItem("mfaUserId");
        if (!cachedUid) {
            navigate('/login'); // Kick back if directly accessed without credentials entry
        } else {
            setPhoneMask(cachedMask || "Registered Device");
        }
    }, [navigate]);

    const handleMfaSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const userId = sessionStorage.getItem("mfaUserId");

        // Inside src/pages/dashboard/MfaVerifyPage.jsx -> handleMfaSubmit function
        try {
            await verifyMfaToken(userId, token);
            sessionStorage.setItem("isMfaVerified", "true");

            // Update this path line to point to your new dashboard layout container route link
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || "Invalid verification response token parameter.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto w-full max-w-md">
                <div className="flex justify-center">
                    <div className="bg-green-100 p-3 rounded-2xl">
                        <ShieldCheck className="text-green-600" size={32} />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-2xl font-black text-gray-900 tracking-tight">
                    Secondary MFA Verification
                </h2>
                <p className="mt-2 text-center text-xs text-gray-500 font-medium px-4">
                    A secure authorization code has been dispatched to your primary phone link ending in <span className="font-bold text-gray-800">{phoneMask}</span>.
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

                    <form onSubmit={handleMfaSubmit} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
                                Enter 6-Digit Security Token
                            </label>
                            <input
                                type="text"
                                maxLength={6}
                                required
                                placeholder="000000"
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-center text-xl font-mono font-black tracking-widest outline-none focus:border-green-500 transition-all"
                                value={token}
                                onChange={(e) => setToken(e.target.value.replace(/\D/g, ""))}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-green-600 text-white font-bold text-sm py-3 rounded-xl shadow-md hover:bg-green-700 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Validating Token...' : 'Verify & Grant Access'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default MfaVerifyPage;