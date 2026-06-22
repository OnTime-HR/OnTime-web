// src/pages/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import StatCard from '../../components/dashboard/StatCard';
import NewsCard from '../../components/dashboard/NewsCard';
import { Users, FileText, Calendar as CalendarIcon, ExternalLink, Megaphone, X } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { getSystemUserCounts } from '../../services/employeeService';

const DashboardPage = () => {
  const navigate = useNavigate();

  const [userCounts, setUserCounts] = useState({ employees: 0, managers: 0, admins: 0 });
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [news, setNews] = useState([]);
  
  // POPUP CONSOLE OVERLAY SELECTION STATE
  const [activeViewPost, setActiveViewPost] = useState(null);

  // ATTENDANCE STREAMING LOGIC LABELS
  const [rawAttendanceLogs, setRawAttendanceLogs] = useState([]);
  const [weeklyAttendanceMetrics, setWeeklyAttendanceMetrics] = useState([]);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

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

    // 3. Monitor Company Bulletin Streams
    const qNews = query(collection(db, "company_news"), orderBy("createdAt", "desc"), limit(5));
    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        status: doc.data().status || 'Active',
        startDate: doc.data().startDate || '',
        endDate: doc.data().endDate || '',
        linkUrl: doc.data().linkUrl || '',
        image: doc.data().imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        time: doc.data().createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) || 'Recent'
      })));
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
      startOfWeek.setHours(0,0,0,0);

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

  // =========================================================
  // BACKEND RECENT DATES CHRONOLOGICAL SORT ENGINE FOR CALENDAR
  // =========================================================
  const calendarEvents = [...news]
    .filter(n => (n.status === 'Upcoming' || n.status === 'Ongoing') && n.startDate)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
    .map(evt => {
      const displayDate = evt.startDate 
        ? new Date(evt.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'TBD';
      return { ...evt, formattedStartDate: displayDate };
    })
    .slice(0, 3); // Extract the top 3 items to preserve view scalability grids

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
          
          {/* COMPONENT MODULE: OPERATIONAL EVENTS CALENDAR MATRIX */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-4">
              <CalendarIcon size={14} className="text-[#F9A825]" /> Upcoming Corporate Roadmap
            </h4>
            <div className="space-y-3">
              {calendarEvents.map(evt => (
                <div 
                  key={`cal-${evt.id}`} 
                  className="p-3 bg-amber-50/40 border border-amber-100/40 rounded-xl flex flex-col gap-1 hover:bg-amber-50 transition-all cursor-pointer transform hover:translate-x-0.5" 
                  onClick={() => setActiveViewPost(evt)}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded shadow-sm ${
                      evt.status === 'Ongoing' ? 'bg-blue-500 text-white' : 'bg-amber-500 text-white'
                    }`}>
                      {evt.status}
                    </span>
                    <span className="text-[9px] font-bold text-amber-700 bg-amber-100/60 px-2 py-0.5 rounded-md font-mono">
                      {evt.formattedStartDate || evt.startDate}
                    </span>
                  </div>
                  <h5 className="text-xs font-bold text-gray-800 line-clamp-1 leading-tight mt-1.5">{evt.title}</h5>
                </div>
              ))}
              {calendarEvents.length === 0 && (
                <p className="text-[10px] text-gray-400 text-center py-4 font-medium">No system milestone events scheduled.</p>
              )}
            </div>
          </div>

          {/* COMPONENT MODULE: BULLETIN SYSTEM FEED */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-[#F9A825] text-sm tracking-tight flex items-center gap-1.5">
                <Megaphone size={14}/> Bulletin Stream
              </h3>
            </div>

            <div className="flex-1 space-y-1">
              {news.slice(0, 3).map((item, index) => (
                <NewsCard
                  key={item.id} id={item.id} isFeatured={index === 0} title={item.title} description={item.description}
                  time={item.time} image={item.image} status={item.status} startDate={item.startDate} endDate={item.endDate} linkUrl={item.linkUrl}
                  onClick={(post) => setActiveViewPost(post)}
                />
              ))}
              {news.length === 0 && <p className="text-xs text-gray-400 text-center py-4">No recent announcements found.</p>}
            </div>

            <button 
              onClick={() => navigate('/news')}
              className="mt-4 pt-3 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-gray-600 font-bold text-[11px] hover:text-[#F9A825] transition-colors group"
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
      {/* PREMIUM READ-ONLY INFORMATION OVERLAY INSPECTOR MODAL */}
      {/* ========================================================= */}
      {activeViewPost && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md overflow-hidden shadow-2xl border border-gray-50 relative flex flex-col animate-in zoom-in-95 duration-150">
            <button type="button" onClick={() => setActiveViewPost(null)} className="absolute right-5 top-5 z-10 bg-black/40 hover:bg-black/60 text-white p-2 rounded-full transition-colors outline-none">
              <X size={16} />
            </button>
            <div className="w-full h-44 relative">
              <img src={activeViewPost.imageUrl || activeViewPost.image} alt="Cover Banner" className="w-full h-full object-cover" />
              <div className="absolute top-4 left-4 bg-[#F9A825] text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md shadow-md">
                {activeViewPost.status}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                {activeViewPost.startDate && (
                  <p className="text-[10px] text-amber-600 font-bold tracking-wide uppercase font-mono mb-1">
                    🗓️ Schedule: {activeViewPost.startDate} {activeViewPost.endDate ? `to ${activeViewPost.endDate}` : ''}
                  </p>
                )}
                <h3 className="text-lg font-black text-gray-900 leading-tight">{activeViewPost.title}</h3>
              </div>
              <p className="text-xs font-medium text-gray-500 leading-relaxed max-h-40 overflow-y-auto pr-1">
                {activeViewPost.description}
              </p>
              {activeViewPost.linkUrl && (
                <a 
                  href={activeViewPost.linkUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-2 text-xs font-bold text-[#F9A825] hover:text-orange-600 transition-colors group mt-2"
                >
                  Access Reference Link Material <ExternalLink size={14} className="transition-transform group-hover:translate-x-0.5" />
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