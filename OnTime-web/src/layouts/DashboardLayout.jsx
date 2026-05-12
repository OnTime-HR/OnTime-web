import Sidebar from "../components/dashboard/Sidebar";

const DashboardLayout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-[#F5F5F7]">

      {/* Sidebar */}
      <Sidebar />

      {/* Main */}
      <div className="flex-1 overflow-auto">

        {children}

      </div>

    </div>
  );
};

export default DashboardLayout;