import React, { useState, useEffect } from 'react';
import { Hourglass, CheckCircle, DollarSign, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';

const ApprovalsPage = () => {
  // Tab states for Filtering the table rows
  const [activeTab, setActiveTab] = useState('All Requests');
  
  // Real-time metrics counters synchronized with Firestore collections
  const [pendingCount, setPendingCount] = useState(0);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // Report Form state fields
  const [reportType, setReportType] = useState('Monthly Leave Summary');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [department, setDepartment] = useState('All Departments');

  useEffect(() => {
    // 1. Fetch data from leave_requests to count total pending instances
    const qPending = query(collection(db, "leave_requests"), where("status", "==", "Pending"));
    const unsubPending = onSnapshot(qPending, (snap) => {
      setPendingCount(snap.size);
      
      // Map data for the dynamic evaluation table stream
      const requests = snap.docs.map(doc => ({
        id: doc.id,
        employeeName: doc.data().userName || 'Unknown Staff',
        role: doc.data().userRole || 'Employee',
        type: doc.data().leaveType || 'Leave',
        dateRequested: doc.data().appliedAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) || 'Recent',
        duration: `${doc.data().totalDays || 1} Day(s)`,
        status: doc.data().status || 'Pending'
      }));
      setLeaveRequests(requests);
    });

    return () => {
      unsubPending();
    };
  }, []);

  // Filter evaluation matrix based on UI tabs matching Figma layout criteria
  const filteredRequests = leaveRequests.filter(req => {
    if (activeTab === 'All Requests') return true;
    if (activeTab === 'Leave') return req.type.includes('Leave');
    if (activeTab === 'Medical') return req.type.includes('Medical') || req.type.includes('Sick');
    return true;
  });

  return (
    <div className="p-10">
      {/* SECTION 1: Top high-level summary cards */}
      <div className="grid grid-cols-3 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider mb-1">Pending Requests</p>
            <h3 className="text-3xl font-bold text-gray-900">{pendingCount || 12}</h3>
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

      {/* SECTION 2: Table view displaying Pending Approvals log */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#FFF9F0]/30">
          <h3 className="font-bold text-gray-900 text-base">Pending Approvals</h3>
          
          {/* Tab switches selector array */}
          <div className="flex bg-gray-100/70 p-1 rounded-xl border border-gray-200/50">
            {['All Requests', 'Leave', 'Medical', 'Expense'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activeTab === tab 
                    ? 'bg-[#F9A825] text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900'
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
              <tr className="border-b border-gray-100 text-[11px] font-bold text-gray-400 tracking-wider bg-gray-50/50 uppercase">
                <th className="p-4 pl-6">Employee</th>
                <th className="p-4">Type</th>
                <th className="p-4">Date Requested</th>
                <th className="p-4">Amount/Duration</th>
                <th className="p-4">Status</th>
                <th className="p-4 pr-6 text-center">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {filteredRequests.map((req, idx) => (
                <tr key={req.id || idx} className="hover:bg-gray-50/40 transition-colors">
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
                      req.type.includes('Medical') || req.type.includes('Sick')
                        ? 'bg-blue-50 text-blue-600'
                        : req.type.includes('Expense')
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-purple-50 text-purple-600'
                    }`}>
                      {req.type}
                    </span>
                  </td>
                  <td className="p-4 text-gray-500 font-medium">{req.dateRequested}</td>
                  <td className="p-4 text-gray-700 font-semibold">{req.duration}</td>
                  <td className="p-4">
                    <span className="flex items-center gap-1.5 text-xs text-amber-600 font-bold bg-amber-50 px-2 py-0.5 rounded-full w-fit">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      {req.status}
                    </span>
                  </td>
                  <td className="p-4 pr-6 text-center space-x-2">
                    <button className="bg-[#F9A825] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-orange-500 transition-colors">
                      Approve
                    </button>
                    <button className="border border-gray-200 text-gray-500 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRequests.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No matching pending requests found</p>
          )}
        </div>
      </div>

      {/* SECTION 3: Bottom grid splitting Report Builder and Archive Logs */}
      <div className="grid grid-cols-12 gap-8">
        {/* Report Generation Parameter Configurator Panel */}
        <div className="col-span-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between min-h-[380px]">
          <div>
            <div className="flex items-center gap-2 text-base font-bold text-[#F9A825] mb-6">
              <FileText size={18} />
              Report Generator
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Report Type</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#F9A825]"
                  value={reportType} 
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option>Monthly Leave Summary</option>
                  <option>Attendance Log Export</option>
                  <option>Expense Audit Compilation</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Date Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 outline-none focus:border-[#F9A825]"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <input 
                    type="date" 
                    className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-600 outline-none focus:border-[#F9A825]"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1 uppercase tracking-wider">Department</label>
                <select 
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-gray-700 outline-none focus:border-[#F9A825]"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option>All Departments</option>
                  <option>Engineering</option>
                  <option>Human Resources</option>
                  <option>Operations</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <button className="bg-[#F9A825] text-white font-bold text-xs py-3 rounded-xl shadow-md hover:bg-orange-500 transition-colors flex items-center justify-center gap-1.5">
              <Download size={14} /> Export PDF
            </button>
            <button className="border border-emerald-200 bg-emerald-50/40 text-emerald-600 font-bold text-xs py-3 rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5">
              <FileSpreadsheet size={14} /> Excel
            </button>
          </div>
        </div>

        {/* Archives Feed Panel List view */}
        <div className="col-span-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-gray-900 text-base">Generated Reports Archive</h3>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search archive..." 
                className="bg-gray-50 border border-gray-100 rounded-full pl-4 pr-8 py-1.5 text-xs w-56 outline-none focus:border-[#F9A825]"
              />
            </div>
          </div>

          <div className="flex-1 divide-y divide-gray-100 overflow-y-auto max-h-[260px] pr-1">
            {[
              { name: 'Q3 Leave Analysis 2023.pdf', info: 'Generated by John Doe • 2.4 MB', date: 'Oct 15, 2023', type: 'pdf' },
              { name: 'Medical Claims_Sept23.xlsx', info: 'Generated by System • 856 KB', date: 'Oct 01, 2023', type: 'excel' },
              { name: 'Monthly Attendance_Sept23.pdf', info: 'Generated by Sarah Jenkins • 1.8 MB', date: 'Oct 01, 2023', type: 'pdf' },
              { name: 'Payroll_Export_Q3.csv', info: 'Generated by Finance Dept • 5.2 MB', date: 'Sep 30, 2023', type: 'excel' }
            ].map((file, index) => (
              <div key={index} className="py-3 flex justify-between items-center first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${file.type === 'pdf' ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-600'}`}>
                    {file.type === 'pdf' ? <FileText size={18} /> : <FileSpreadsheet size={18} />}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800">{file.name}</h5>
                    <p className="text-[10px] text-gray-400 font-medium">{file.info}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[11px] text-gray-400 font-medium">{file.date}</span>
                  <button className="text-gray-400 hover:text-[#F9A825] transition-colors">
                    <Download size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApprovalsPage;