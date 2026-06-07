import React, { useState, useEffect } from 'react';
import UserStatCards from '../../components/users/UserStatCards';
import UserTable from '../../components/users/UserTable';
import QuickInvite from '../../components/users/QuickInvite';
import BulkImport from '../../components/users/BulkImport';
import { streamEmployees } from '../../services/employeeService';

const UserManagementPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = streamEmployees((data) => {
      setEmployees(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const total = employees.length;
  const active = employees.filter(e => e.status === 'Active').length;
  const pending = employees.filter(e => e.status === 'Pending').length;
  const admins = employees.filter(e => e.role === 'Admin').length;

  const stats = { total, active, pending, admins };

  return (
    <div className="p-8">
      {/* Stat Cards */}
      <div className="mb-8">
        <UserStatCards stats={stats} loading={loading} />
      </div>

      {/* Main Data Table */}
      <div className="mb-8">
        <UserTable employees={employees} loading={loading} />
      </div>

      {/* Bottom Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <QuickInvite />
        <BulkImport />
      </div>
    </div>
  );
};

export default UserManagementPage;
