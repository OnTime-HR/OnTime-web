import React from 'react';
import AttendanceChart from '../../components/dashboard/AttendanceChart';
import StatCard from '../../components/dashboard/StatCard';
import NewsCard from '../../components/dashboard/NewsCard';
import { Users, FileText, AlertTriangle } from 'lucide-react';

const DashboardPage = () => {
  return (
    /**
     * Padding top is handled by the Layout (pt-24). 
     * We use p-10 to match the spacious Figma margins.
     */
    <div className="p-10">
      
      <div className="grid grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Stats and Analytics */}
        <div className="col-span-9 space-y-8">
          
          {/* Stat Cards Row */}
          <div className="flex gap-8">
            <StatCard 
              label="Total Employees Present" 
              value="142" 
              subtext="vs 138 yesterday" 
              icon={<Users className="text-blue-600" size={20}/>} 
              iconBg="bg-blue-50" 
              textColor="text-[#F9A825]" 
            />
            <StatCard 
              label="Pending Leave Requests" 
              value="8" 
              subtext="Requires immediate attention" 
              icon={<FileText className="text-orange-600" size={20}/>} 
              iconBg="bg-orange-50" 
              textColor="text-[#F9A825]" 
            />
            <StatCard 
              label="Active Alerts" 
              value="3" 
              subtext="System health check normal" 
              icon={<AlertTriangle className="text-red-600" size={20}/>} 
              iconBg="bg-red-50" 
              textColor="text-[#F9A825]" 
            />
          </div>

          {/* Attendance Chart Section */}
          <AttendanceChart />
        </div>

        {/* RIGHT COLUMN: News & Announcements Sidebar */}
        <div className="col-span-3 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-fit">
          
          {/* Header Section: Matches Admin Analytics & News Hub (1).png */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#F9A825] text-base leading-tight">
              News &<br />Announcements
            </h3>
            
            <button className="bg-[#F9A825] text-white px-3 py-2 rounded-lg flex items-center gap-2 shadow-sm hover:bg-orange-500 transition-colors">
              <span className="text-sm font-light">+</span>
              <div className="flex flex-col items-start leading-none">
                <span className="text-[9px] font-bold uppercase">New</span>
                <span className="text-[9px] font-bold uppercase">Post</span>
              </div>
            </button>
          </div>

          {/* News List Content */}
          <div className="flex-1">
            <NewsCard 
              isFeatured={true}
              title="Q4 Strategy Meeting"
              description="Mandatory attendance for all department heads on Friday, 25th Oct."
              image="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg"
            />

            <NewsCard 
              title="New HR Polic..."
              time="2h ago"
              description="We have updated the remote work policy to include flexible..."
              image="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg"
            />
          </div>

          {/* Footer Section */}
          <button className="mt-4 pt-4 border-t border-gray-50 w-full flex items-center justify-center gap-2 text-gray-600 font-bold text-[12px] hover:text-[#F9A825] transition-colors group">
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