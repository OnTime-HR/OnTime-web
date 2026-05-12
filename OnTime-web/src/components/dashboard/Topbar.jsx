import { Search, Bell } from "lucide-react";

const Topbar = () => {
  return (
    <div className="flex items-center justify-between px-8 py-6 bg-[#F5F5F7] border-b border-gray-200">

      {/* Left */}
      <div>

        <h1 className="text-5xl font-bold text-gray-900">
          Dashboard
        </h1>

        <p className="text-gray-500 mt-2 text-lg">
          Real-time operational metrics and announcements
        </p>

      </div>

      {/* Right */}
      <div className="flex items-center gap-5">

        {/* Search */}
        <div className="flex items-center gap-3 bg-orange-500 px-5 py-4 rounded-full shadow-lg w-[320px]">

          <Search size={20} className="text-white" />

          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-white placeholder:text-white w-full"
          />

        </div>

        {/* Notification */}
        <button className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center shadow-sm">

          <Bell size={20} className="text-orange-500" />

        </button>

      </div>

    </div>
  );
};

export default Topbar;