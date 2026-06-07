import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronDown, MoreVertical, ShieldAlert, Users, List, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { updateUserRole, updateUserStatus, deleteUser } from '../../services/employeeService';
import toast from 'react-hot-toast';

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

const getRoleIcon = (role) => {
  switch (role) {
    case 'Admin':
      return <ShieldAlert size={16} className="text-purple-500 mr-2" />;
    case 'Manager':
      return <Users size={16} className="text-blue-500 mr-2" />;
    case 'Editor':
      return <List size={16} className="text-green-500 mr-2" />;
    default:
      return <List size={16} className="text-gray-500 mr-2" />;
  }
};

const colors = ['bg-pink-500', 'bg-blue-800', 'bg-teal-500', 'bg-gray-800', 'bg-purple-600', 'bg-orange-500', 'bg-red-500', 'bg-indigo-600'];
const getBgColor = (name) => {
  if (!name) return 'bg-gray-500';
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const UserTable = ({ employees = [], loading }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('All');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMenuUserId, setOpenMenuUserId] = useState(null);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  
  const itemsPerPage = 5;
  const menuRef = useRef(null);

  // Close actions menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuUserId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedRoleFilter, selectedStatusFilter]);

  // Handle selections
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredEmployees.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleSelectUser = (userId) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  // Actions
  const handleRoleChange = async (userId, newRole) => {
    setOpenMenuUserId(null);
    const loadingToast = toast.loading(`Updating role to ${newRole}...`);
    try {
      await updateUserRole(userId, newRole);
      toast.success("Role updated successfully!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to update role: " + error.message, { id: loadingToast });
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    setOpenMenuUserId(null);
    const loadingToast = toast.loading(`Updating status to ${newStatus}...`);
    try {
      await updateUserStatus(userId, newStatus);
      toast.success("Status updated successfully!", { id: loadingToast });
    } catch (error) {
      toast.error("Failed to update status: " + error.message, { id: loadingToast });
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    setOpenMenuUserId(null);
    if (window.confirm(`Are you sure you want to remove ${userName || 'this employee'}?`)) {
      const loadingToast = toast.loading("Deleting employee...");
      try {
        await deleteUser(userId);
        toast.success("Employee removed successfully!", { id: loadingToast });
      } catch (error) {
        toast.error("Failed to delete employee: " + error.message, { id: loadingToast });
      }
    }
  };

  // Filter employees
  const filteredEmployees = employees.filter(user => {
    const nameMatch = user.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = user.role?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSearch = nameMatch || emailMatch || roleMatch;
    
    const matchesRole = selectedRoleFilter === 'All' || user.role === selectedRoleFilter;
    const matchesStatus = selectedStatusFilter === 'All' || user.status === selectedStatusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredEmployees.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, filteredEmployees.length);
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Table Controls */}
      <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-50">
        <div className="relative w-full md:w-96">
          <input 
            type="text" 
            placeholder="Search by name, email, or role..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#F9A825] text-white placeholder-orange-100 rounded-lg pl-10 pr-4 py-3 outline-none shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 text-white" size={18} />
        </div>
        <div className="flex gap-4">
          <div className="relative">
            <select 
              value={selectedRoleFilter}
              onChange={(e) => setSelectedRoleFilter(e.target.value)}
              className="appearance-none bg-[#F9A825] text-white px-4 py-3 pr-10 rounded-lg w-36 shadow-sm font-medium outline-none cursor-pointer"
            >
              <option value="All">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Editor">Editor</option>
              <option value="Employee">Employee</option>
              <option value="Viewer">Viewer</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-white pointer-events-none" size={18} />
          </div>

          <div className="relative">
            <select 
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="appearance-none bg-[#F9A825] text-white px-4 py-3 pr-10 rounded-lg w-36 shadow-sm font-medium outline-none cursor-pointer"
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Inactive">Inactive</option>
            </select>
            <ChevronDown className="absolute right-3 top-3.5 text-white pointer-events-none" size={18} />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FFF8ED] text-gray-800 text-sm border-b border-[#F9E8D2]">
              <th className="py-4 px-6 font-bold w-12">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={filteredEmployees.length > 0 && selectedUserIds.length === filteredEmployees.length}
                  className="w-4 h-4 rounded bg-gray-900 border-transparent accent-gray-900 cursor-pointer" 
                />
              </th>
              <th className="py-4 px-6 font-bold">EMPLOYEE</th>
              <th className="py-4 px-6 font-bold">ROLE</th>
              <th className="py-4 px-6 font-bold">STATUS</th>
              <th className="py-4 px-6 font-bold">LAST ACTIVE</th>
              <th className="py-4 px-6 font-bold text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="animate-spin text-[#F9A825]" size={20} />
                    <span>Loading employees...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 text-center text-gray-400">
                  No employees found matching the filters.
                </td>
              </tr>
            ) : (
              paginatedEmployees.map((user) => {
                const initials = user.name
                  ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)
                  : 'EE';
                const avatarColor = getBgColor(user.name);

                return (
                  <tr key={user.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-6">
                      <input 
                        type="checkbox" 
                        checked={selectedUserIds.includes(user.id)}
                        onChange={() => handleSelectUser(user.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#F9A825] focus:ring-[#F9A825] cursor-pointer" 
                      />
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${avatarColor}`}>
                          {initials}
                        </div>
                        <div>
                          <p className="text-[#F9A825] font-bold">{user.name}</p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-gray-700 font-medium text-sm">
                        {getRoleIcon(user.role)}
                        {user.role || 'Employee'}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusPill status={user.status} />
                    </td>
                    <td className="py-4 px-6 text-gray-500 text-sm">
                      {user.lastActiveStr || 'Never'}
                    </td>
                    <td className="py-4 px-6 text-right relative">
                      <button 
                        onClick={() => setOpenMenuUserId(openMenuUserId === user.id ? null : user.id)}
                        className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {openMenuUserId === user.id && (
                        <div 
                          ref={menuRef} 
                          className="absolute right-6 mt-1 w-48 bg-white border border-gray-100 rounded-xl shadow-xl z-50 p-2 text-left"
                        >
                          <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Change Role</div>
                          {['Admin', 'Manager', 'Editor', 'Employee', 'Viewer'].map((r) => (
                            <button 
                              key={r}
                              onClick={() => handleRoleChange(user.id, r)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer ${user.role === r ? 'text-[#F9A825] bg-orange-50/50' : 'text-gray-600'}`}
                            >
                              {r}
                            </button>
                          ))}
                          <div className="border-t border-gray-100 my-1"></div>
                          <div className="px-3 py-1 text-[9px] font-bold text-gray-400 uppercase tracking-wider">Change Status</div>
                          {['Active', 'Pending', 'Inactive'].map((s) => (
                            <button 
                              key={s}
                              onClick={() => handleStatusChange(user.id, s)}
                              className={`w-full text-left px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors cursor-pointer ${user.status === s ? 'text-[#F9A825] bg-orange-50/50' : 'text-gray-600'}`}
                            >
                              {s}
                            </button>
                          ))}
                          <div className="border-t border-gray-100 my-1"></div>
                          <button 
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-bold text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            Delete Employee
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-6 flex items-center justify-between border-t border-gray-100">
        <p className="text-sm text-gray-500">
          Showing <span className="font-bold text-gray-700">{filteredEmployees.length === 0 ? 0 : startIndex + 1}</span> to <span className="font-bold text-[#F9A825]">{endIndex}</span> of <span className="font-bold text-[#F9A825]">{filteredEmployees.length}</span> results
        </p>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronLeft size={16} />
          </button>
          
          {Array.from({ length: totalPages }).map((_, i) => {
            const pageNum = i + 1;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-8 h-8 flex items-center justify-center rounded font-medium cursor-pointer ${
                  currentPage === pageNum 
                    ? 'bg-[#F9A825] text-white' 
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button 
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="w-8 h-8 flex items-center justify-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent cursor-pointer"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserTable;
