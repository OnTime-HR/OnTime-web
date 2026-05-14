import React, { useState, useEffect } from 'react';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import StatCard from '../../components/dashboard/StatCard';
import NewsCard from '../../components/dashboard/NewsCard';
import { Users, FileText, AlertTriangle } from 'lucide-react';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore';
import NewPostModal from '../../components/dashboard/NewPostModal'; // Import the modal

const DashboardPage = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [pendingLeaves, setPendingLeaves] = useState(0);
  const [news, setNews] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Total Employees (Count from users collection where role is Employee)
    const qUsers = query(collection(db, "users"), where("role", "==", "Employee"));
    const unsubUsers = onSnapshot(qUsers, (snap) => setEmployeeCount(snap.size));

    // 2. Pending Leaves (Count from leave_requests where status is pending)
    const qLeaves = query(
      collection(db, "leave_requests"),
      where("status", "==", "Pending") // Fixed casing to match image_a2e692.jpg
    );

    const unsubLeaves = onSnapshot(qLeaves, (snap) => {
      console.log("Pending leaves found:", snap.size); // Check your console to verify
      setPendingLeaves(snap.size);
    });

    // 3. Company News (Latest 3 items from company_news)
    const qNews = query(collection(db, "company_news"), orderBy("createdAt", "desc"), limit(3));
    const unsubNews = onSnapshot(qNews, (snap) => {
      setNews(snap.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title,
        description: doc.data().description,
        tag: doc.data().tag,
        // Using a placeholder image if imageUrl isn't in your Firestore document yet
        image: doc.data().imageUrl || "https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg",
        time: doc.data().createdAt?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })));
    });

    return () => {
      unsubUsers();
      unsubLeaves();
      unsubNews();
    };
  }, []);

  return (
    <div className="p-10">
      <NewPostModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      <div className="grid grid-cols-12 gap-8">

        {/* LEFT COLUMN: Stats and Analytics */}
        <div className="col-span-9 space-y-8">

          {/* Stat Cards Row - Now using live values from Firebase */}
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
              value="0" // You can create an 'alerts' collection later to map this
              subtext="System health check normal"
              icon={<AlertTriangle className="text-red-600" size={20} />}
              iconBg="bg-red-50"
              textColor="text-[#F9A825]"
            />
          </div>

          <AttendanceChart />
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

          {/* News List Content - Mapping from 'news' state variable */}
          <div className="flex-1 space-y-4">
            {news.map((item, index) => (
              <NewsCard
                key={item.id}
                isFeatured={index === 0} // First item is the featured banner
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
            <svg
              className="w-4 h-4 transition-transform group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;