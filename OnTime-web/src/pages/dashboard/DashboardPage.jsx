// src/pages/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import StatCard from '../../components/dashboard/StatCard';
import NewsCard from '../../components/dashboard/NewsCard';
import { Users, FileText, AlertTriangle } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import NewPostModal from '../../components/dashboard/NewPostModal';

const DashboardPage = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [news, setNews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // LIVE ATTENDANCE STATES & CUSTOM FILTER DROPDOWN TOGGLES
  const [rawAttendanceLogs, setRawAttendanceLogs] = useState([]);
  const [weeklyAttendanceMetrics, setWeeklyAttendanceMetrics] = useState([]);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    // 1. Total Employees (Count from users collection where role is Employee)
    const qUsers = query(collection(db, "users"), where("role", "==", "Employee"));
    const unsubUsers = onSnapshot(qUsers, (snap) => setEmployeeCount(snap.size));

    // 2. Pending Leaves (Count from leave_requests where status is pending)
    const qLeaves = query(collection(db, "leave_requests"), where("status", "==", "Pending"));
    const unsubLeaves = onSnapshot(qLeaves, (snap) => setPendingLeaves(snap.size));

    // 3. Company News (Latest 3 items from company_news)
    const qNews = query(collection(db, "company_news"), orderBy("createdAt", "desc"), limit(3));
    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        tag: doc.data().tag,
        image: doc.data().imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        time: doc.data().createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    });

    // 4. Real-time Attendance Collection Listener Stream
    const attendanceRef = collection(db, "attendance");
    const unsubAttendance = onSnapshot(attendanceRef, (snapshot) => {
      const logs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let parsedDate = new Date();

        if (data.date) {
          parsedDate = typeof data.date.toDate === 'function' ? data.date.toDate() : new Date(data.date);
        } else if (data.createdAt) {
          parsedDate = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt);
        }

        return { id: docSnap.id, ...data, dateObject: parsedDate };
      });
      
      setRawAttendanceLogs(logs);
    });

    return () => {
      unsubUsers();
      unsubLeaves();
      unsubNews();
      unsubAttendance();
    };
  }, []);

  // 5. CALCULATE GRAPH SECTIONS EVERY TIME THE TIME FILTER SELECTION MUTATES
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
  }, [timeFilter, rawAttendanceLogs]);

  return (
    <div className="p-10">
      <NewPostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="grid grid-cols-12 gap-8">
        {/* LEFT COLUMN: Stats and Analytics */}
        <div className="col-span-9 space-y-8">
          
          {/* Stat Cards Row */}
          <div className="flex gap-8">
            <StatCard
              label="Total Employees"
              value={employeeCount}
              subtext="Registered staff members"
              icon={<Users className="text-blue-600" size={20} />}
              iconBg="bg-blue-50"
              textColor="text-[#F9A825]"
            />
            <StatCard
              label="Pending Leave Requests"
              value={pendingLeaves}
              subtext="Requires admin approval"
              icon={<FileText className="text-orange-600" size={20} />}
              iconBg="bg-orange-50"
              textColor="text-[#F9A825]"
            />
            <StatCard
              label="Active Alerts"
              value="0"
              subtext="System health check normal"
              icon={<AlertTriangle className="text-red-600" size={20} />}
              iconBg="bg-red-50"
              textColor="text-[#F9A825]"
            />
          </div>

          {/* CLEAN CONSOLE RENDER CALL: Pass hooks down directly, no outer card wrapper elements here! */}
          <AttendanceChart 
            data={weeklyAttendanceMetrics} 
            currentFilter={timeFilter}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            setTimeFilter={setTimeFilter}
          />
        </div>

        {/* RIGHT COLUMN: News & Announcements Sidebar */}
        <div className="col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#F9A825] text-base leading-tight">
              News &<br />Announcements
            </h3>

            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#F9A825] text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-orange-500 transition-colors"
            >
              <span className="text-sm font-light">+</span>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-bold uppercase">New</span>
                <span className="text-[9px] font-bold uppercase">Post</span>
              </div>
            </button>
          </div>

          <div className="flex-1 space-y-4">
            {news.map((item, index) => (
              <NewsCard
                key={item.id}
                isFeatured={index === 0}
                title={item.title}
                description={item.description}
                time={item.time}
                image={item.image}
              />
            ))}

            {news.length === 0 && (
              <p className="text-xs text-gray-400 text-center py-4">No recent announcements</p>
            )}
          </div>

          <button className="mt-6 pt-4 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-gray-600 font-bold text-[12px] hover:text-[#F9A825] transition-colors group">
            View Archived News
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;