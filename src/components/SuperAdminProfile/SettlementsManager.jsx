import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getAvailableSettlements,
  removeSettlement
} from '../../firebase';
import { uploadSettlementsFromCSV } from '../../utils/addSettlements';
import { Trash2, Upload } from 'lucide-react';
import { assignAdminToSettlement, deleteAuthUser } from '../../firebase';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Papa from 'papaparse';

const SettlementsManager = () => {
  const [allSettlements, setAllSettlements] = useState([]);
  const [availableSettlements, setAvailableSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSettlement, setSelectedSettlement] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [createNew, setCreateNew] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', username: '', phone: '' });
  const [settlementDetails, setSettlementDetails] = useState([]);
  const [adminNames, setAdminNames] = useState({});
  const [adminDetails, setAdminDetails] = useState({});
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Enhanced fetch to get admin info for each settlement
  const fetchSettlements = async () => {
    try {
      const response = await fetch('/data/settlments_list.csv');
      const csvText = await response.text();
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async function (results) {
          const settlements = results.data.map(row => row.name?.trim()).filter(Boolean);
          setAllSettlements(settlements);
          setAvailableSettlements(settlements);
          setSettlementDetails(results.data); // If you want more details per row
          // Optionally, clear adminNames/adminDetails if not available from CSV
          setAdminNames({});
          setAdminDetails({});
        },
        error: function (error) {
          toast.error('Error parsing settlements CSV: ' + error.message);
        }
      });
    } catch (error) {
      console.error('Failed to fetch settlements:', error);
      toast.error('Failed to load settlements');
    } finally {
      setLoading(false);
    }
  };

  // Fetch non-admin users for assignment
  const fetchNonAdminUsers = async () => {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    const nonAdmins = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(user => user.role !== 'Admin' && user.role !== 'SuperAdmin');
    setUsers(nonAdmins);
  };

  useEffect(() => {
    fetchSettlements();
    fetchNonAdminUsers();
  }, []);

  // ✅ Toggle availability
  const handleToggle = async (settlement) => {
    try {
      await toggleSettlementAvailability(settlement);
      toast.success(`${settlement} availability toggled`);
      fetchSettlements();
    } catch (err) {
      toast.error('Failed to toggle settlement');
    }
  };

  // ✅ Delete permanently
  const handleDelete = async (settlement) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${settlement}"?`)) return;
    try {
      await removeSettlement(settlement);
      toast.success(`Removed: ${settlement}`);
      fetchSettlements();
    } catch (err) {
      toast.error('Failed to remove settlement');
    }
  };

  // ✅ Upload from CSV and refresh
  const handleCSVUpload = async () => {
    try {
      await uploadSettlementsFromCSV();
      toast.success('Settlements uploaded from CSV');
      fetchSettlements();
    } catch (err) {
      console.error(err);
      toast.error('CSV upload failed');
    }
  };

  // Assign admin to settlement
  const handleAssignAdmin = async () => {
    if (!selectedSettlement || !selectedUser) {
      toast.error('Please select both a settlement and a user.');
      return;
    }
    try {
      await assignAdminToSettlement(selectedSettlement, selectedUser);
      toast.success('Admin assigned successfully!');
      setSelectedSettlement('');
      setSelectedUser('');
      fetchSettlements();
      fetchNonAdminUsers();
    } catch (err) {
      toast.error('Failed to assign admin.');
    }
  };

  // Create and assign a new admin
  const handleCreateAndAssignAdmin = async () => {
    if (!selectedSettlement || !newAdmin.email || !newAdmin.username || !newAdmin.phone) {
      toast.error('Please fill all fields.');
      return;
    }
    let newUserId = null;
    let userCredential = null;
    try {
      // 1. Create user in Firebase Auth
      const auth = getAuth();
      const tempPassword = newAdmin.email + '_Temp123';
      userCredential = await createUserWithEmailAndPassword(auth, newAdmin.email, tempPassword);
      newUserId = userCredential.user.uid;
      // 2. Send password reset email
      await sendPasswordResetEmail(auth, newAdmin.email);
      // 3. Create user in Firestore
      const usersRef = collection(db, 'users');
      const newUserRef = doc(usersRef, newUserId);
      await setDoc(newUserRef, {
        credentials: {
          email: newAdmin.email,
          username: newAdmin.username,
          phone: newAdmin.phone,
        },
        role: 'Admin',
        settlement: selectedSettlement,
        createdAt: new Date().toISOString(),
        profileComplete: false,
      });
      // 4. Assign as admin to settlement
      await assignAdminToSettlement(selectedSettlement, newUserId);
      toast.success('New admin created, assigned, and password reset email sent!');
      setNewAdmin({ email: '', username: '', phone: '' });
      setSelectedSettlement('');
      fetchSettlements();
      fetchNonAdminUsers();
    } catch (err) {
      // Rollback: delete Auth user if Firestore creation fails
      if (userCredential && newUserId) {
        try { await deleteAuthUser(userCredential.user); } catch (e) { /* ignore */ }
      }
      toast.error('Failed to create and assign admin: ' + (err.message || 'Unknown error'));
    }
  };

  const filteredSettlements = allSettlements.filter(s =>
    s.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Modal for admin details
  const AdminDetailsModal = ({ admin, onClose }) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 min-w-[300px] max-w-[90vw]">
        <h2 className="text-xl font-bold mb-4">Admin Details</h2>
        <div className="mb-2"><b>Username:</b> {admin.credentials?.username || '-'}</div>
        <div className="mb-2"><b>Email:</b> {admin.credentials?.email || '-'}</div>
        <div className="mb-2"><b>Phone:</b> {admin.credentials?.phone || '-'}</div>
        <div className="mb-2"><b>Role:</b> {admin.role || '-'}</div>
        <div className="mb-2"><b>Settlement:</b> {admin.settlement || '-'}</div>
        <button onClick={onClose} className="mt-4 bg-yellow-400 px-4 py-2 rounded hover:bg-yellow-500">Close</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Settlement Manager</h1>
        <button
          onClick={handleCSVUpload}
          className="flex items-center gap-2 bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
        >
          <Upload size={18} />
          Upload CSV
        </button>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Search settlements..."
          className="w-full px-3 py-2 border rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Admin Assignment UI */}
      <div className="mb-8 p-4 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-3">Assign Admin to Settlement</h2>
        <div className="flex gap-2 mb-2">
          <button onClick={() => setCreateNew(false)} className={`px-3 py-1 rounded ${!createNew ? 'bg-yellow-300 font-bold' : 'bg-gray-200'}`}>Select Existing User</button>
          <button onClick={() => setCreateNew(true)} className={`px-3 py-1 rounded ${createNew ? 'bg-yellow-300 font-bold' : 'bg-gray-200'}`}>Create New Admin</button>
        </div>
        {createNew ? (
          <div className="flex gap-2 mb-2">
            <select
              value={selectedSettlement}
              onChange={e => setSelectedSettlement(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select Settlement</option>
              {settlementDetails.map(s => (
                <option key={s.semel_yeshuv || s.name} value={s.name} disabled={!!s.adminId}>
                  {s.name}{s.adminId ? ' (Admin assigned)' : ''}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Email"
              value={newAdmin.email}
              onChange={e => setNewAdmin({ ...newAdmin, email: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Username"
              value={newAdmin.username}
              onChange={e => setNewAdmin({ ...newAdmin, username: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Phone"
              value={newAdmin.phone}
              onChange={e => setNewAdmin({ ...newAdmin, phone: e.target.value })}
              className="px-3 py-2 border rounded"
            />
            <button
              onClick={handleCreateAndAssignAdmin}
              className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
              disabled={selectedSettlement && settlementDetails.find(s => s.name === selectedSettlement && s.adminId)}
            >
              Create & Assign
            </button>
            {selectedSettlement && settlementDetails.find(s => s.name === selectedSettlement && s.adminId) && (
              <span className="text-red-500 text-xs ml-2">This settlement already has an admin.</span>
            )}
          </div>
        ) : (
          <div className="flex gap-2 mb-2">
            <select
              value={selectedSettlement}
              onChange={e => setSelectedSettlement(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select Settlement</option>
              {settlementDetails.map(s => (
                <option key={s.semel_yeshuv || s.name} value={s.name} disabled={!!s.adminId}>
                  {s.name}{s.adminId ? ' (Admin assigned)' : ''}
                </option>
              ))}
            </select>
            <select
              value={selectedUser}
              onChange={e => setSelectedUser(e.target.value)}
              className="px-3 py-2 border rounded"
            >
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.credentials?.username || u.credentials?.email || u.id}</option>
              ))}
            </select>
            <button
              onClick={handleAssignAdmin}
              className="bg-yellow-400 text-black px-4 py-2 rounded hover:bg-yellow-500 transition"
              disabled={selectedSettlement && settlementDetails.find(s => s.name === selectedSettlement && s.adminId)}
            >
              Assign Admin
            </button>
            {selectedSettlement && settlementDetails.find(s => s.name === selectedSettlement && s.adminId) && (
              <span className="text-red-500 text-xs ml-2">This settlement already has an admin.</span>
            )}
          </div>
        )}
      </div>

      {/* Settlements List with assigned admins */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-2">Settlements & Assigned Admins</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settlementDetails.map((settlement, index) => (
            <li
              key={index}
              className={`p-4 rounded shadow flex flex-col gap-2 ${
                availableSettlements.includes(settlement.name)
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}
            >
              <span className="font-medium">{settlement.name}</span>
              {settlement.adminId ? (
                <span className="text-sm text-blue-700 underline cursor-pointer" onClick={() => { setSelectedAdmin(adminDetails[settlement.adminId]); setShowAdminModal(true); }}>
                  Admin: {adminNames[settlement.adminId] || settlement.adminId}
                </span>
              ) : (
                <span className="text-sm text-gray-400">No admin assigned</span>
              )}
            </li>
          ))}
        </ul>
        {showAdminModal && selectedAdmin && (
          <AdminDetailsModal admin={selectedAdmin} onClose={() => setShowAdminModal(false)} />
        )}
      </div>

      {loading ? (
        <p>Loading settlements...</p>
      ) : filteredSettlements.length === 0 ? (
        <p>No settlements found.</p>
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSettlements.map((settlement, index) => (
            <li
              key={index}
              className={`p-4 rounded shadow flex justify-between items-center ${
                availableSettlements.includes(settlement)
                  ? 'bg-green-100'
                  : 'bg-red-100'
              }`}
            >
              <span className="font-medium">{settlement}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggle(settlement)}
                  className="text-sm text-blue-700 underline"
                >
                  Toggle
                </button>
                <button
                  onClick={() => handleDelete(settlement)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SettlementsManager;
// This component manages settlements, allowing toggling availability, deleting, and uploading from CSV.