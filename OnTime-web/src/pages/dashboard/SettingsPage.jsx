// src/pages/dashboard/SettingsPage.jsx
import React, { useState } from 'react';
import { Settings, Shield, BellRing, Save, Building } from 'lucide-react';

const SettingsPage = () => {
  // Local states for management variables matching your schema
  const [orgName, setOrgName] = useState('OnTime HR Solutions');
  const [companyCode, setCompanyCode] = useState('ONTIME-HQ-2026');
  const [radius, setRadius] = useState('500');
  
  // App system preference toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [smsBackup, setSmsBackup] = useState(false);
  const [requirePhoto, setRequirePhoto] = useState(true);

  const handleSaveSettings = (e) => {
    e.preventDefault();
    // Logic to update organization profile document parameters
    alert("System configuration profiles updated successfully!");
  };

  return (
    <div className="p-10">
      <form onSubmit={handleSaveSettings} className="space-y-8">
        
        {/* UPPER GRID: Splits Company Profile and Security Matrix */}
        <div className="grid grid-cols-2 gap-8">
          
          {/* Box 1: Organization Global Profile Profile */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-6">
                <Building size={18} />
                Organization Details
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Organization Name</label>
                  <input 
                    type="text" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#F9A825]"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">System Authorization Code</label>
                  <input 
                    type="text" 
                    disabled
                    className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-gray-500 cursor-not-allowed outline-none"
                    value={companyCode}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Box 2: Geofencing Control Setup Parameters */}
          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-6">
                <Shield size={18} />
                Security & Geofencing Parameters
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Default Verification Radius (Meters)</label>
                  <input 
                    type="number" 
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#F9A825]"
                    value={radius}
                    onChange={(e) => setRadius(e.target.value)}
                    required
                  />
                </div>
                
                <div className="flex items-center justify-between py-1 pt-3">
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">Biometric / Photo Check-in</h5>
                    <p className="text-[10px] text-gray-400 font-medium">Require mobile users to snap verification selfie on check-in</p>
                  </div>
                  <input 
                    type="checkbox"
                    className="w-4 h-4 accent-[#F9A825] cursor-pointer"
                    checked={requirePhoto}
                    onChange={(e) => setRequirePhoto(e.target.checked)}
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* LOWER SECTION: Full Width Notification Rules Configurator */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-6">
            <BellRing size={18} />
            System Notifications Preferences
          </div>
          
          <div className="divide-y divide-gray-100">
            {/* Rule row 1 */}
            <div className="flex items-center justify-between pb-4">
              <div>
                <h5 className="text-xs font-bold text-gray-800">Real-Time Push Alerts</h5>
                <p className="text-[10px] text-gray-400 font-medium">Send push alerts immediately to management console on pending requests</p>
              </div>
              <input 
                type="checkbox"
                className="w-4 h-4 accent-[#F9A825] cursor-pointer"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
              />
            </div>

            {/* Rule row 2 */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <h5 className="text-xs font-bold text-gray-800">SMS Gateway Routing Fallback</h5>
                <p className="text-[10px] text-gray-400 font-medium">Route alerts via traditional cellular SMS APIs during slow server responses</p>
              </div>
              <input 
                type="checkbox"
                className="w-4 h-4 accent-[#F9A825] cursor-pointer"
                checked={smsBackup}
                onChange={(e) => setSmsBackup(e.target.checked)}
              />
            </div>
          </div>
        </div>

        {/* Form Submission Execution Trigger Bar */}
        <div className="flex justify-end">
          <button 
            type="submit"
            className="bg-[#F9A825] text-white font-bold text-xs px-6 py-3 rounded-xl shadow-md hover:bg-orange-500 transition-colors flex items-center gap-2"
          >
            <Save size={14} /> Save Changes
          </button>
        </div>

      </form>
    </div>
  );
};

export default SettingsPage;