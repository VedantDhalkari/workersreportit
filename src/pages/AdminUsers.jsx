import React, { useEffect, useState } from 'react';
import { useAuth, API } from '../context/AuthContext'; // centralized API
import { Link } from 'react-router-dom';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get('/admin/users');
        // Map _id → id and include lastAction details for convenience
        setUsers(
          Array.isArray(data.users)
            ? data.users.map(u => ({
                ...u,
                id: u._id,
                lastAction: u.lastAction,        // expect backend to provide
                projectNumber: u.projectNumber,  // and customer fields
                customer: u.customer
              }))
            : []
        );
      } catch (err) {
        console.error('Error fetching users:', err);
        setUsers([]);
      }
    };

    if (user?.role === 'admin') fetchUsers();
  }, [user]);

  const handleAction = async (id, approve) => {
    try {
      await API.post(`/admin/users/${id}/${approve ? 'approve' : 'revoke'}`);
      // Toggle the isApproved flag
      setUsers(prev =>
        prev.map(u =>
          u.id === id ? { ...u, isApproved: approve } : u
        )
      );
    } catch (err) {
      console.error('Action failed:', err);
      alert(
        `Failed to ${approve ? 'approve' : 'revoke'} user: ${
          err.response?.data?.message || err.message
        }`
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-indigo-50 mt-5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* ...header... */}

          {users.length === 0 ? (
            <div className="text-center py-12 bg-blue-50 rounded-xl">
              {/* ...empty state... */}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-center">
                <thead className="bg-blue-50">
                  <tr>
                    <th className="px-6 py-3 text-sm font-medium text-blue-800">User</th>
                    <th className="px-6 py-3 text-sm font-medium text-blue-800">Email</th>
                    <th className="px-6 py-3 text-sm font-medium text-blue-800">Role</th>
                    <th className="px-6 py-3 text-sm font-medium text-blue-800">Status</th>
                    <th className="px-6 py-3 text-sm font-medium text-blue-800">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{u.name}</td>
                      <td className="px-6 py-4">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isApproved ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Approved
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 space-x-2">
                        {u.isApproved ? (
                          <button
                            onClick={() => handleAction(u.id, false)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-red-600 text-white hover:bg-red-700"
                          >
                            Revoke
                          </button>
                        ) : (
                          <button
                            onClick={() => handleAction(u.id, true)}
                            className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full bg-green-600 text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
