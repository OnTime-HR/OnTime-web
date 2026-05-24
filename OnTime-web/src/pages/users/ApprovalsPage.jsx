// src/pages/users/ApprovalsPage.jsx
import React, { useState, useEffect } from 'react';
import { Hourglass, CheckCircle, DollarSign, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { streamPendingRequests, updateRequestStatus } from '../../services/approvalService';

const ApprovalsPage = () => {
  const [activeTab, setActiveTab] = useState('All Requests');
  const [allRequests, setAllRequests] = useState([]);
  const [loadingId, setLoadingId] = useState(null);

  // 1. Connect the real-time listener when the page loads
  useEffect(() => {
    const unsubscribe = streamPendingRequests((firebaseData) => {
      // Format incoming Firestore data to match our UI table structure neatly
      const formatted = firebaseData.map(item => ({
        id: item.id,
        employeeId: item.userId || '', 
        employeeName: item.userName || 'Unknown Staff',
        role: item.userRole || 'Employee',
        type: item.leaveType || 'Leave', // e.g., Leave, Medical, Expense
        dateRequested: item.appliedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent',
        duration: item.totalDays || 1,
        status: item.status || 'Pending'
      }));
      setAllRequests(formatted);
    });

    return () => unsubscribe();
  }, []);

  // 2. Handle Action clicks (Approve / Reject)
  const handleDecision = async (request, decision) => {
    setLoadingId(request.id);
    try {
      await updateRequestStatus(
        request.id,
        request.employeeId,
        request.type,
        request.duration,
        decision
      );
      alert(`Request has been successfully ${decision.toLowerCase()}!`);
    } catch (error) {
      alert("Error processing transaction request: " + error.message);
    } finally {
      setLoadingId(null);
    }
  };

  // Filter requests based on selected UI Tab categories
  const filteredRequests = allRequests.filter(req => {
    if (activeTab === 'All Requests') return true;
    return req.type.toLowerCase() === activeTab.toLowerCase();
  });

  return (
    <div className="p-10">
      {/* METRICS ROW */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Pending Requests</p>
            <h3 className="text-3xl font-bold text-gray-900">{allRequests.length}</h3>
          </div>
          <div className="p-3 bg-[#FFF4E5] rounded-xl text-[#F9A825]">
            <Hourglass size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Approvals This Month</p>
            <h3 className="text-3xl font-bold text-gray-900">48</h3>
          </div>
          <div className="p-3 bg-green-50 rounded-xl text-green-600">
            <CheckCircle size={24} />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Total Claims Value</p>
            <h3 className="text-3xl font-bold text-gray-900">$4,250</h3>
          </div>
          <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* DATA LOG EVALUATION TABLE CONTAINER */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F0]/30">
          <h3 className="font-bold text-gray-900 text-base">Pending Approvals</h3>
          
          <div className="flex bg-gray-100/70 p-1 rounded-xl border border-gray-200/50">
            {['All Requests', 'Leave', 'Medical', 'Expense'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab ? 'bg-[#F9A825] text-white shadow-sm' : 'text-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 bg-gray-50/50 uppercase">
                <th className="p-4 pl-6">Employee</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date Requested</th>
                <th className="p-4">Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRequests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50/40 transition-colors">
                  <td className="p-4 pl-6 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-xs text-[#F9A825]">
                      {req.employeeName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-800 leading-tight">{req.employeeName}</h4>
                      <p className="text-gray-400 text-[11px] font-medium">{req.role}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-md uppercase ${
                      req.type === 'Medical' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500">{req.dateRequested}</td>
                  <td className="p-4 text-gray-700 font-semibold">{req.duration} Day(s)</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-center space-x-2">
                    <button 
                      disabled={loadingId !== null}
                      onClick={() => handleDecision(req, 'Approved')}
                      className="bg-[#F9A825] text-white text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button 
                      disabled={loadingId !== null}
                      onClick={() => handleDecision(req, 'Rejected')}
                      className="border border-gray-200 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No pending requests found in this category.</p>
          )}
        </div>
      </div>

      {/* BOTTOM REPORT PANELS (Keep layout structure as is) */}
      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm min-h-[350px]">
          <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-6">
            <FileText size={18} /> Report Generator
          </div>
          <p className="text-xs text-gray-400">Configure parameters to compile spreadsheets analytics logs formats.</p>
        </div>
        <div className="col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-900 text-base mb-6">Generated Reports Archive</h3>
          <p className="text-xs text-gray-400">Historic compiled backup list directory files repository.</p>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsPage;