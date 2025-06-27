import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot, updateDoc, writeBatch } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import { getAuth, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { FaList, FaCheckCircle, FaMinusCircle, FaSearch, FaUserShield, FaEdit, FaPlus, FaUpload, FaExclamationTriangle, FaSpinner, FaMapMarkerAlt, FaTrash } from 'react-icons/fa';
import AssignAdminModal from './AssignAdminModal';
import SettlementCard from './SettlementCard';
import ConfirmDisableModal from './ConfirmDisableModal';
import { useNavigate } from 'react-router-dom';
import Papa from 'papaparse';
import { addSettlement } from '../../firebase';
import { uploadFileToStorage } from '../../utils/uploadFileToStorage';


const AdminSettlements = () => {
  console.debug('[AdminSettlements] mounted');
  const { t } = useLanguage();
  const [allSettlements, setAllSettlements] = useState([]);
  const [settlementMap, setSettlementMap] = useState({});
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
  const [uploading, setUploading] = useState(false);
  const [storageUploading, setStorageUploading] = useState(false);
  const [storageDownloadUrl, setStorageDownloadUrl] = useState('');
  const [replaceAll, setReplaceAll] = useState(false);
  const [pendingFile, setPendingFile] = useState(null);
  const navigate = useNavigate();
  const { language } = useLanguage();
  const rtlLanguages = ['he', 'ar'];
  const isRTL = rtlLanguages.includes(language);
  const [usernameError, setUsernameError] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);

  // Filter settlements based on search
  const filteredSettlements = allSettlements.filter(settlement =>
    settlement.name && settlement.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination state (must come after filteredSettlements)
  const [page, setPage] = useState(1);
  const perPage = 20;
  const totalPages = Math.ceil(filteredSettlements.length / perPage);
  const paginatedSettlements = filteredSettlements.slice((page - 1) * perPage, page * perPage);

  // Reset to page 1 if search/filter changes
  useEffect(() => { setPage(1); }, [searchQuery, allSettlements, availableSettlements]);

  // Fetch settlements and availableSettlements
  useEffect(() => {
    const unsubSettlements = onSnapshot(collection(db, 'settlements'), (snapshot) => {
      const settlements = snapshot.docs.map(doc => doc.data());
      setAllSettlements(settlements);
      // Build a map for fast lookup
      const map = {};
      settlements.forEach(s => { if (s.name) map[s.name] = s; });
      setSettlementMap(map);
      setLoading(false);
    });
    const unsubAvailable = onSnapshot(collection(db, 'availableSettlements'), (snapshot) => {
      setAvailableSettlements(snapshot.docs.map(doc => doc.data().name));
    });
    return () => { unsubSettlements(); unsubAvailable(); };
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
        console.debug('[fetchAvailableSettlements] available:', available, 'admins:', admins);
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
    console.debug('[handleAdminCreated] start', { email, username, phone, selectedSettlement });
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
      console.debug('[handleAdminCreated] success', { email, username, phone, newUserId });
    } catch (err) {
      if (userCredential && newUserId) {
        try { await userCredential.user.delete(); } catch (e) { /* ignore */ }
      }
      console.error('[handleAdminCreated] error:', err);
      toast.error('Failed to create admin: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Handle disabling a settlement (delete from Firestore)
  const handleDisableSettlement = async (settlement) => {
    console.debug('[handleDisableSettlement] settlement:', settlement);
    try {
      // Find the doc to delete
      const settlementsRef = collection(db, 'settlements');
      const snapshot = await getDocs(settlementsRef);
      const docToDelete = snapshot.docs.find(doc => doc.data().name === settlement);
      if (docToDelete) {
        await deleteDoc(doc(db, 'settlements', docToDelete.id));
        toast.success(`${settlement} deleted.`);
        console.debug('[handleDisableSettlement] deleted:', settlement);
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
      console.error('[handleDisableSettlement] error:', error);
      toast.error('Failed to delete settlement.');
    }
  };

  // Add or Edit Settlement in Firestore and local state
  const handleSaveSettlement = async () => {
    const name = settlementForm.name.trim();
    console.debug('[handleSaveSettlement] name:', name, 'form:', settlementForm);
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
          console.debug('[handleSaveSettlement] renamed:', settlementForm.original, 'to', name);
        } else {
          toast.error('Original settlement not found');
        }
      } else if (!existing) {
        // Add new
        await setDoc(doc(settlementsRef), { name });
        toast.success('Settlement added!');
        console.debug('[handleSaveSettlement] added:', name);
      } else {
        toast.error('Settlement already exists');
        return;
      }
      setShowSettlementModal(false);
      setSettlementForm({ original: '', name: '', isEdit: false });
    } catch (err) {
      console.error('[handleSaveSettlement] error:', err);
      toast.error('Failed to save settlement');
    }
  };

  // Filtered settlements for suggestions
  const filteredModalSettlements = allSettlements.filter(s =>
    s.name.toLowerCase().includes(settlementForm.name.trim().toLowerCase())
  );

  // Enhanced upload handler with confirmation modal for replaceAll
  const handleUploadFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    if (replaceAll) {
      setPendingFile(file);
      setShowConfirmModal(true);
    } else {
      await doUpload(file);
    }
  };

  // Actual upload logic
  const doUpload = async (file) => {
    setUploading(true);
    try {
      let settlements = [];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('Invalid JSON format: expected an array');
        settlements = parsed;
        console.debug('[handleUploadFile] parsed JSON settlements:', settlements);
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        const text = await file.text();
        const results = Papa.parse(text, { header: true, skipEmptyLines: true });
        settlements = results.data.filter(row => row.name && typeof row.name === 'string');
        console.debug('[handleUploadFile] parsed CSV settlements:', settlements);
      } else {
        throw new Error('Unsupported file type. Please upload a JSON or CSV file.');
      }
      if (replaceAll) {
        // Delete all settlements first
        const existing = await getDocs(collection(db, 'settlements'));
        const batch = writeBatch(db);
        existing.forEach(docSnap => batch.delete(docSnap.ref));
        await batch.commit();
        toast.success('All previous settlements deleted.');
      }
      let added = 0, duplicates = 0, errors = 0;
      for (const row of settlements) {
        const name = typeof row === 'string' ? row : row.name;
        console.debug('[handleUploadFile] processing name:', name);
        if (!name || typeof name !== 'string') continue;
        // Check if already exists in 'settlements'
        const existing = await getDocs(collection(db, 'settlements'));
        const exists = existing.docs.some(doc => doc.data().name === name);
        if (exists) {
          duplicates++;
          continue;
        }
        try {
          // Save the full object, not just name
          await setDoc(doc(collection(db, 'settlements')), row);
          added++;
        } catch (err) {
          errors++;
        }
      }
      toast.success(`✅ Added: ${added}, Duplicates: ${duplicates}, Errors: ${errors}`);
    } catch (err) {
      toast.error('❌ Failed to upload: ' + err.message);
    } finally {
      setUploading(false);
      setShowConfirmModal(false);
      setPendingFile(null);
    }
  };

  // Enable a settlement: copy to 'availableSettlements'
  const handleEnableSettlement = async (name) => {
    try {
      await setDoc(doc(db, 'availableSettlements', name), {
        name,
        available: true,
        createdAt: new Date().toISOString(),
      });
      toast.success(`${name} enabled and added to availableSettlements!`);
      
    } catch (err) {
      toast.error('Failed to enable settlement: ' + err.message);
    }
  };

  const [editModal, setEditModal] = useState({ open: false, settlement: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, settlement: null });
  const [editForm, setEditForm] = useState({ name: '', english_name: '', shem_napa: '', shem_moaatza: '', lishka: '' });

  // Edit settlement logic
  const openEditModal = (settlement) => {
    setEditForm({
      name: settlement.name || '',
      english_name: settlement.english_name || '',
      shem_napa: settlement.shem_napa || '',
      shem_moaatza: settlement.shem_moaatza || '',
      lishka: settlement.lishka || ''
    });
    setEditModal({ open: true, settlement });
  };
  const handleEditChange = (e) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };
  const handleEditSave = async () => {
    try {
      // Find the doc to update by name
      const docs = await getDocs(collection(db, 'settlements'));
      const docToUpdate = docs.docs.find(doc => doc.data().name === editModal.settlement.name);
      if (docToUpdate) {
        await setDoc(docToUpdate.ref, editForm);
        toast.success('Settlement updated!');
      }
      setEditModal({ open: false, settlement: null });
    } catch (err) {
      toast.error('Failed to update settlement: ' + err.message);
    }
  };
  // Delete settlement logic
  const openDeleteModal = (settlement) => {
    setDeleteModal({ open: true, settlement });
  };
  const handleDelete = async () => {
    try {
      // Find the doc to delete by name
      const docs = await getDocs(collection(db, 'settlements'));
      const docToDelete = docs.docs.find(doc => doc.data().name === deleteModal.settlement.name);
      if (docToDelete) {
        await docToDelete.ref.delete();
        toast.success('Settlement deleted!');
        
      }
      setDeleteModal({ open: false, settlement: null });
    } catch (err) {
      toast.error('Failed to delete settlement: ' + err.message);
    }
  };

  const [adminModal, setAdminModal] = useState({ open: false, settlement: null });
  const [adminForm, setAdminForm] = useState({ email: '', username: '', phone: '' });
  const [enablingSettlement, setEnablingSettlement] = useState('');

  // Open admin creation modal when enabling
  const openAdminModal = (settlement) => {
    setAdminForm({ email: '', username: '', phone: '' });
    setAdminModal({ open: true, settlement });
  };

  // Username uniqueness check
  useEffect(() => {
    const check = async () => {
      if (!adminForm.username) {
        setUsernameError('');
        return;
      }
      setCheckingUsername(true);
      const usernameDoc = await getDoc(doc(db, 'usernames', adminForm.username.toLowerCase()));
      if (usernameDoc.exists()) {
        setUsernameError('Username is already taken');
      } else {
        setUsernameError('');
      }
      setCheckingUsername(false);
    };
    check();
  }, [adminForm.username]);

  // Handle admin creation and enable settlement
  const handleCreateAdminAndEnable = async () => {
    setEnablingSettlement(adminModal.settlement.name);
    let newUserId = null;
    let userCredential = null;
    try {
      const { email, username, phone } = adminForm;
      if (!email || !username || !phone) {
        toast.error('All fields are required');
        return;
      }
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
        settlement: adminModal.settlement.name,
        createdAt: new Date().toISOString(),
        profileComplete: false,
      });
      // 4. Add username to 'usernames' collection for uniqueness and lookup
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: newUserId,
        email,
        createdAt: new Date().toISOString(),
        role: 'admin',
      });
      // 5. Update the availableSettlements doc with admin info
      await setDoc(doc(db, 'availableSettlements', adminModal.settlement.name), {
        name: adminModal.settlement.name,
        available: true,
        createdAt: new Date().toISOString(),
        adminId: newUserId,
        adminEmail: email,
        adminUsername: username,
        adminPhone: phone,
      }, { merge: true });
      toast.success('Admin created and password reset email sent!');
      setAdminModal({ open: false, settlement: null });
    } catch (err) {
      if (userCredential && newUserId) {
        try { await userCredential.user.delete(); } catch (e) { /* ignore */ }
      }
      toast.error('Failed to create admin: ' + (err.message || 'Unknown error'));
    } finally {
      setEnablingSettlement('');
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('auth.adminSettlements.loading')}</div>;
  }

  console.debug('[AdminSettlements] rendering');
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Available Settlements</h1>
        <div className="flex gap-2">
          <div className="flex gap-4 mb-4 items-center">
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 text-sm font-medium" title="Replace all settlements with this file">
                <input
                  type="checkbox"
                  checked={replaceAll}
                  onChange={e => setReplaceAll(e.target.checked)}
                  className="accent-yellow-500 w-4 h-4"
                />
                <span>Replace all settlements with this file</span>
              </label>
              {replaceAll && (
                <span className="text-xs text-red-600 ml-2 flex items-center gap-1">
                  <FaExclamationTriangle className="inline mr-1" />
                  This will delete all current settlements!
                </span>
              )}
            </div>
            <label htmlFor="firestore-upload" className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded cursor-pointer flex items-center gap-2" title="Upload a JSON or CSV file to add settlements">
              <FaUpload />
              {uploading ? (
                <span className="flex items-center gap-2"><FaSpinner className="animate-spin" /> Uploading...</span>
              ) : (
                'Upload JSON/CSV'
              )}
              <input id="firestore-upload" name="firestore-upload" type="file" accept=".json,.csv,application/json,text/csv" onChange={handleUploadFile} style={{ display: 'none' }} disabled={uploading} />
            </label>
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
          className={`pl-10 pr-4 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 w-full ${isRTL ? 'text-right' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
        />
        <FaMapMarkerAlt className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-yellow-400`} />
      </div>
      {/* Settlements List */}
      {loading ? (
        <div className="flex flex-col items-center py-8 text-gray-500">
          <FaSpinner className="animate-spin text-3xl mb-2" />
          Loading settlements...
        </div>
      ) : filteredSettlements.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-gray-400">
          <FaMapMarkerAlt className="text-4xl mb-2" />
          <div>No settlements found.</div>
        </div>
      ) : (
        <>
        <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 ${isRTL ? 'rtl' : ''}`} dir={isRTL ? 'rtl' : 'ltr'}>
          {paginatedSettlements.map(settlement => {
            const enabled = availableSettlements.includes(settlement.name);
            return (
              <div key={settlement.name} className="bg-white shadow rounded p-4 flex flex-col items-center transition hover:shadow-lg">
                <div className="font-bold text-lg mb-2 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-yellow-500" />
                  {settlement.name}
                  {enabled && (
                    <span className="ml-2 flex items-center gap-1 text-green-600 text-sm font-semibold">
                      <FaCheckCircle /> Enabled
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mb-1">{settlement.english_name}</div>
                <div className="text-xs text-gray-500 mb-1">{settlement.shem_napa}{settlement.shem_napa && settlement.shem_moaatza ? ' • ' : ''}{settlement.shem_moaatza}</div>
                <div className="text-xs text-gray-400 mb-2">{settlement.lishka}</div>
                {!enabled && (
                  <button
                    onClick={() => openAdminModal(settlement)}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded mt-2 flex items-center gap-2"
                    disabled={enablingSettlement === settlement.name}
                    title="Enable this settlement"
                  >
                    <FaCheckCircle /> Enable
                  </button>
                )}
                {/* Edit/Delete icons */}
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => openEditModal(settlement)}
                    className="text-blue-500 hover:text-blue-700 p-1"
                    title="Edit settlement"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => openDeleteModal(settlement)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Delete settlement"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className={`flex items-center justify-center gap-4 mt-8 ${isRTL ? 'flex-row-reverse' : ''}`}> 
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              aria-label="Previous page"
            >
              {isRTL ? '→' : '←'} Previous
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              aria-label="Next page"
            >
              Next {isRTL ? '←' : '→'}
            </button>
          </div>
        )}
        </>
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
                      key={s.name}
                      className="px-4 py-2 cursor-pointer hover:bg-yellow-100"
                      onMouseDown={() => {
                        setSettlementForm({ original: s.name, name: s.name, isEdit: true });
                        setShowSuggestions(false);
                      }}
                    >
                      {s.name}
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
      {/* Confirmation Modal for Replace All */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg flex flex-col items-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2 text-center">Are you sure?</h2>
            <p className="text-center mb-6">This will <span className="text-red-600 font-semibold">delete all current settlements</span> before uploading the new file. This action cannot be undone.</p>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  if (pendingFile) await doUpload(pendingFile);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold"
              >
                Yes, Replace All
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingFile(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Settlement</h2>
            <div className="mb-4 grid grid-cols-1 gap-2">
              <label className="text-sm font-medium">Name
                <input name="name" value={editForm.name} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">English Name
                <input name="english_name" value={editForm.english_name} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">Region
                <input name="shem_napa" value={editForm.shem_napa} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">Municipality
                <input name="shem_moaatza" value={editForm.shem_moaatza} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">Office
                <input name="lishka" value={editForm.lishka} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditModal({ open: false, settlement: null })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center text-red-600">Delete Settlement</h2>
            <p className="mb-6 text-center">Are you sure you want to delete <span className="font-bold">{deleteModal.settlement.name}</span>? This action cannot be undone.</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteModal({ open: false, settlement: null })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Admin Creation Modal */}
      {adminModal.open && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Create Admin for {adminModal.settlement.name}</h2>
            <div className="mb-4 grid grid-cols-1 gap-2">
              <label className="text-sm font-medium">Email
                <input name="email" value={adminForm.email} onChange={e => setAdminForm({ ...adminForm, email: e.target.value })} className="border px-2 py-1 rounded w-full" type="email" />
              </label>
              <label className="text-sm font-medium">Username
                <input name="username" value={adminForm.username} onChange={e => setAdminForm({ ...adminForm, username: e.target.value })} className="border px-2 py-1 rounded w-full" />
                {checkingUsername && <span className="text-xs text-gray-500 ml-2">Checking...</span>}
                {usernameError && <span className="text-xs text-red-600 ml-2">{usernameError}</span>}
              </label>
              <label className="text-sm font-medium">Phone
                <input name="phone" value={adminForm.phone} onChange={e => setAdminForm({ ...adminForm, phone: e.target.value })} className="border px-2 py-1 rounded w-full" />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setAdminModal({ open: false, settlement: null })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={enablingSettlement === adminModal.settlement.name || !!usernameError || checkingUsername}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAdminAndEnable}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
                disabled={enablingSettlement === adminModal.settlement.name || !!usernameError || checkingUsername}
              >
                {enablingSettlement === adminModal.settlement.name ? 'Enabling...' : 'Create & Enable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettlements;