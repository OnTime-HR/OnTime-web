import Topbar from "../../components/dashboard/Topbar";

import StatCard from "../../components/dashboard/StatCard";

import AttendanceChart from "../../components/dashboard/AttendanceChart";

import NewsCard from "../../components/dashboard/NewsCard";

import {
  Users,
  ClipboardList,
  TriangleAlert,
} from "lucide-react";

const DashboardPage = () => {
  return (
    <>
      {/* Topbar */}
      <Topbar />

      {/* Main Content */}
      <div className="p-8">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">

          <StatCard
            title="Total Employees Present"
            value="142"
            subtitle="vs 138 yesterday"
            icon={
              <Users
                size={26}
                className="text-blue-500"
              />
            }
            iconBg="bg-blue-100"
            valueColor="text-orange-500"
          />

          <StatCard
            title="Pending Leave Requests"
            value="8"
            subtitle="Requires immediate attention"
            icon={
              <ClipboardList
                size={26}
                className="text-orange-500"
              />
            }
            iconBg="bg-orange-100"
            valueColor="text-orange-500"
          />

          <StatCard
            title="Active Alerts"
            value="3"
            subtitle="System health check normal"
            icon={
              <TriangleAlert
                size={26}
                className="text-red-500"
              />
            }
            iconBg="bg-red-100"
            valueColor="text-orange-500"
          />

        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-3 gap-6 mt-6">

          {/* Chart */}
          <div className="col-span-2">

            <AttendanceChart />

          </div>

          {/* News */}
          <NewsCard />

        </div>

      </div>
    </>
  );
};

export default DashboardPage;