import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FaList, FaCheckCircle, FaMinusCircle, FaSearch, FaUserShield, FaEdit, FaPlus } from 'react-icons/fa';
import AssignAdminModal from './AssignAdminModal';
import SettlementCard from './SettlementCard';
import ConfirmDisableModal from './ConfirmDisableModal';
import { useNavigate } from 'react-router-dom';

const AdminSettlements = () => {
  const [allSettlements, setAllSettlements] = useState([]);
  const [availableSettlements, setAvailableSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSettlement, setSelectedSettlement] = useState('');
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [settlementAdmins, setSettlementAdmins] = useState({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [settlementToDisable, setSettlementToDisable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    original: '', // for editing
    name: '',
    isEdit: false,
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [settlementSearch, setSettlementSearch] = useState('');
  const navigate = useNavigate();

  // Real-time settlements from Firestore
  useEffect(() => {
    setLoading(true);
    const unsub = onSnapshot(collection(db, 'settlements'), (snapshot) => {
      const settlements = snapshot.docs.map(doc => doc.data().name);
      setAllSettlements(settlements);
      setLoading(false);
    }, (error) => {
      toast.error('Failed to load settlements');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Fetch availableSettlements and show assigned admins
  useEffect(() => {
    const fetchAvailableSettlements = async () => {
    try {
        const snapshot = await getDocs(collection(db, 'availableSettlements'));
        const available = [];
        const admins = {};
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          available.push(data.name);
          if (data.adminEmail) {
            admins[data.name] = {
              email: data.adminEmail,
              username: data.adminUsername,
              phone: data.adminPhone,
            };
          }
        });
        setAvailableSettlements(available);
        setSettlementAdmins(admins);
      } catch (error) {
        console.error('Failed to fetch available settlements:', error);
      }
    };
    fetchAvailableSettlements();
  }, []);

  // Check if email exists in Firebase Auth
  const checkEmailExists = async (email) => {
    if (!email) return false;
    try {
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:createAuthUri?key=AIzaSyDKxXiBm3uiM5pBCGdHxWDdPEHY3zVSlBo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: email, continueUri: 'http://localhost' })
      });
      if (response.status === 400) return false;
      const data = await response.json();
      return data.registered === true;
    } catch {
      return false;
      }
  };

  // Check if username exists in Firestore
  const checkUsernameExists = async (username) => {
    if (!username) return false;
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()));
    return usernameDoc.exists();
  };

  // Handle admin creation
  const handleAdminCreated = async ({ email, username, phone }) => {
    setCreatingAdmin(true);
    let newUserId = null;
    let userCredential = null;
    try {
      // 1. Create user in Firebase Auth
      const auth = getAuth();
      const tempPassword = email + '_Temp123';
      userCredential = await createUserWithEmailAndPassword(auth, email, tempPassword);
      newUserId = userCredential.user.uid;
      // 2. Send password reset email
      await sendPasswordResetEmail(auth, email);
      // 3. Create user in Firestore
      const usersRef = collection(db, 'users');
      const newUserRef = doc(usersRef, newUserId);
      await setDoc(newUserRef, {
        credentials: { email, username, phone },
        role: 'admin',
        settlement: selectedSettlement,
        createdAt: new Date().toISOString(),
        profileComplete: false,
      });
      // 4. Update the availableSettlements doc with admin info
      await setDoc(doc(db, 'availableSettlements', selectedSettlement), {
        name: selectedSettlement,
        available: true,
        createdAt: new Date().toISOString(),
        adminId: newUserId,
        adminEmail: email,
        adminUsername: username,
        adminPhone: phone,
      }, { merge: true });
      setAvailableSettlements(prev => [...new Set([...prev, selectedSettlement])]);
      setSettlementAdmins(prev => ({
        ...prev,
        [selectedSettlement]: { email, username, phone },
      }));
      toast.success('Admin created and password reset email sent!');
      setShowAdminForm(false);
      setSelectedSettlement('');
    } catch (err) {
      if (userCredential && newUserId) {
        try { await userCredential.user.delete(); } catch (e) { /* ignore */ }
      }
      toast.error('Failed to create admin: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Handle disabling a settlement (delete from Firestore)
  const handleDisableSettlement = async (settlement) => {
    try {
      // Find the doc to delete
      const settlementsRef = collection(db, 'settlements');
      const snapshot = await getDocs(settlementsRef);
      const docToDelete = snapshot.docs.find(doc => doc.data().name === settlement);
      if (docToDelete) {
        await deleteDoc(doc(db, 'settlements', docToDelete.id));
        toast.success(`${settlement} deleted.`);
      } else {
        toast.error('Settlement not found.');
      }
      setAvailableSettlements(prev => prev.filter(s => s !== settlement));
      setSettlementAdmins(prev => {
        const newAdmins = { ...prev };
        delete newAdmins[settlement];
        return newAdmins;
      });
    } catch (error) {
      toast.error('Failed to delete settlement.');
    }
  };

  // Add or Edit Settlement in Firestore and local state
  const handleSaveSettlement = async () => {
    const name = settlementForm.name.trim();
    if (!name) {
      toast.error('Settlement name cannot be empty');
      return;
    }
    try {
      const settlementsRef = collection(db, 'settlements');
      // Check if exists
      const existing = allSettlements.find(s => s === name);
      if (settlementForm.isEdit && settlementForm.original && settlementForm.original !== name) {
        // Edit: Rename settlement
        // Find the doc to update
        const snapshot = await getDocs(settlementsRef);
        const docToUpdate = snapshot.docs.find(doc => doc.data().name === settlementForm.original);
        if (docToUpdate) {
          await updateDoc(doc(db, 'settlements', docToUpdate.id), { name });
          toast.success('Settlement renamed!');
        } else {
          toast.error('Original settlement not found');
        }
      } else if (!existing) {
        // Add new
        await setDoc(doc(settlementsRef), { name });
        toast.success('Settlement added!');
      } else {
        toast.error('Settlement already exists');
        return;
      }
      setShowSettlementModal(false);
      setSettlementForm({ original: '', name: '', isEdit: false });
    } catch (err) {
      toast.error('Failed to save settlement');
    }
  };

  // Filtered settlements for suggestions
  const filteredModalSettlements = allSettlements.filter(s =>
    s.toLowerCase().includes(settlementForm.name.trim().toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading settlements...</div>;
  }

  // Filter settlements based on search and availability
  const filteredSettlements = allSettlements
    .filter(settlement => settlement.toLowerCase().includes(searchQuery.toLowerCase()))
    .filter(settlement => {
      if (availabilityFilter === 'available') return availableSettlements.includes(settlement);
      if (availabilityFilter === 'disabled') return !availableSettlements.includes(settlement);
      return true;
    });

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Available Settlements</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettlementModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-4 py-2 rounded flex items-center gap-2 shadow"
          >
            <FaPlus /> Add/Edit Settlement
          </button>
          <button
            onClick={() => navigate('/superadmin/admins')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-4 py-2 rounded flex items-center gap-2 shadow"
          >
            <FaUserShield /> Admin Management
          </button>
        </div>
      </div>
      {/* Availability Filter Buttons */}
      <div className="mb-6 flex gap-3 justify-center">
        <button
          onClick={() => setAvailabilityFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition font-semibold
            ${availabilityFilter === 'all' ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'}`}
        >
          <FaList /> All
        </button>
        <button
          onClick={() => setAvailabilityFilter('available')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition font-semibold
            ${availabilityFilter === 'available' ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}`}
        >
          <FaCheckCircle /> Available
        </button>
          <button
          onClick={() => setAvailabilityFilter('disabled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition font-semibold
            ${availabilityFilter === 'disabled' ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-100'}`}
          >
          <FaMinusCircle /> Disabled
          </button>
        </div>
      {/* Search and Filter Input */}
      <div className="relative w-full max-w-md mx-auto mb-6">
        <input
          type="text"
          placeholder="Search settlements..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 w-full"
        />
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>
      {/* Settlements List */}
      {filteredSettlements.length === 0 ? (
        <div className="text-center text-gray-500 py-8">No settlements found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSettlements.map(settlement => (
            <SettlementCard
              key={settlement} 
              settlement={settlement}
              isAvailable={availableSettlements.includes(settlement)}
              adminInfo={settlementAdmins[settlement]}
              onClick={() => {
                if (!availableSettlements.includes(settlement)) {
                  setSelectedSettlement(settlement);
                  setShowAdminForm(true);
                }
              }}
              onDisable={availableSettlements.includes(settlement)
                ? () => handleDisableSettlement(settlement)
                : undefined}
            />
          ))}
        </div>
      )}
      {/* Assign Admin Modal */}
      <AssignAdminModal
        open={showAdminForm}
        onClose={() => { setShowAdminForm(false); setSelectedSettlement(''); }}
        selectedSettlement={selectedSettlement}
        onAdminCreated={handleAdminCreated}
        checkEmailExists={checkEmailExists}
        checkUsernameExists={checkUsernameExists}
        creatingAdmin={creatingAdmin}
      />
      {/* Confirm Disable Modal */}
      <ConfirmDisableModal
        open={showConfirmModal}
        settlement={settlementToDisable}
        onCancel={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          await handleDisableSettlement(settlementToDisable);
          setShowConfirmModal(false);
          setSettlementToDisable(null);
        }}
      />
      {/* Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{settlementForm.isEdit ? 'Edit Settlement' : 'Add Settlement'}</h2>
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">Settlement Name</label>
              <input
                type="text"
                className="border px-3 py-2 rounded-md w-full"
                value={settlementForm.name}
                onChange={e => {
                  setSettlementForm({ ...settlementForm, name: e.target.value, isEdit: false });
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Type to search or add..."
                autoComplete="off"
              />
              {/* Suggestions dropdown */}
              {showSuggestions && settlementForm.name && filteredModalSettlements.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded w-full mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredModalSettlements.map(s => (
                    <li
                      key={s}
                      className="px-4 py-2 cursor-pointer hover:bg-yellow-100"
                      onMouseDown={() => {
                        setSettlementForm({ original: s, name: s, isEdit: true });
                        setShowSuggestions(false);
                      }}
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              )}
              {/* Option to add new if not found */}
              {showSuggestions && settlementForm.name && filteredModalSettlements.length === 0 && (
                <div className="absolute z-10 bg-white border border-gray-200 rounded w-full mt-1 px-4 py-2 text-gray-500">
                  No match. Click Save to add new settlement.
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowSettlementModal(false);
                  setSettlementForm({ original: '', name: '', isEdit: false });
                }}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSettlement}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettlements;