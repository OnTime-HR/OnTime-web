import React from 'react';
import { Send, ChevronDown } from 'lucide-react';

const QuickInvite = () => {
  return (
    <div className="bg-gradient-to-br from-[#F5A623] to-[#F9A825] rounded-2xl p-6 shadow-sm relative overflow-hidden">
      {/* Background shape */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Quick Invite</h3>
          <p className="text-orange-900/70 text-sm font-medium">Send an invitation link via email or phone.</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Send className="text-[#F9A825] ml-1" size={18} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
        <input 
          type="email" 
          placeholder="Email Address" 
          className="bg-white rounded-xl px-4 py-3 outline-none text-gray-800 placeholder-gray-400 w-full focus:ring-2 focus:ring-orange-300"
        />
        <input 
          type="tel" 
          placeholder="Phone (Optional)" 
          className="bg-white rounded-xl px-4 py-3 outline-none text-gray-800 placeholder-gray-400 w-full focus:ring-2 focus:ring-orange-300"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="relative">
          <select className="appearance-none bg-white rounded-xl px-4 py-3 outline-none text-gray-800 w-full focus:ring-2 focus:ring-orange-300 cursor-pointer">
            <option>Viewer</option>
            <option>Editor</option>
            <option>Manager</option>
            <option>Admin</option>
          </select>
          <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={18} />
        </div>
        <button className="bg-[#E69315] hover:bg-[#D58510] text-white font-bold rounded-xl px-4 py-3 transition-colors shadow-sm">
          Send Invite
        </button>
      </div>
    </div>
  );
};

export default QuickInvite;
