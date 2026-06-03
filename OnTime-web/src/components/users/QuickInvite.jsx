import React, { useState } from 'react';
import { Send, ChevronDown, Loader2 } from 'lucide-react';
import { inviteUser } from '../../services/employeeService';
import toast from 'react-hot-toast';

const QuickInvite = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('Viewer');
  const [sending, setSending] = useState(false);

  const handleSendInvite = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Email is required!');
      return;
    }

    setSending(true);
    const loadingToast = toast.loading('Sending invitation...');
    try {
      await inviteUser({ email, phone, role });
      toast.success('Invitation sent and user registered successfully!', { id: loadingToast });
      setEmail('');
      setPhone('');
      setRole('Viewer');
    } catch (error) {
      toast.error('Failed to send invitation: ' + error.message, { id: loadingToast });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-[#F5A623] to-[#F9A825] rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between h-full">
      {/* Background shape */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Quick Invite</h3>
          <p className="text-orange-900/70 text-sm font-medium">Send an invitation link via email or phone.</p>
        </div>
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
          {sending ? (
            <Loader2 className="text-[#F9A825] animate-spin" size={18} />
          ) : (
            <Send className="text-[#F9A825] ml-1" size={18} />
          )}
        </div>
      </div>

      <form onSubmit={handleSendInvite} className="space-y-4 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input 
            type="email" 
            placeholder="Email Address" 
            value={email}
            disabled={sending}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white rounded-xl px-4 py-3 outline-none text-gray-800 placeholder-gray-400 w-full focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
          />
          <input 
            type="tel" 
            placeholder="Phone (Optional)" 
            value={phone}
            disabled={sending}
            onChange={(e) => setPhone(e.target.value)}
            className="bg-white rounded-xl px-4 py-3 outline-none text-gray-800 placeholder-gray-400 w-full focus:ring-2 focus:ring-orange-300 disabled:opacity-60"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <select 
              value={role}
              disabled={sending}
              onChange={(e) => setRole(e.target.value)}
              className="appearance-none bg-white rounded-xl px-4 py-3 outline-none text-gray-800 w-full focus:ring-2 focus:ring-orange-300 cursor-pointer disabled:opacity-60"
            >
              <option value="Viewer">Viewer</option>
              <option value="Editor">Editor</option>
              <option value="Manager">Manager</option>
              <option value="Admin">Admin</option>
              <option value="Employee">Employee</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 text-gray-500 pointer-events-none" size={18} />
          </div>
          <button 
            type="submit"
            disabled={sending}
            className="bg-[#E69315] hover:bg-[#D58510] text-white font-bold rounded-xl px-4 py-3 transition-colors shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {sending && <Loader2 className="animate-spin" size={16} />}
            {sending ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default QuickInvite;
