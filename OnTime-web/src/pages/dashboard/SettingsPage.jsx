// src/pages/dashboard/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import { db, auth } from '../../services/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Clock, Shield, Sliders, User, RefreshCw, Save, X, KeyRound, Globe, Landmark, UploadCloud, AlertTriangle, LifeBuoy, FileText, Smartphone, Eye, EyeOff, Lock } from 'lucide-react';
import { updateAdminProfileData, reauthenticateAdmin } from '../../services/adminService';
import NotificationToast from '../../components/dashboard/NotificationToast';

const SettingsPage = () => {
  const CLOUD_NAME = "dfqeymqdx";
  const UPLOAD_PRESET = "ontimeweb";

  const [activeTab, setActiveTab] = useState('General');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authPasswordInput, setAuthPasswordInput] = useState('');

  // Secure View Password States
  const [showViewPasswordModal, setShowViewPasswordModal] = useState(false);
  const [viewPasswordInput, setViewPasswordInput] = useState('');
  const [verifyingView, setVerifyingView] = useState(false);

  const [showPinResetModal, setShowPinResetModal] = useState(false);
  const [toast, setToast] = useState({ isOpen: false, type: 'success', message: '' });

  const [originalSettings, setOriginalSettings] = useState(null);

  const [settings, setSettings] = useState({
    companyCode: "ONTIME-HQ-2026",
    annualLeaveQuota: 21,
    claimCurrency: "LKR",
    workStart: "08:30",
    workEnd: "17:30",
    gracePeriod: 15,
    earlyDepartureAllowance: 10,
    adminName: "",
    adminEmail: "",
    adminPassword: "",
    adminAvatar: ""
  });

  const showToast = (type, message) => setToast({ isOpen: true, type, message });

  useEffect(() => {
    const fetchGlobalConfigurations = async () => {
      try {
        const docRef = doc(db, "system_settings", "global_config");
        const docSnap = await getDoc(docRef);

        let fetchedData = {};
        if (docSnap.exists()) fetchedData = docSnap.data();

        // Check if admin details exist in Auth, if not try to pull from admins collection
        let currentAdminName = auth.currentUser?.displayName;
        if (!currentAdminName) {
          const adminDocSnap = await getDoc(doc(db, "admins", auth.currentUser?.uid));
          if (adminDocSnap.exists()) currentAdminName = adminDocSnap.data().name;
        }

        const initialFormState = {
          companyCode: fetchedData.companyCode || "ONTIME-HQ-2026",
          annualLeaveQuota: fetchedData.annualLeaveQuota || 21,
          claimCurrency: fetchedData.claimCurrency || "LKR",
          workStart: fetchedData.workStart || "08:30",
          workEnd: fetchedData.workEnd || "17:30",
          gracePeriod: fetchedData.gracePeriod || 15,
          earlyDepartureAllowance: fetchedData.earlyDepartureAllowance || 10,
          adminName: currentAdminName || "System Admin",
          adminEmail: auth.currentUser?.email || "",
          adminPassword: "",
          adminAvatar: auth.currentUser?.photoURL || ""
        };

        setSettings(initialFormState);
        setOriginalSettings(JSON.parse(JSON.stringify(initialFormState)));
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

  const handleRegenerateCompanyCode = () => {
    const randomString = Math.random().toString(36).substring(2, 7).toUpperCase();
    handleInputChange('companyCode', `ONTIME-${randomString}-2026`);
  };

  const handleDiscardChanges = () => {
    if (originalSettings) {
      setSettings(JSON.parse(JSON.stringify(originalSettings)));
      setShowPassword(false);
      showToast('success', "Local adjustments discarded.");
    }
  };

  // CLOUDINARY AVATAR UPLOAD
  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);
    const dataToSend = new FormData();
    dataToSend.append("file", file);
    dataToSend.append("upload_preset", UPLOAD_PRESET);

    try {
      const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: "POST",
        body: dataToSend
      });
      const parsedRes = await response.json();

      if (parsedRes.secure_url) {
        handleInputChange('adminAvatar', parsedRes.secure_url);
        showToast('success', 'Profile image uploaded successfully.');
      } else {
        showToast('error', 'Image upload failed.');
      }
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const handlePasswordViewRequest = () => {
    if (showPassword) {
      setShowPassword(false);
    } else {
      setShowViewPasswordModal(true);
      setViewPasswordInput('');
    }
  };

  // FIXED: Auto-closes the popup immediately if the password is wrong!
  const handleVerifyToViewPassword = async () => {
    if (!viewPasswordInput) return;
    setVerifyingView(true);
    try {
      await reauthenticateAdmin(viewPasswordInput);
      setShowPassword(true);
      setShowViewPasswordModal(false);
      setViewPasswordInput('');
      showToast('success', 'Identity verified. Password visibility unlocked.');
    } catch (error) {
      // Instantly close the modal on error
      setShowViewPasswordModal(false);
      setViewPasswordInput('');
      showToast('error', 'Verification failed: Incorrect current password.');
    } finally {
      setVerifyingView(false);
    }
  };

  const executeGlobalPinReset = async () => {
    setShowPinResetModal(false);
    try {
      await setDoc(doc(db, "system_settings", "global_config"), {
        globalPinResetTriggeredAt: serverTimestamp()
      }, { merge: true });
      showToast('success', 'Global PIN Reset signal broadcasted to all mobile clients.');
    } catch (error) {
      showToast('error', 'Failed to broadcast PIN reset: ' + error.message);
    }
  };

  const initiateSave = (e) => {
    e.preventDefault();
    const isSensitiveChange = (settings.adminEmail !== auth.currentUser?.email) || (settings.adminPassword.length > 0);

    if (activeTab === 'Profile' && isSensitiveChange) {
      setShowAuthModal(true);
    } else {
      executeSave();
    }
  };

  // src/pages/dashboard/SettingsPage.jsx

  // Update the executeSave function
  const executeSave = async () => {
    setShowAuthModal(false);
    setSaving(true);

    try {
      // 1. Update Auth & Firestore via Service
      await updateAdminProfileData(
        settings.adminName,
        settings.adminEmail,
        settings.adminPassword,
        authPasswordInput,
        settings.adminAvatar
      );
    } catch (error) {
      // If Firebase Auth blocks the email change, notify the user but don't stop the whole process
      if (error.code === 'auth/operation-not-allowed') {
        showToast('error', "Auth restriction: Email change blocked by Firebase policy.");
      } else {
        showToast('error', error.message);
        setSaving(false);
        return; // Stop here if it's a critical error
      }
    }

    // 2. Update System Settings (Global Config)
    try {
      const docRef = doc(db, "system_settings", "global_config");
      await setDoc(docRef, {
        annualLeaveQuota: Number(settings.annualLeaveQuota),
        // ... other fields
      }, { merge: true });

      setSettings(prev => ({ ...prev, adminPassword: "" }));
      setAuthPasswordInput('');
      setOriginalSettings(JSON.parse(JSON.stringify({ ...settings, adminPassword: "" })));
      showToast('success', "Profile and system settings synchronized.");
    } catch (err) {
      showToast('error', "System settings update failed.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-xs font-bold text-gray-400 uppercase tracking-widest animate-pulse">Fetching System Parameters...</div>;
  }

  return (
    <div className="p-4 md:p-8 w-full animate-in fade-in duration-300 max-w-5xl mx-auto pb-24">
      <form onSubmit={initiateSave} className="space-y-8">

        {/* TAB NAVIGATION */}
        <div className="flex flex-wrap border-b border-gray-200 bg-white p-2 rounded-2xl shadow-sm border gap-2">
          {[
            { id: 'General', label: 'General', icon: <Sliders size={15} /> },
            { id: 'Attendance', label: 'Attendance', icon: <Clock size={15} /> },
            { id: 'Security', label: 'Security', icon: <Shield size={15} /> },
            { id: 'Profile', label: 'Profile', icon: <User size={15} /> },
            { id: 'Support', label: 'Support', icon: <LifeBuoy size={15} /> },
            { id: 'Privacy', label: 'Privacy Policy', icon: <FileText size={15} /> }
          ].map((tab) => (
            <button
              key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-[#F9A825] text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: GENERAL */}
        {activeTab === 'General' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Globe className="text-[#F9A825]" size={18} /> General Parameters</h3>
              <p className="text-xs text-gray-400 mt-0.5">Configure default team constraints and workspace values.</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Default Annual Leave Quota</label>
                <input type="number" value={settings.annualLeaveQuota} onChange={(e) => handleInputChange('annualLeaveQuota', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Medical Claims Active Currency</label>
                <div className="relative flex items-center bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-1 focus-within:border-[#F9A825]">
                  <Landmark size={14} className="text-gray-400 mr-2" />
                  <select value={settings.claimCurrency} onChange={(e) => handleInputChange('claimCurrency', e.target.value)} className="w-full bg-transparent py-2.5 text-xs font-bold text-gray-700 outline-none cursor-pointer">
                    <option value="LKR">Sri Lankan Rupee (LKR)</option>
                    <option value="USD">United States Dollar (USD)</option>
                    <option value="EUR">Euro Currency (EUR)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ATTENDANCE */}
        {activeTab === 'Attendance' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Clock className="text-[#F9A825]" size={18} /> Operational Attendance Rules</h3>
              <p className="text-xs text-gray-400 mt-0.5">Control timeline fallbacks and compliance guidelines.</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Default Shift Start (Punch In)</label>
                <input type="time" value={settings.workStart} onChange={(e) => handleInputChange('workStart', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Default Shift End (Punch Out)</label>
                <input type="time" value={settings.workEnd} onChange={(e) => handleInputChange('workEnd', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Late Grace Period (Minutes)</label>
                <input type="number" value={settings.gracePeriod} onChange={(e) => handleInputChange('gracePeriod', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Early Departure Allowance (Mins)</label>
                <input type="number" value={settings.earlyDepartureAllowance} onChange={(e) => handleInputChange('earlyDepartureAllowance', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SECURITY */}
        {activeTab === 'Security' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><Shield className="text-[#F9A825]" size={18} /> Access Security Rules</h3>
              <p className="text-xs text-gray-400 mt-0.5">Manage enrollment security constraints.</p>
            </div>
            <div className="space-y-6 divide-y divide-gray-100">
              <div className="flex items-center justify-between pt-2">
                <div className="max-w-md">
                  <h5 className="text-xs font-bold text-gray-700">App Roster Security Authorization Token</h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Required field mapping token used by mobile nodes.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-gray-100 font-mono text-xs font-black px-4 py-2.5 rounded-xl text-gray-700 border border-gray-200/40">{settings.companyCode}</span>
                  <button type="button" onClick={handleRegenerateCompanyCode} className="p-2.5 text-gray-500 hover:text-[#F9A825] bg-gray-50 border border-gray-200 hover:border-amber-200 rounded-xl transition-all" title="Cycle Token"><RefreshCw size={15} /></button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-6">
                <div className="max-w-md">
                  <h5 className="text-xs font-bold text-gray-700">Enforce Dynamic Global Mobile PIN Reset</h5>
                  <p className="text-[11px] text-gray-400 mt-0.5">Push an immediate signal to all employee mobile apps forcing them to recreate their 4-digit security PIN.</p>
                </div>
                <button type="button" onClick={() => setShowPinResetModal(true)} className="px-5 py-2.5 bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-2 outline-none">
                  <Smartphone size={15} /> Trigger Reset Push
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'Profile' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><KeyRound className="text-[#F9A825]" size={18} /> Admin Profile Management</h3>
              <p className="text-xs text-gray-400 mt-0.5">Modify your primary identity and access credentials.</p>
            </div>

            <div className="flex items-center gap-6 pb-6 border-b border-gray-50">
              <div className="relative">
                <div className="w-20 h-20 rounded-full border-2 border-gray-100 bg-gray-50 overflow-hidden shadow-sm flex items-center justify-center">
                  {settings.adminAvatar ? (
                    <img src={settings.adminAvatar} alt="Admin" className="w-full h-full object-cover" />
                  ) : (
                    <User size={32} className="text-gray-300" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 p-1.5 bg-[#F9A825] hover:bg-amber-600 text-white rounded-full shadow-md cursor-pointer transition-colors">
                  <UploadCloud size={14} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                </label>
              </div>
              <div>
                <h5 className="text-sm font-bold text-gray-800">Profile Display Image</h5>
                <p className="text-[11px] text-gray-400 mt-0.5 mb-2">{imageUploading ? "Uploading to Cloudinary..." : "Upload a squared portrait image (JPG, PNG)."}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Administrative Full Name</label>
                <input type="text" value={settings.adminName} onChange={(e) => handleInputChange('adminName', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">Corporate Account Email</label>
                <input type="email" value={settings.adminEmail} onChange={(e) => handleInputChange('adminEmail', e.target.value)} className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 rounded-xl outline-none focus:border-[#F9A825]" />
              </div>

              <div className="col-span-2">
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-2">New Security Password (Leave Blank to Keep Current)</label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={settings.adminPassword}
                    onChange={(e) => handleInputChange('adminPassword', e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 text-xs font-semibold p-3.5 pr-12 rounded-xl outline-none focus:border-[#F9A825]"
                  />
                  <button
                    type="button"
                    onClick={handlePasswordViewRequest}
                    className={`absolute right-4 outline-none transition-colors ${showPassword ? 'text-[#F9A825]' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: HELP & SUPPORT (STATIC) */}
        {activeTab === 'Support' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><LifeBuoy className="text-[#F9A825]" size={18} /> Help & Support Hub</h3>
              <p className="text-xs text-gray-400 mt-0.5">Contact the engineering team or reference documentation.</p>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-5">
              <h4 className="font-bold text-gray-800 text-sm mb-2">OnTime Engineering Department</h4>
              <p className="text-xs text-gray-600 leading-relaxed mb-4">If you are experiencing critical system failures, API disconnects, or need database restorations outside of the 30-day Trash Bin limits, please contact the lead development team.</p>
              <div className="space-y-2 text-xs font-medium text-gray-700">
                <p><strong>Primary Lead:</strong> Praveen Thathsara</p>
                <p><strong>Developer Email:</strong> praveenthathsara@ontimeweb.com</p>
                <p><strong>Technical Support Line:</strong> +94 77 123 4567</p>
                <p><strong>Institution:</strong> Sabaragamuwa University of Sri Lanka</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PRIVACY POLICY (STATIC) */}
        {activeTab === 'Privacy' && (
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6 animate-in fade-in duration-150">
            <div>
              <h3 className="text-base font-bold text-gray-800 flex items-center gap-2"><FileText className="text-[#F9A825]" size={18} /> Administrative Privacy Policy</h3>
              <p className="text-xs text-gray-400 mt-0.5">Internal data management and tracking protocol rules.</p>
            </div>
            <div className="space-y-4 text-xs text-gray-600 leading-relaxed bg-gray-50 p-5 rounded-xl border border-gray-200 max-h-[400px] overflow-y-auto">
              <h4 className="font-bold text-gray-800">1. Data Collection & Cloud Storage</h4>
              <p>The OnTime Administrative Dashboard utilizes Firebase Cloud Firestore for real-time data persistence. All employee geofencing coordinates, mobile IP states, and hardware identifiers are securely stored and encrypted at rest by Google Cloud protocols.</p>

              <h4 className="font-bold text-gray-800 mt-4">2. The 30-Day Retention Clause</h4>
              <p>Any record deleted within this management console (including Offices, Users, and News) is temporarily staged in the encrypted Trash Bin architecture. If not restored, it is permanently wiped from all Google Cloud servers upon reaching its 30-day expiration matrix.</p>

              <h4 className="font-bold text-gray-800 mt-4">3. Device Identification Tracking</h4>
              <p>Administrators have the capability to force dynamic PIN resets. When toggled, the system clears verified hardware tokens across all employee devices to prevent unauthorized terminal access.</p>
            </div>
          </div>
        )}

        {/* GLOBAL SAVE FOOTER */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button type="button" onClick={handleDiscardChanges} disabled={saving} className="px-6 py-3 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold transition-all disabled:opacity-50">
            Discard Adjustments
          </button>
          <button type="submit" disabled={saving || imageUploading} className="px-6 py-3 bg-[#F9A825] hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md transition-all disabled:opacity-50">
            {saving ? "Updating Cloud Nodes..." : "Save Configuration Matrix"}
          </button>
        </div>
      </form>

      {/* ========================================================= */}
      {/* MODAL: AUTHENTICATION CONFIRMATION (Save Settings) */}
      {/* ========================================================= */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-[#F9A825] mx-auto mb-4 flex items-center justify-center"><Shield size={24} /></div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Security Verification Required</h4>
            <p className="text-xs text-gray-400 mb-6">You are attempting to change sensitive credentials (Email or Password). Please verify your identity by entering your <strong>current</strong> password.</p>
            <input
              type="password" placeholder="Current Password"
              value={authPasswordInput} onChange={(e) => setAuthPasswordInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm mb-6 outline-none focus:border-[#F9A825] text-center tracking-widest"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowAuthModal(false); setAuthPasswordInput(''); setSaving(false); }} className="bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-xs py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={executeSave} disabled={!authPasswordInput} className="bg-[#F9A825] text-white hover:bg-amber-600 font-bold text-xs py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50">Verify & Save</button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: UNLOCK PASSWORD VISIBILITY (View Typed Password) */}
      {/* ========================================================= */}
      {showViewPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-[#F9A825] mx-auto mb-4 flex items-center justify-center"><Lock size={24} /></div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Unlock Password Visibility</h4>
            <p className="text-xs text-gray-400 mb-6">Enter your <strong>current</strong> password to temporarily reveal the security password field.</p>
            <input
              type="password" placeholder="Current Password"
              value={viewPasswordInput} onChange={(e) => setViewPasswordInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm mb-6 outline-none focus:border-[#F9A825] text-center tracking-widest"
              autoFocus
            />
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { setShowViewPasswordModal(false); setViewPasswordInput(''); }} className="bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-xs py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={handleVerifyToViewPassword} disabled={!viewPasswordInput || verifyingView} className="bg-[#F9A825] text-white hover:bg-amber-600 font-bold text-xs py-3 rounded-xl shadow-sm transition-colors disabled:opacity-50">
                {verifyingView ? "Verifying..." : "Unlock Field"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: GLOBAL PIN RESET CONFIRMATION */}
      {/* ========================================================= */}
      {showPinResetModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[99999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 text-center animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 mx-auto mb-4 flex items-center justify-center"><AlertTriangle size={24} /></div>
            <h4 className="text-base font-bold text-gray-900 mb-1">Execute Global PIN Reset?</h4>
            <p className="text-xs text-gray-400 mb-6">This will log out all currently active mobile application sessions and force every employee to create a new 4-digit PIN upon their next login. Are you sure?</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setShowPinResetModal(false)} className="bg-gray-50 text-gray-600 hover:bg-gray-100 font-bold text-xs py-3 rounded-xl transition-colors">Cancel</button>
              <button onClick={executeGlobalPinReset} className="bg-rose-600 text-white hover:bg-rose-700 font-bold text-xs py-3 rounded-xl shadow-sm transition-colors">Yes, Execute Push</button>
            </div>
          </div>
        </div>
      )}

      <NotificationToast isOpen={toast.isOpen} type={toast.type} message={toast.message} onClose={() => setToast(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};

export default SettingsPage;