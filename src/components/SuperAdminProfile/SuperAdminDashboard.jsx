import React, { useState } from 'react';
import { FaUser, FaCity, FaHandsHelping, FaUserFriends, FaTrash } from 'react-icons/fa';

const SuperAdminDashboard = () => {
  const [view, setView] = useState('admins');

  const [settlements, setSettlements] = useState([
    { name: 'Springfield', municipality: 'Clarke County', admin: { name: 'Bob Smith', email: 'bob.smith@email.com' } },
    { name: 'Riverside', municipality: 'Adams County', admin: { name: 'Alice Johnson', email: 'alice.johnson@email.com' } },
    { name: 'Lincoln', municipality: 'Jefferson County', admin: { name: 'Michael Brown', email: 'michael.brown@email.com' } },
  ]);

  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', settlement: '' });

  const handleCreateAdmin = () => {
    const index = settlements.findIndex(s => s.name === formData.settlement);
    if (index !== -1 && settlements[index].admin && !isEditing) {
      alert('This settlement already has an assigned admin.');
      return;
    }
    const updated = [...settlements];
    updated[index].admin = { name: formData.name, email: formData.email };
    setSettlements(updated);
    setFormData({ name: '', email: '', settlement: '' });
    setIsEditing(false);
    setShowModal(false);
  };

  const handleDeleteAdmin = (settlementName) => {
    const updated = settlements.map(s =>
      s.name === settlementName ? { ...s, admin: null } : s
    );
    setSettlements(updated);
  };

  const handleEditAdmin = (settlement) => {
    setFormData({
      name: settlement.admin.name,
      email: settlement.admin.email,
      settlement: settlement.name
    });
    setIsEditing(true);
    setShowModal(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md p-6">
        <div className="flex flex-col items-center">
          <img
            src="https://randomuser.me/api/portraits/men/76.jpg"
            alt="Admin Profile"
            className="w-24 h-24 rounded-full mb-4"
          />
          <h2 className="text-xl font-bold">John Doe</h2>
          <p className="text-gray-500">Super Admin</p>
        </div>
        <nav className="mt-8 space-y-2">
          <div
            className="flex items-center space-x-2 p-2 hover:bg-yellow-300 rounded cursor-pointer"
            onClick={() => setView('admins')}
          >
            <FaUser /> <span className="font-medium">Admins</span>
          </div>
          <div
            className="flex items-center space-x-2 p-2 hover:bg-yellow-300 rounded cursor-pointer"
            onClick={() => setView('settlements')}
          >
            <FaCity /> <span className="font-medium">Settlements</span>
          </div>
          <div
            className="flex items-center space-x-2 p-2 hover:bg-yellow-300 rounded cursor-pointer"
            onClick={() => setView('volunteers')}
          >
            <FaHandsHelping /> <span className="font-medium">Volunteers</span>
          </div>
          <div
            className="flex items-center space-x-2 p-2 hover:bg-yellow-300 rounded cursor-pointer"
            onClick={() => setView('candidates')}
          >
            <FaUserFriends /> <span className="font-medium">Candidates</span>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 space-y-10">
        {view === 'admins' && (
          <>
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Admins</h1>
              <button
                onClick={() => {
                  setFormData({ name: '', email: '', settlement: '' });
                  setIsEditing(false);
                  setShowModal(true);
                }}
                className="bg-yellow-300 text-black px-4 py-2 rounded hover:bg-yellow-400"
              >
                Create Admin
              </button>
            </div>
            <div className="bg-white shadow rounded overflow-hidden">
              <table className="min-w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Name</th>
                    <th>Settlement</th>
                    <th>Email</th>
                    <th className="text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.filter(s => s.admin).map((s, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4">{s.admin.name}</td>
                      <td>{s.name}</td>
                      <td>{s.admin.email}</td>
                      <td className="text-right pr-4 space-x-4">
                        <span
                          className="cursor-pointer text-gray-500 hover:text-yellow-500"
                          onClick={() => handleEditAdmin(s)}
                        >
                          ✎
                        </span>
                        <span
                          className="cursor-pointer text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteAdmin(s.name)}
                        >
                          <FaTrash />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'settlements' && (
          <>
            <h2 className="text-2xl font-bold mt-12">Settlements</h2>
            <div className="bg-white shadow rounded overflow-hidden">
              <table className="min-w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Settlement</th>
                    <th>Municipality</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {settlements.map((settlement, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-4">{settlement.name}</td>
                      <td>{settlement.municipality}</td>
                      <td className="text-right pr-4 cursor-pointer text-gray-500 hover:text-yellow-500">✎</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {view === 'volunteers' && (
          <h2 className="text-2xl font-bold">Volunteers Section (Coming Soon)</h2>
        )}

        {view === 'candidates' && (
          <h2 className="text-2xl font-bold">Candidates Section (Coming Soon)</h2>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-white p-6 rounded shadow-lg w-96">
              <h3 className="text-lg font-semibold mb-4">{isEditing ? 'Edit Admin' : 'Create Admin'}</h3>
              <input
                type="text"
                placeholder="Full Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full mb-3 p-2 border rounded"
              />
              <select
                value={formData.settlement}
                onChange={e => setFormData({ ...formData, settlement: e.target.value })}
                className="w-full mb-4 p-2 border rounded"
              >
                <option value="">Select Settlement</option>
                {settlements.map((s, i) => (
                  <option key={i} value={s.name}>{s.name}</option>
                ))}
              </select>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowModal(false)} className="text-gray-500">Cancel</button>
                <button onClick={handleCreateAdmin} className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-500">
                  {isEditing ? 'Update' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SuperAdminDashboard;
