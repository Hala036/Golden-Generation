import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  getAvailableSettlements,
  removeSettlement
} from '../../firebase';
import { uploadSettlementsFromCSV } from '../../utils/addSettlements';
import { Trash2, Upload } from 'lucide-react';
import { assignAdminToSettlement, deleteAuthUser } from '../../firebase';
import { collection, getDocs, setDoc, doc, getDoc, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import Papa from 'papaparse';
import Modal from '../Modal';
import { FaEdit, FaTrash, FaEye, FaUserPlus, FaUsers } from 'react-icons/fa';

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
  const [retireeCounts, setRetireeCounts] = useState({});

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

  // Fetch retiree counts for each settlement
  const fetchRetireeCounts = async (settlements) => {
    const counts = {};
    for (const s of settlements) {
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'retiree'),
        where('idVerification.settlement', '==', s.name)
      );
      const snap = await getDocs(q);
      counts[s.name] = snap.size;
    }
    setRetireeCounts(counts);
  };

  useEffect(() => {
    fetchSettlements();
    fetchNonAdminUsers();
  }, []);

  useEffect(() => {
    if (settlementDetails.length > 0) fetchRetireeCounts(settlementDetails);
  }, [settlementDetails]);

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

  // Replace AdminDetailsModal with shared Modal
  const AdminDetailsModal = ({ admin, onClose }) => (
    <Modal onClose={onClose} title="Admin Details">
      <div className="space-y-2">
        <div><b>Username:</b> {admin.credentials?.username || '-'}</div>
        <div><b>Email:</b> {admin.credentials?.email || '-'}</div>
        <div><b>Phone:</b> {admin.credentials?.phone || '-'}</div>
        <div><b>Role:</b> {admin.role || '-'}</div>
        <div><b>Settlement:</b> {admin.settlement || '-'}</div>
        <div><b>Registered Retirees:</b> {retireeCounts[admin.settlement] || 0}</div>
      </div>
    </Modal>
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
              className={`p-4 rounded-xl shadow flex flex-col gap-2 border-2 ${
                availableSettlements.includes(settlement.name)
                  ? 'bg-green-50 border-green-300'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-lg">{settlement.name}</span>
                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                  availableSettlements.includes(settlement.name)
                    ? 'bg-green-200 text-green-800'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {availableSettlements.includes(settlement.name) ? 'Available' : 'Disabled'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <FaUsers className="text-blue-500" />
                <span className="text-sm">{retireeCounts[settlement.name] || 0} retirees</span>
              </div>
              {settlement.adminId ? (
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-blue-700 underline cursor-pointer flex items-center gap-1" onClick={() => { setSelectedAdmin(adminDetails[settlement.adminId]); setShowAdminModal(true); }}>
                    <FaEye className="inline" /> {adminNames[settlement.adminId] || settlement.adminId}
                  </span>
                  <span className="text-xs text-gray-500">{adminDetails[settlement.adminId]?.credentials?.email}</span>
                  <span className="text-xs text-gray-500">{adminDetails[settlement.adminId]?.credentials?.phone}</span>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => {/* open edit modal logic */}} className="text-yellow-600 hover:text-yellow-900" title="Edit"><FaEdit /></button>
                    <button onClick={() => {/* remove/disable logic */}} className="text-red-600 hover:text-red-900" title="Remove"><FaTrash /></button>
                  </div>
                </div>
              ) : (
                <button onClick={() => {/* open add admin modal logic */}} className="flex items-center gap-1 text-green-700 hover:text-green-900 mt-2" title="Add Admin">
                  <FaUserPlus /> Add Admin
                </button>
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