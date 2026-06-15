// src/pages/dashboard/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import StatCard from '../../components/dashboard/StatCard';
import NewsCard from '../../components/dashboard/NewsCard';
import { Users, FileText } from 'lucide-react';
import { db } from '../../services/firebase';
// NEW: Imported collectionGroup
import { collection, onSnapshot, query, where, orderBy, limit, collectionGroup } from 'firebase/firestore';
import { getSystemUserCounts } from '../../services/employeeService';

const DashboardPage = () => {
  const navigate = useNavigate();

  const [userCounts, setUserCounts] = useState({ employees: 0, managers: 0, admins: 0 });
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [news, setNews] = useState([]);
  
  // LIVE ATTENDANCE STATES & CUSTOM FILTER DROPDOWN TOGGLES
  const [rawAttendanceLogs, setRawAttendanceLogs] = useState([]);
  const [weeklyAttendanceMetrics, setWeeklyAttendanceMetrics] = useState([]);
  const [timeFilter, setTimeFilter] = useState('This Week');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // State for Custom Date Range
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    // 1. Fetch User Counts
    const fetchCounts = async () => {
      const counts = await getSystemUserCounts();
      setUserCounts(counts);
    };
    fetchCounts();

    // 2. Pending Leaves
    const qLeaves = query(collection(db, "leave_requests"), where("status", "==", "Pending"));
    const unsubLeaves = onSnapshot(qLeaves, (snap) => setPendingLeaves(snap.size));

    // 3. Company News
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

    // 4. Real-time Attendance Stream (UPDATED TO USE COLLECTION GROUP)
    // This searches ALL attendance subcollections across the entire database
    const qAttendance = query(
      collectionGroup(db, "attendance"),
      where("status", "==", "Present")
    );

    const unsubAttendance = onSnapshot(qAttendance, (snapshot) => {
      const logs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        let parsedDate = new Date();

        if (data.date) {
          // Splitting the date string forces JavaScript to parse it in Local Time 
          // instead of accidentally shifting it backwards to yesterday due to UTC offsets
          const [year, month, day] = data.date.split('-');
          parsedDate = new Date(year, month - 1, day);
        } else if (data.createdAt) {
          parsedDate = typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate() : new Date(data.createdAt);
        }

        return { id: docSnap.id, ...data, dateObject: parsedDate };
      });
      
      setRawAttendanceLogs(logs);
    }, (error) => {
      // If Firebase needs an index, it will throw an error here with a direct blue link.
      console.error("Firebase Index Required. Please click the link to build it:", error);
    });

    return () => {
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
    
    else if (timeFilter === 'Custom Range' && customStartDate && customEndDate) {
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);

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
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg mr-3">
                  <Users size={20} />
                </div>
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
                label="Pending Leaves"
                value={pendingLeaves}
                subtext="Requires approval"
                icon={<FileText className="text-orange-600" size={20} />}
                iconBg="bg-orange-50"
                textColor="text-[#F9A825]"
              />
            </div>
          </div>

          <AttendanceChart 
            data={weeklyAttendanceMetrics} 
            currentFilter={timeFilter}
            isDropdownOpen={isDropdownOpen}
            setIsDropdownOpen={setIsDropdownOpen}
            setTimeFilter={setTimeFilter}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
          />
        </div>

        <div className="col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-fit">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#F9A825] text-base leading-tight">
              News & Announcements
            </h3>
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

          <button 
            onClick={() => navigate('/news')}
            className="mt-6 pt-4 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-gray-600 font-bold text-[12px] hover:text-[#F9A825] transition-colors group"
          >
            View All
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