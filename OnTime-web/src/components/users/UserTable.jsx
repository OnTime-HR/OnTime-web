import React from 'react';
import { Search, ChevronDown, MoreVertical, ShieldAlert, Users, List, ChevronLeft, ChevronRight } from 'lucide-react';

const mockUsers = [
  {
    id: 1,
    name: 'Sarah Jenkins',
    email: 'sarah.j@company.com',
    initials: 'SJ',
    color: 'bg-pink-500',
    role: 'Admin',
    roleIcon: <ShieldAlert size={16} className="text-purple-500 mr-2" />,
    status: 'Active',
    lastActive: '2 mins ago'
  },
  {
    id: 2,
    name: 'Mike Ross',
    email: 'mike.r@company.com',
    initials: 'MR',
    color: 'bg-blue-800',
    role: 'Manager',
    roleIcon: <Users size={16} className="text-blue-500 mr-2" />,
    status: 'Active',
    lastActive: '1 hour ago'
  },
  {
    id: 3,
    name: 'Louis Litt',
    email: 'louis.l@company.com',
    initials: 'LL',
    color: 'bg-teal-500',
    role: 'Editor',
    roleIcon: <List size={16} className="text-green-500 mr-2" />,
    status: 'Pending',
    lastActive: 'Yesterday'
  },
  {
    id: 4,
    name: 'Harvey Specter',
    email: 'harvey.s@company.com',
    initials: 'HS',
    color: 'bg-gray-800',
    role: 'Manager',
    roleIcon: <Users size={16} className="text-blue-500 mr-2" />,
    status: 'Inactive',
    lastActive: 'Yesterday'
  }
];

const StatusPill = ({ status }) => {
  let colorClass = '';
  switch (status) {
    case 'Active':
      colorClass = 'bg-green-100 text-green-600 border border-green-200';
      break;
    case 'Pending':
      colorClass = 'bg-orange-100 text-orange-600 border border-orange-200';
      break;
    case 'Inactive':
      colorClass = 'bg-red-100 text-red-600 border border-red-200';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-600 border border-gray-200';
  }
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClass}`}>
      {status}
    </span>
  );
};

const UserTable = () => {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Controls */}
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name, email, or role..." 
            className="w-full bg-[#F9A825] text-white placeholder-orange-100 rounded-lg pl-10 pr-4 py-3 outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 text-white" size={18} />
        </div>
        <div className="flex gap-4">
          <button className="flex items-center justify-between bg-[#F9A825] text-white px-4 py-3 rounded-lg w-36 shadow-sm font-medium">
            All Roles <ChevronDown size={18} />
          </button>
          <button className="flex items-center justify-between bg-[#F9A825] text-white px-4 py-3 rounded-lg w-36 shadow-sm font-medium">
            All Status <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FFF8ED] text-gray-800 text-sm border-b border-[#F9E8D2]">
              <th className="py-4 px-6 font-bold w-12">
                <input type="checkbox" className="w-4 h-4 rounded bg-gray-900 border-transparent accent-gray-900" />
              </th>
              <th className="py-4 px-6 font-bold">EMPLOYEE</th>
              <th className="py-4 px-6 font-bold">ROLE</th>
              <th className="py-4 px-6 font-bold">STATUS</th>
              <th className="py-4 px-6 font-bold">LAST ACTIVE</th>
              <th className="py-4 px-6 font-bold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {mockUsers.map((user, index) => (
              <tr key={user.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors`}>
                <td className="py-4 px-6">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#F9A825] focus:ring-[#F9A825]" />
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.color}`}>
                      {user.initials}
                    </div>
                    <div>
                      <p className="text-[#F9A825] font-bold">{user.name}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="py-4 px-6">
                  <div className="flex items-center text-gray-700 font-medium text-sm">
                    {user.roleIcon}
                    {user.role}
                  </div>
                </td>
                <td className="py-4 px-6">
                  <StatusPill status={user.status} />
                </td>
                <td className="py-4 px-6 text-gray-500 text-sm">
                  {user.lastActive}
                </td>
                <td className="py-4 px-6 text-right">
                  <button className="text-gray-400 hover:text-gray-600 p-1">
                    <MoreVertical size={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 flex items-center justify-between border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-700">1</span> to <span className="font-bold text-[#F9A825]">5</span> of <span className="font-bold text-[#F9A825]">128</span> results
        </p>
        <div className="flex items-center gap-1">
          <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
            <ChevronLeft size={16} />
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded bg-[#F9A825] text-white font-medium">
            1
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
            2
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
            3
          </button>
          <span className="w-8 h-8 flex items-center justify-center text-gray-400">...</span>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-600 hover:bg-gray-50">
            12
          </button>
          <button className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
