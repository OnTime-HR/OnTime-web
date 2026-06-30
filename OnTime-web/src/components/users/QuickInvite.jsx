// src/components/users/QuickInvite.jsx
import React, { useState } from 'react';
import { Send, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../services/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const QuickInvite = () => {
  const [formData, setFormData] = useState({ name: '', phone: '', role: 'Employee', managerPhone: '' });
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    setIsSending(true); setMessage(null);

    try {
      if (!formData.name || !formData.phone) throw new Error("Name and Phone are required.");
      const cleanPhone = formData.phone.startsWith('+') ? formData.phone : `+${formData.phone.trim()}`;
      
      let cleanManagerPhone = null;
      if (formData.managerPhone) {
        cleanManagerPhone = formData.managerPhone.startsWith('+') ? formData.managerPhone : `+${formData.managerPhone.trim()}`;
      }

      const userData = {
        name: formData.name.trim(),
        phone: cleanPhone,
        role: formData.role,
        userType: formData.role.toLowerCase(),
        company_code: "COM100",
        invited: true,
        status: "Pending",
        assignedManagerPhone: cleanManagerPhone,
        createdAt: serverTimestamp()
      };

      await setDoc(doc(db, "pre_authorized_users", cleanPhone), userData);
      
      setMessage({ type: 'success', text: 'Invitation created successfully!' });
      setFormData({ name: '', phone: '', role: 'Employee', managerPhone: '' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to send invite.' });
    } finally { setIsSending(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col justify-center h-full min-h-[280px]">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-amber-50 text-[#F9A825] rounded-2xl flex items-center justify-center"><UserPlus size={24} /></div>
        <div>
          <h3 className="text-lg font-bold text-gray-900 leading-tight">Quick Invite</h3>
          <p className="text-xs text-gray-500 font-medium">Add a single user to the roster.</p>
        </div>
      </div>

      <form onSubmit={handleInvite} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 px-4 rounded-xl outline-none focus:border-[#F9A825]" />
          <input type="text" placeholder="User Phone (+94...)" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 px-4 rounded-xl outline-none focus:border-[#F9A825]" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <input type="text" placeholder="Manager Phone (Optional)" value={formData.managerPhone} onChange={(e) => setFormData({...formData, managerPhone: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm font-medium py-3 px-4 rounded-xl outline-none focus:border-[#F9A825]" />
          <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full bg-gray-50 border border-gray-200 text-sm font-bold text-gray-700 py-3 px-4 rounded-xl outline-none focus:border-[#F9A825]">
            <option value="Employee">Employee</option><option value="Manager">Manager</option><option value="Admin">Admin</option>
          </select>
        </div>
        <button type="submit" disabled={isSending} className="w-full bg-[#F9A825] hover:bg-amber-600 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-sm transition-colors cursor-pointer">{isSending ? 'Sending...' : 'Send Access Invite'}</button>
      </form>
      {message && <div className={`mt-4 flex items-center gap-2 text-xs font-bold px-4 py-3 rounded-xl ${message.type === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{message.text}</div>}
    </div>
  );
};

export default QuickInvite;