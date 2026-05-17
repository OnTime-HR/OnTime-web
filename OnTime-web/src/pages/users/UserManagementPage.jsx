import React from 'react';
import UserStatCards from '../../components/users/UserStatCards';
import UserTable from '../../components/users/UserTable';
import QuickInvite from '../../components/users/QuickInvite';
import BulkImport from '../../components/users/BulkImport';

const UserManagementPage = () => {
  return (
    <div className="p-8">
      {/* Stat Cards */}
      <div className="mb-8">
        <UserStatCards />
      </div>

      {/* Main Data Table */}
      <div className="mb-8">
        <UserTable />
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
