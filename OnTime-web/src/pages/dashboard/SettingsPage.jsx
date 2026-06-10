// src/pages/dashboard/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateEmail, updateProfile, updatePassword } from 'firebase/auth';
import { Clock, Shield, Sliders, User, RefreshCw, Save, X, KeyRound, Globe, Landmark } from 'lucide-react';
import { updateAdminProfileData } from '../../services/adminService';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Master backup state to handle 'Discard Changes' reverting seamlessly
  const [originalSettings, setOriginalSettings] = useState(null);

  // FORM STATES
  const [settings, setSettings] = useState({
    // Tab 1: General (Geofencing & System Limits)
    radius: 150,
    companyCode: "ONTIME-HQ-2026",
    annualLeaveQuota: 21,
    claimCurrency: "LKR",

    // Tab 2: Attendance Policies
    workStart: "08:30",
    workEnd: "17:30",
    gracePeriod: 15,
    earlyDepartureAllowance: 10,

    // Tab 3: Advanced Security
    forcePinReset: false,

    // Tab 4: Admin Profile parameters
    adminName: "",
    adminEmail: "",
    adminPassword: ""
  });

  // 1. Fetch live settings profile from Firestore on mount
  useEffect(() => {
    const fetchGlobalConfigurations = async () => {
      try {
        const docRef = doc(db, "system_settings", "global_config");
        const docSnap = await getDoc(docRef);

        let fetchedData = {};
        if (docSnap.exists()) {
          fetchedData = docSnap.data();
        }

        const initialFormState = {
          radius: fetchedData.radius || 150,
          companyCode: fetchedData.companyCode || "ONTIME-HQ-2026",
          annualLeaveQuota: fetchedData.annualLeaveQuota || 21,
          claimCurrency: fetchedData.claimCurrency || "LKR",
          workStart: fetchedData.workStart || "08:30",
          workEnd: fetchedData.workEnd || "17:30",
          gracePeriod: fetchedData.gracePeriod || 15,
          earlyDepartureAllowance: fetchedData.earlyDepartureAllowance || 10,
          forcePinReset: fetchedData.forcePinReset || false,
          adminName: auth.currentUser?.displayName || "System Admin",
          adminEmail: auth.currentUser?.email || "",
          adminPassword: "" // Kept empty for safety
        };

        setSettings(initialFormState);
        setOriginalSettings(JSON.parse(JSON.stringify(initialFormState))); // Deep copy backup
      } catch (err) {
        console.error("Failed to compile configurations:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGlobalConfigurations();
  }, []);

  const handleInputChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // 2. Action: Cycle authorization system key randomly
  const handleRegenerateCompanyCode = () => {
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
    const generatedToken = `ONTIME-${randomString}-2026`;
    handleInputChange('companyCode', generatedToken);
  };

  // 3. Action: Revert changes back to original loaded configuration fields
  const handleDiscardChanges = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      alert("All local adjustments have been discarded successfully.");
    }
  };

  // 4. Action: Save updated states to Firestore & Firebase Auth profile
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Step A: Save system policies to standard standalone document
      const docRef = doc(db, "system_settings", "global_config");
      await setDoc(docRef, {
        // General Tab
        radius: Number(settings.radius) || 150,
        annualLeaveQuota: Number(settings.annualLeaveQuota) || 21,
        claimCurrency: settings.claimCurrency || "LKR",
        companyCode: settings.companyCode || "ONTIME-HQ-2026",

        // Attendance Tab
        workStart: settings.workStart || "08:30",
        workEnd: settings.workEnd || "17:30",
        gracePeriod: Number(settings.gracePeriod) || 0,
        earlyDepartureAllowance: Number(settings.earlyDepartureAllowance) || 0,

        // Security Tab
        forcePinReset: Boolean(settings.forcePinReset),

        updatedAt: new Date().toISOString(),
        updatedBy: auth.currentUser?.uid || "unknown"
      }, { merge: true });

      // Step B: Update Admin Auth profile metrics if edited
      await updateAdminProfileData(
        settings.adminName,
        settings.adminEmail,
        settings.adminPassword
      );

      // Clean out password state string locally so it doesn't stay visible in memory
      setSettings(prev => ({ ...prev, adminPassword: "" }));

      // Re-verify backup snapshot anchor for the Discard Changes engine
      setOriginalSettings(JSON.parse(JSON.stringify({
        ...settings,
        adminPassword: ""
      })));

      alert("Global configurations successfully synchronized across all active nodes!");
    } catch (error) {
      console.error("Configuration persistence failure:", error);
      alert("Update Blocked: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">
        Fetching System Parameter Settings...
      </div>
    );
  }

  return (
    <div className="p-10 max-w-4xl">
      <form onSubmit={handleSaveChanges} className="space-y-8">

        {/* HORIZONTAL TAB CONTROL ACCESS BAR */}
        <div className="flex border-b border-gray-200 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 gap-2">
          {[
            { id: 'General', label: 'General Configuration', icon: <Sliders size={15} /> },
            { id: 'Attendance', label: 'Attendance & Shifting', icon: <Clock size={15} /> },
            { id: 'Security', label: 'System Access Security', icon: <Shield size={15} /> },
            { id: 'Profile', label: 'Admin Profile Hub', icon: <User size={15} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id
                ? 'bg-[#F9A825] text-white shadow-sm'
                : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* ========================================================= */}
        {/* SUB-PANEL TAB 1: GENERAL SYSTEM LIMITS */}
        {/* ========================================================= */}
        {activeTab === 'General' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Globe className="text-[#F9A825]" size={18} /> General Parameters</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure spatial parameters, default team constraints, and workspace values.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Geofencing Tracking Radius (Meters)</label>
                <input
                  type="number"
                  value={settings.radius}
                  onChange={(e) => handleInputChange('radius', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Default Annual Leave Quota (Days)</label>
                <input
                  type="number"
                  value={settings.annualLeaveQuota}
                  onChange={(e) => handleInputChange('annualLeaveQuota', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Medical Claims Active Currency</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-1 focus-within:border-[#F9A825] transition-colors">
                  <Landmark size={14} className="text-gray-400 mr-2" />
                  <select
                    value={settings.claimCurrency}
                    onChange={(e) => handleInputChange('claimCurrency', e.target.value)}
                    className="w-full bg-transparent py-2.5 text-xs font-bold text-gray-700 outline-none cursor-pointer"
                  >
                    <option value="LKR">Sri Lankan Rupee (LKR)</option>
                    <option value="USD">United States Dollar (USD)</option>
                    <option value="EUR">Euro Currency (EUR)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-PANEL TAB 2: ATTENDANCE & SHIFTING POLICIES */}
        {/* ========================================================= */}
        {activeTab === 'Attendance' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Clock className="text-[#F9A825]" size={18} /> Operational Attendance Rules</h3>
              <p className="text-xs text-gray-400 mt-0.5">Control timeline fallbacks, verification margin parameters, and compliance guidelines.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Default Shift Start (Punch In)</label>
                <input
                  type="time"
                  value={settings.workStart}
                  onChange={(e) => handleInputChange('workStart', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Default Shift End (Punch Out)</label>
                <input
                  type="time"
                  value={settings.workEnd}
                  onChange={(e) => handleInputChange('workEnd', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Late Check-In Grace Period (Minutes)</label>
                <input
                  type="number"
                  value={settings.gracePeriod}
                  onChange={(e) => handleInputChange('gracePeriod', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Early Departure Allowance (Minutes)</label>
                <input
                  type="number"
                  value={settings.earlyDepartureAllowance}
                  onChange={(e) => handleInputChange('earlyDepartureAllowance', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-PANEL TAB 3: ADVANCED APP SECURITY */}
        {/* ========================================================= */}
        {activeTab === 'Security' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Shield className="text-[#F9A825]" size={18} /> Access Security Rules</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage enrollment security constraints and cycle mobile application registration code values.</p>
            </div>

            <div className="space-y-6 divide-y divide-gray-100">
              {/* Registration Token Box Row */}
              <div className="flex items-center justify-between pt-2">
                <div className="max-w-md">
                  <h5 className="text-xs font-bold text-gray-700">App Roster Security Authorization Token</h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">Required field mapping token used by mobile nodes during endpoint provisioning profiles setup.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 font-mono text-xs font-black px-4 py-2.5 rounded-xl text-gray-700 tracking-wider border border-gray-200/40">
                    {settings.companyCode}
                  </span>
                  <button
                    type="button"
                    onClick={handleRegenerateCompanyCode}
                    className="p-2.5 text-gray-500 hover:text-[#F9A825] bg-gray-50 border border-gray-200 hover:border-amber-200 rounded-xl transition-all"
                    title="Cycle System Access Token"
                  >
                    <RefreshCw size={15} />
                  </button>
                </div>
              </div>

              {/* Force Mobile Users PIN Reset Toggle Option */}
              <div className="flex items-center justify-between pt-6">
                <div className="max-w-md">
                  <h5 className="text-xs font-bold text-gray-700">Enforce Dynamic Global Mobile PIN Reset</h5>
                  <p className="text-[11px] text-gray-400 leading-relaxed mt-0.5">When toggled, this forces all employee mobile client builds to wipe current cached 4-digit security PIN records and regenerate verification profiles on next initialization cycle step entry.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={settings.forcePinReset}
                    onChange={(e) => handleInputChange('forcePinReset', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F9A825]"></div>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUB-PANEL TAB 4: ADMIN PROFILE HUBS */}
        {/* ========================================================= */}
        {activeTab === 'Profile' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2">
                <KeyRound className="text-[#F9A825]" size={18} /> Admin Profile Management
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">Modify your primary operational identity credentials, contact channels, and encryption access strings.</p>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Administrative Full Name</label>
                <input
                  type="text"
                  value={settings.adminName}
                  onChange={(e) => handleInputChange('adminName', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Corporate Account Email Endpoint</label>
                <input
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                />
              </div>

              {/* FIXED: Added a dynamic visibility tracking wrapper for security password entry */}
              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Update Security System Password (Leave Blank to Keep Current)</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"} // Dynamic input type toggle
                    placeholder="••••••••"
                    value={settings.adminPassword}
                    onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 pr-12 rounded-xl outline-none focus:border-[#F9A825] transition-colors"
                  />
                  {/* Custom absolute view eye toggle button */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 text-gray-400 hover:text-[#F9A825] transition-colors outline-none"
                  >
                    {showPassword ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CONTROLS MASTER ACTIONS FOOTER BAR */}
        {/* ========================================================= */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={handleDiscardChanges}
            disabled={saving}
            className="px-6 py-3 border border-gray-200 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <X size={14} /> Discard Local Adjustments
          </button>

          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-[#F9A825] hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} /> {saving ? "Updating Cloud Matrix Nodes..." : "Save Configuration Matrix"}
          </button>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage;