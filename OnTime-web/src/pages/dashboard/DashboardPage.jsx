// src/pages/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import StatCard from '../../components/dashboard/StatCard';
import NewsCard from '../../components/dashboard/NewsCard';
import { Users, FileText, ExternalLink, Megaphone, X, FileDown, Video } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { getSystemUserCounts } from '../../services/employeeService';

const DashboardPage = () => {
  const navigate = useNavigate();

  const [userCounts, setUserCounts] = useState({ employees: 0, managers: 0, admins: 0 });
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [news, setNews] = useState([]);
  const [showMultimedia, setShowMultimedia] = useState(false);

  // POPUP CONSOLE OVERLAY SELECTION STATE
  const [activeViewPost, setActiveViewPost] = useState(null);

  // ATTENDANCE STREAMING LOGIC LABELS
  const [rawAttendanceLogs, setRawAttendanceLogs] = useState([]);
  const [weeklyAttendanceMetrics, setWeeklyAttendanceMetrics] = useState([]);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // SAFE BLOB STREAM DOWNLOAD HANDLER
  const handleDownloadFile = async (e, fileUrl) => {
    e.preventDefault();
    if (!fileUrl) return;

    try {
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);

      const tempLink = document.createElement('a');
      tempLink.href = blobUrl;
      tempLink.download = fileUrl.split('/').pop() || "Attached_Document.pdf";
      document.body.appendChild(tempLink);
      tempLink.click();

      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Blob Download Failure:", err);
      window.open(fileUrl, '_blank');
    }
  };

  useEffect(() => {
    // 1. Fetch User Base Metrics
    const fetchCounts = async () => {
      const counts = await getSystemUserCounts();
      setUserCounts(counts);
    };
    fetchCounts();

    // 2. Monitor Pending Absence Leaves
    const qLeaves = query(collection(db, "leave_requests"), where("status", "==", "Pending"));
    const unsubLeaves = onSnapshot(qLeaves, (snap) => setPendingLeaves(snap.size));

    // 3. Company News & Events Real-time Subscriber
    const qNews = query(collection(db, "company_news"), orderBy("updatedAt", "desc"), limit(5));
    const unsubNews = onSnapshot(qNews, (snap) => {
      const loadedNews = snap.docs.map(doc => {
        const data = doc.data();

        let formattedTime = "Recent";
        if (data.createdAt) {
          formattedTime = data.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } else if (data.updatedAt) {
          formattedTime = data.updatedAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }

        return {
          id: doc.id,
          title: data.title || 'Untitled Broadcast',
          description: data.description || '',
          status: data.status || 'Active',
          startDate: data.startDate || '',
          endDate: data.endDate || '',
          linkUrl: data.linkUrl || '',
          imageUrl: data.imageUrl || '',
          videoUrl: data.videoUrl || '',
          fileUrl: data.fileUrl || '',
          image: data.imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
          time: formattedTime
        };
      });

      setNews(loadedNews);
    }, (error) => {
      console.error("Firestore News Collection Stream Fault:", error);
    });

    // 4. Stream Presence Attendance Subcollections
    const qAttendance = query(collectionGroup(db, "attendance"), where("status", "==", "Present"));
    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const logs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let parsedDate = new Date();
        if (data.date) {
          const [year, month, day] = data.date.split('-');
          parsedDate = new Date(year, month - 1, day);
        } else if (data.createdAt) {
          parsedDate = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt);
        }
        return { id: docSnap.id, ...data, dateObject: parsedDate };
      });
      setRawAttendanceLogs(logs);
    });

    return () => {
      unsubLeaves();
      unsubNews();
      unsubAttendance();
    };
  }, []);

  // Compute graph data segments dynamically based on active filter choices
  useEffect(() => {
    const now = new Date();
    if (timeFilter === 'This Week') {
      const daysMap = { 'Mon': 0, 'Tue': 0, 'Wed': 0, 'Thu': 0, 'Fri': 0, 'Sat': 0, 'Sun': 0 };
      const currentDayIndex = now.getDay();
      const distanceToMonday = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() + distanceToMonday);
      startOfWeek.setHours(0, 0, 0, 0);

      rawAttendanceLogs.forEach(log => {
        if (log.dateObject >= startOfWeek && log.dateObject <= now) {
          const weekdayStr = log.dateObject.toLocaleDateString('en-US', { weekday: 'short' });
          if (daysMap[weekdayStr] !== undefined) daysMap[weekdayStr]++;
        }
      });
      setWeeklyAttendanceMetrics(Object.keys(daysMap).map(k => ({ name: k, "Active Staff": daysMap[k] })));
    }
    else if (timeFilter === 'This Month') {
      const weeksMap = { 'Week 1': 0, 'Week 2': 0, 'Week 3': 0, 'Week 4+': 0 };
      rawAttendanceLogs.forEach(log => {
        if (log.dateObject.getMonth() === now.getMonth() && log.dateObject.getFullYear() === now.getFullYear()) {
          const dayOfMonth = log.dateObject.getDate();
          if (dayOfMonth <= 7) weeksMap['Week 1']++;
          else if (dayOfMonth <= 14) weeksMap['Week 2']++;
          else if (dayOfMonth <= 21) weeksMap['Week 3']++;
          else weeksMap['Week 4+']++;
        }
      });
      setWeeklyAttendanceMetrics(Object.keys(weeksMap).map(k => ({ name: k, "Active Staff": weeksMap[k] })));
    }
    else if (timeFilter === 'This Year') {
      const quartersMap = { 'Q1 (Jan-Mar)': 0, 'Q2 (Apr-Jun)': 0, 'Q3 (Jul-Sep)': 0, 'Q4 (Oct-Dec)': 0 };
      rawAttendanceLogs.forEach(log => {
        if (log.dateObject.getFullYear() === now.getFullYear()) {
          const monthIdx = log.dateObject.getMonth();
          if (monthIdx <= 2) quartersMap['Q1 (Jan-Mar)']++;
          else if (monthIdx <= 5) quartersMap['Q2 (Apr-Jun)']++;
          else if (monthIdx <= 8) quartersMap['Q3 (Jul-Sep)']++;
          else quartersMap['Q4 (Oct-Dec)']++;
        }
      });
      setWeeklyAttendanceMetrics(Object.keys(quartersMap).map(k => ({ name: k, "Active Staff": quartersMap[k] })));
    }
    else if (timeFilter === 'Custom Range' && customStartDate && customEndDate) {
      const start = new Date(customStartDate); start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate); end.setHours(23, 59, 59, 999);
      const customMap = {};
      rawAttendanceLogs.forEach(log => {
        if (log.dateObject >= start && log.dateObject <= end) {
          const dateStr = log.dateObject.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          if (!customMap[dateStr]) customMap[dateStr] = 0;
          customMap[dateStr]++;
        }
      });
      const sortedKeys = Object.keys(customMap).sort((a, b) => new Date(a) - new Date(b));
      setWeeklyAttendanceMetrics(sortedKeys.map(k => ({ name: k, "Active Staff": customMap[k] })));
    }
  }, [timeFilter, rawAttendanceLogs, customStartDate, customEndDate]);

  return (
    <div className="p-10">
      <div className="grid grid-cols-12 gap-8">

        <div className="col-span-9 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="col-span-1 md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col justify-center">
              <div className="flex items-center mb-4">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3"><Users size={20} /></div>
                <h3 className="text-gray-500 font-medium text-sm">System Users Overview</h3>
              </div>
              <div className="grid grid-cols-3 divide-x divide-gray-100 mt-2">
                <div className="px-4 text-center">
                  <p className="text-4xl font-bold text-[#F9A825] tracking-tight">{userCounts.employees}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">Employees</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-4xl font-bold text-[#F9A825] tracking-tight">{userCounts.managers}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">Managers</p>
                </div>
                <div className="px-4 text-center">
                  <p className="text-4xl font-bold text-[#F9A825] tracking-tight">{userCounts.admins}</p>
                  <p className="text-xs text-gray-400 mt-2 font-medium uppercase tracking-wider">Admins</p>
                </div>
              </div>
            </div>
            <div className="col-span-1">
              <StatCard
                label="Pending Leaves" value={pendingLeaves} subtext="Requires approval"
                icon={<FileText className="text-orange-600" size={20} />} iconBg="bg-orange-50" textColor="text-[#F9A825]"
              />
            </div>
          </div>

          <AttendanceChart
            data={weeklyAttendanceMetrics} currentFilter={timeFilter} isDropdownOpen={isDropdownOpen} setIsDropdownOpen={setIsDropdownOpen}
            setTimeFilter={setTimeFilter} customStartDate={customStartDate} setCustomStartDate={setCustomStartDate} customEndDate={customEndDate} setCustomEndDate={setCustomEndDate}
          />
        </div>

        {/* RIGHT SIDEBAR PANEL */}
        <div className="col-span-3 space-y-6 flex flex-col h-fit">
          {/* COMPONENT MODULE: BULLETIN SYSTEM FEED (NOW CLEANLY SPANS ENTIRE SIDEBAR GRID) */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#F9A825] text-sm tracking-tight flex items-center gap-1.5">
                <Megaphone size={14} /> Bulletin Stream
              </h3>
            </div>

            <div className="flex-1 space-y-1">
              {news.slice(0, 3).map((item, index) => (
                <NewsCard
                  key={item.id} id={item.id} isFeatured={index === 0} title={item.title} description={item.description}
                  time={item.time} image={item.image} status={item.status} startDate={item.startDate} endDate={item.endDate} linkUrl={item.linkUrl}
                  videoUrl={item.videoUrl} fileUrl={item.fileUrl}
                  onClick={(post) => {
                    setActiveViewPost(post);
                    setShowMultimedia(false);
                  }}
                />
              ))}
              {news.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No recent announcements found.</p>}
            </div>

            <button
              onClick={() => navigate('/news')}
              className="mt-4 pt-3 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-gray-600 font-bold text-[11px] hover:text-[#F9A825] transition-colors group border-0 outline-none bg-transparent cursor-pointer"
            >
              Enter Repository Console View
              <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================= */}
      {/* MULTIMEDIA FLOATING READER PORTAL INTERFACE */}
      {/* ========================================================= */}
      {activeViewPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-50 relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <style>{`div::-webkit-scrollbar { display: none; }`}</style>

            <button type="button" onClick={() => setActiveViewPost(null)} className="absolute right-5 top-5 z-20 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors outline-none border-0 cursor-pointer">
              <X size={15} />
            </button>

            {/* VISUAL CONTROLLER HEADER BLOCK */}
            <div className="w-full bg-gray-950 overflow-hidden relative">
              <img
                src={activeViewPost.imageUrl || activeViewPost.image}
                alt="Feature Cover Banner"
                className="w-full h-44 object-cover animate-in fade-in duration-300"
              />
            </div>

            <div className="p-6 flex flex-col flex-1 overflow-y-auto space-y-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex justify-between items-center">
                <span className="bg-amber-50 text-amber-600 font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-amber-100">
                  {activeViewPost.status}
                </span>
                {activeViewPost.startDate && (
                  <span className="text-[10px] text-gray-400 font-mono font-bold">
                    🗓️ Horizon: {activeViewPost.startDate}
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-gray-800 leading-tight tracking-tight">{activeViewPost.title}</h3>
              </div>

              <p className="text-xs font-medium text-gray-500 leading-relaxed text-justify opacity-90">
                {activeViewPost.description}
              </p>

              {/* DYNAMIC ATTACHMENTS ACCORDION PANEL */}
              {(activeViewPost.videoUrl || activeViewPost.fileUrl) && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowMultimedia(!showMultimedia)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 hover:text-amber-800 border border-amber-200 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                  >
                    <svg
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${showMultimedia ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                    </svg>
                    {showMultimedia ? 'Hide System Assets' : 'Show Attached Multimedia Files'}
                  </button>

                  {showMultimedia && (
                    <div className="mt-3 space-y-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl animate-in slide-in-from-top-3 duration-200">

                      {/* Video Container Component */}
                      {activeViewPost.videoUrl && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 flex items-center gap-1"><Video size={11} /> Attached Video Stream</span>
                          <div className="rounded-xl overflow-hidden bg-black shadow-inner">
                            <video
                              src={activeViewPost.videoUrl}
                              controls
                              className="w-full max-h-40 object-contain aspect-video"
                            />
                          </div>
                        </div>
                      )}

                      {/* PDF Custom Local Stream Saving Block */}
                      {activeViewPost.fileUrl && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-black tracking-wider uppercase text-slate-400 block">Reference Documentation</span>
                          <a
                            href={activeViewPost.fileUrl}
                            onClick={(e) => handleDownloadFile(e, activeViewPost.fileUrl)}
                            className="flex items-center justify-between p-3 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl border border-gray-100 transition-colors text-xs font-bold no-underline outline-none cursor-pointer shadow-sm group"
                          >
                            <div className="flex items-center gap-2 max-w-[85%]">
                              <FileText size={15} className="text-emerald-600 flex-shrink-0" />
                              <span className="truncate font-mono text-[11px] text-emerald-900">
                                Download Brief Material (PDF)
                              </span>
                            </div>
                            <FileDown size={15} className="text-emerald-600 flex-shrink-0 transition-transform group-hover:translate-y-0.5" />
                          </a>
                        </div>
                      )}

                    </div>
                  )}
                </div>
              )}

              {activeViewPost.linkUrl && (
                <a
                  href={activeViewPost.linkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 text-center text-xs font-bold py-3 rounded-xl border border-gray-200 transition-colors flex items-center justify-center gap-1.5 decoration-none outline-none mt-1 shadow-sm"
                >
                  Visit Resource Reference Channel <ExternalLink size={13} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardPage;