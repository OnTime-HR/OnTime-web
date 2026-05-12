import {
  LayoutDashboard,
  Users,
  MapPinned,
  CircleCheckBig,
  Newspaper,
  Settings,
  LogOut,
} from "lucide-react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    active: true,
  },
  {
    title: "User and Role Management",
    icon: Users,
  },
  {
    title: "Geofencing and Operations",
    icon: MapPinned,
  },
  {
    title: "Approvals and Reports",
    icon: CircleCheckBig,
  },
  {
    title: "News & Events",
    icon: Newspaper,
  },
  {
    title: "Settings",
    icon: Settings,
  },
];

const Sidebar = () => {
  return (
    <div className="w-[290px] min-h-screen bg-white border-r border-gray-200 flex flex-col justify-between">

      {/* Top */}
      <div>

        {/* Logo */}
        <div className="p-6 border-b border-gray-100">

          <div className="flex items-center gap-3">

            <div className="w-12 h-12 rounded-full bg-orange-200 flex items-center justify-center">

              <div className="w-2 h-2 rounded-full bg-white" />

            </div>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin Panel
              </h1>

              <p className="text-sm text-gray-500">
                Management Console
              </p>
            </div>

          </div>

        </div>

        {/* Menu */}
        <div className="p-4 space-y-2">

          {menuItems.map((item, index) => {

            const Icon = item.icon;

            return (
              <button
                key={index}
                className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl transition-all duration-200
                ${
                  item.active
                    ? "bg-orange-100 text-orange-500 shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >

                <Icon size={20} />

                <span className="font-medium text-[15px]">
                  {item.title}
                </span>

              </button>
            );
          })}

        </div>

      </div>

      {/* Bottom */}
      <div className="p-6">

        <button className="flex items-center gap-3 text-red-500">

          <LogOut size={20} />

          <span className="font-medium">
            Log Out
          </span>

        </button>

      </div>

    </div>
  );
};

export default Sidebar;