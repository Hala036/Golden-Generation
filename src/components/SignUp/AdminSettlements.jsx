import React, { useState, useEffect, useContext } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { db } from '../../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, getDoc, onSnapshot, updateDoc, writeBatch, query, where } from 'firebase/firestore';
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
import { showSuccessToast, showErrorToast, showLoadingToast, showWarningToast, showInfoToast } from '../ToastManager';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import EmptyState from '../EmptyState';
import { UserContext as AppUserContext } from "../../context/UserContext";
import { useTranslation } from "react-i18next";
import { getFunctions, httpsCallable } from 'firebase/functions';
import i18n from "i18next";
import { Empty } from 'antd';

const AdminSettlements = ({ setSelected }) => {
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
  const [disablingSettlement, setDisablingSettlement] = useState(false);
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
  const { refreshUserData } = useContext(AppUserContext);

  // Filter settlements based on search and availability
  let filteredSettlements = allSettlements.filter(settlement =>
    settlement.name && settlement.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name, 'he'));

  if (availabilityFilter === 'available') {
    filteredSettlements = filteredSettlements.filter(s => availableSettlements.includes(s.name));
  } else if (availabilityFilter === 'disabled') {
    filteredSettlements = filteredSettlements.filter(s => !availableSettlements.includes(s.name));
  }

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

  useEffect(() => {
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
    console.debug('[handleAdminCreated] start', { email, username, phone, selectedSettlement });
    
    try {
      // 1. Create user using REST API (doesn't sign in automatically)
      const auth = getAuth();
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user found');
      }
      
      // Get the current user's ID token for authentication
      const idToken = await currentUser.getIdToken();
      
      // Create user via REST API
      const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyDKxXiBm3uiM5pBCGdHxWDdPEHY3zVSlBo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: email + '_Temp123',
          returnSecureToken: false // Don't return auth tokens
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to create user');
      }
      
      const newUserId = result.localId;
      
      // 2. Send password reset email
      try {
        await sendPasswordResetEmail(auth, email);
        toast.success(i18n.t('auth.adminSettlements.toastMessages.passwordResetSuccess', { email }));
      } catch (err) {
        console.error('Failed to send password reset email:', err);
        toast.error(i18n.t('auth.adminSettlements.toastMessages.passwordResetError', { error: err.message || 'Unknown error' }));
      }
      
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
      
      // 4. Create username document
      await setDoc(doc(db, 'usernames', username.toLowerCase()), {
        uid: newUserId,
        username: username,
      });
      
      // 5. Update the availableSettlements doc with admin info
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
      toast.success(t('auth.adminSettlements.toastMessages.adminCreatedSuccess'));
      setShowAdminForm(false);
      setSelectedSettlement('');
      
      // Add a shorter delay to ensure Firestore writes are complete
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Re-fetch settlements and admins to sync state
      await fetchAvailableSettlements();
      console.debug('[handleAdminCreated] success', { email, username, phone, newUserId });
      
      // Refresh user data with a small delay to ensure document is available
      setTimeout(async () => {
        await refreshUserData();
      }, 1000);
    } catch (err) {
      console.error('[handleAdminCreated] error:', err);
      toast.error('Failed to create admin: ' + (err.message || 'Unknown error'));
    } finally {
      setCreatingAdmin(false);
    }
  };

  // Handle disabling a settlement (remove from availableSettlements, delete admin, delete retirees)
  const handleDisableSettlement = async (settlement) => {
    console.debug('[handleDisableSettlement] settlement:', settlement);
    setDisablingSettlement(true);
    
    try {
      // 1. Remove from availableSettlements
      await deleteDoc(doc(db, 'availableSettlements', settlement));

      // 2. Delete admin user for this settlement
      // Find the admin user by settlement
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'admin'), where('settlement', '==', settlement));
      const adminSnapshot = await getDocs(adminQuery);
      let adminCount = 0;
      for (const adminDoc of adminSnapshot.docs) {
        const adminData = adminDoc.data();
        const username = adminData.credentials?.username;
        if (username) {
          await deleteDoc(doc(db, 'usernames', username.toLowerCase()));
        }
        await deleteDoc(adminDoc.ref);
        // NOTE: To delete a user from Firebase Auth by UID, you must use the Admin SDK (server-side):
        // admin.auth().deleteUser(adminDoc.id)
        // See: https://firebase.google.com/docs/auth/admin/manage-users#delete_a_user
        adminCount++;
      }

      // 3. Delete retirees for this settlement
      const retireeQuery = query(usersRef, where('role', '==', 'retiree'), where('idVerification.settlement', '==', settlement));
      const retireeSnapshot = await getDocs(retireeQuery);
      let retireeCount = 0;
      for (const retireeDoc of retireeSnapshot.docs) {
        const retireeData = retireeDoc.data();
        const retireeUsername = retireeData.credentials?.username;
        if (retireeUsername) {
          await deleteDoc(doc(db, 'usernames', retireeUsername.toLowerCase()));
        }
        await deleteDoc(retireeDoc.ref);
        retireeCount++;
      }

      // Show success toast with details
      showSuccessToast(
        i18n.t('auth.adminSettlements.toastMessages.settlementDisabledSuccess', {
          settlement: settlement,
          adminCount: adminCount,
          retireeCount: retireeCount
        })
      );

      // Update local state
      setAvailableSettlements(prev => prev.filter(s => s !== settlement));
      setSettlementAdmins(prev => {
        const newAdmins = { ...prev };
        delete newAdmins[settlement];
        return newAdmins;
      });
    } catch (error) {
      console.error('[handleDisableSettlement] error:', error);
      showErrorToast(
        i18n.t('auth.adminSettlements.toastMessages.settlementDisabledError', { error: error.message || 'Unknown error' })
      );
    } finally {
      setDisablingSettlement(false);
    }
  };

  // Add or Edit Settlement in Firestore and local state
  const handleSaveSettlement = async () => {
    const name = settlementForm.name.trim();
    console.debug('[handleSaveSettlement] name:', name, 'form:', settlementForm);
    if (!name) {
      toast.error(
        t('auth.adminSettlements.popup.nameRequired') || 'Settlement name cannot be empty',
      );
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
          showSuccessToast(
            i18n.t('auth.adminSettlements.toastMessages.settlementRenamedSuccess', { original: settlementForm.original, name })
          );
          console.debug('[handleSaveSettlement] renamed:', settlementForm.original, 'to', name);
        } else {
          showErrorToast(
            i18n.t('auth.adminSettlements.toastMessages.settlementRenamedError', { name: settlementForm.original })
          );
        }
      } else if (!existing) {
        // Add new
        await setDoc(doc(settlementsRef), { name });
        showSuccessToast(
          i18n.t('auth.adminSettlements.toastMessages.settlementAddedSuccess', { name }) || `Settlement "${name}" added successfully`,
        );
        console.debug('[handleSaveSettlement] added:', name);
      } else {
        showWarningToast(
          i18n.t('auth.adminSettlements.toastMessages.settlementAlreadyExists', { name })        );
        return;
      }
      setShowSettlementModal(false);
      setSettlementForm({ original: '', name: '', isEdit: false });
    } catch (err) {
      console.error('[handleSaveSettlement] error:', err);
      showErrorToast(
        i18n.t('auth.adminSettlements.toastMessages.settlementAddedError', { error: err.message }) || `Failed to add settlement: ${err.message}`,
      );
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
      toast.success(i18n.t('auth.adminSettlements.toastMessages.uploadSuccess', { added, duplicates, errors }));
    } catch (err) {
      toast.error(i18n.t('auth.adminSettlements.toastMessages.uploadError', { error: err.message }));
    } finally {
      setUploading(false);
      setShowConfirmModal(false);
      setPendingFile(null);
    }
  };

  // When enabling a settlement, open AssignAdminModal:
  const handleEnableSettlement = (settlement) => {
    setSelectedSettlement(settlement.name || settlement);
    setShowAdminForm(true);
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
        toast.success(t('auth.adminSettlements.toastMessages.settlementUpdatedSuccess'));
      }
      setEditModal({ open: false, settlement: null });
    } catch (err) {
      toast.error(i18n.t('auth.adminSettlements.toastMessages.settlementUpdatedError', { error: err.message }));
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
        await deleteDoc(docToDelete.ref);
        toast.success(t('auth.adminSettlements.toastMessages.settlementDeletedSuccess'));
        
      }
      setDeleteModal({ open: false, settlement: null });
    } catch (err) {
      toast.error(i18n.t('auth.adminSettlements.toastMessages.settlementDeletedError', { error: err.message }));
    }
  };

  if (loading) {
    return <div className="text-center py-8">{t('auth.adminSettlements.loading')}</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-4">
        <h1 className="text-2xl font-bold mb-2 sm:mb-0">{t('auth.adminSettlements.manageAvailableSettlements')}</h1>
        <div className="flex flex-wrap gap-2 items-center">
          <label className="flex items-center gap-1 text-xs font-medium" title="Replace all settlements with this file">
            <input
              type="checkbox"
              checked={replaceAll}
              onChange={e => setReplaceAll(e.target.checked)}
              className="accent-yellow-500 w-4 h-4"
            />
            <span>{t('auth.adminSettlements.upload.replaceAll')}</span>
          </label>
          {replaceAll && (
            <span className="text-xs text-red-600 flex items-center gap-1">
              <FaExclamationTriangle className="inline mr-1" />
              {t('auth.adminSettlements.upload.replaceWarning')}
            </span>
          )}
          <label htmlFor="firestore-upload" className="bg-blue-500 hover:bg-blue-600 text-white px-2.5 py-1.5 rounded cursor-pointer flex items-center gap-1 text-xs" title="Upload a JSON or CSV file to add settlements">
            <FaUpload />
            {uploading ? (
              <span className="flex items-center gap-1"><FaSpinner className="animate-spin" /> {t('auth.adminSettlements.upload.uploading')}</span>
            ) : (
              t('auth.adminSettlements.upload.uploadButton')
            )}
            <input id="firestore-upload" name="firestore-upload" type="file" accept=".json,.csv,application/json,text/csv" onChange={handleUploadFile} style={{ display: 'none' }} disabled={uploading} />
          </label>
          <button
            onClick={() => setShowSettlementModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-2.5 py-1.5 rounded flex items-center gap-1 text-xs shadow"
          >
            <FaPlus /> {t('auth.adminSettlements.actions.addEdit')}
          </button>
          <button
            onClick={() => setSelected('admins')}
            className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold px-2.5 py-1.5 rounded flex items-center gap-1 text-xs shadow"
          >
            <FaUserShield /> {t('auth.adminSettlements.actions.admins')}
          </button>
        </div>
      </div>
      {/* Availability Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-6 flex gap-3 justify-center">
        <button
          onClick={() => setAvailabilityFilter('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition font-semibold
            ${availabilityFilter === 'all' ? 'bg-yellow-400 text-black' : 'bg-gray-100 text-gray-700 hover:bg-yellow-100'}`}
        >
          <FaList /> {t('auth.adminSettlements.filters.all')}
        </button>
        <button
          onClick={() => setAvailabilityFilter('available')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition font-semibold
            ${availabilityFilter === 'available' ? 'bg-green-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-green-100'}`}
        >
          <FaCheckCircle /> {t('auth.adminSettlements.filters.available')}
        </button>
          <button
          onClick={() => setAvailabilityFilter('disabled')}
          className={`flex items-center gap-2 px-4 py-2 rounded-full shadow-sm transition font-semibold
            ${availabilityFilter === 'disabled' ? 'bg-red-400 text-white' : 'bg-gray-100 text-gray-700 hover:bg-red-100'}`}
          >
          <FaMinusCircle /> {t('auth.adminSettlements.filters.disabled')}
          </button>
        </div>
      {/* Search and Filter Input */}
      <div className="relative w-full max-w-md mx-auto mb-6">
        <input
          type="text"
          placeholder={t('auth.adminSettlements.search.placeholder')}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className={`pl-10 pr-10 py-2 rounded-full border border-gray-300 shadow-sm focus:ring-2 focus:ring-yellow-400 focus:border-yellow-400 w-full ${isRTL ? 'text-right' : ''}`}
          dir={isRTL ? 'rtl' : 'ltr'}
          aria-label="Search settlements"
        />
        <FaMapMarkerAlt className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 transform -translate-y-1/2 text-yellow-400`} />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className={`absolute ${isRTL ? 'left-3' : 'right-3'} top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none`}
            aria-label="Clear search"
            tabIndex={0}
          >
            &#10005;
          </button>
        )}
      </div>
      {/* Results Count */}
      <div className="text-sm text-gray-600 mb-4 text-center">
        {i18n.t('auth.adminSettlements.showingSettlements', {
          count: filteredSettlements.length,
        })}
      </div>
      {/* Settlements List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-6 m-2 border rounded-xl shadow min-h-[320px] flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <Skeleton height={24} width={24} circle style={{ marginRight: 8 }} />
                <div>
                  <Skeleton height={24} width={100} style={{ marginBottom: 4 }} />
                  <Skeleton height={18} width={60} />
                </div>
              </div>
              <Skeleton height={18} width={80} style={{ marginBottom: 16 }} />
              <Skeleton count={3} height={18} style={{ marginBottom: 8 }} />
              <Skeleton height={36} width="100%" />
            </div>
          ))}
        </div>
      ) : filteredSettlements.length === 0 ? (
        <EmptyState
          icon={<FaSearch />}
          title="No settlements found"
          message="Try adjusting your search or filters."
          actionLabel="Clear Search"
          onAction={() => setSearchQuery('')}
        />
      ) : (
        <>
        {/* Responsive settlements list: mobile = cards, md+ = grid */}
        <div>
          {/* Mobile: single column, compact cards */}
          <div className="block md:hidden w-full flex flex-col gap-3 items-center">
            {paginatedSettlements.map((settlement, index) => {
              const enabled = availableSettlements.includes(settlement.name);
              const adminInfo = Object.entries(settlementAdmins).find(
                ([key]) => key.trim() === settlement.name.trim()
              )?.[1] || {};
              return (
                <div
                  key={`mobile-${index}-${settlement.name}-${settlement.english_name || ''}-${settlement.shem_napa || ''}`}
                  className="rounded-lg shadow p-2 flex flex-col w-full max-w-xs sm:max-w-sm"
                  style={{ backgroundColor: enabled ? '#f6fffa' : '#f9fafb' }}
                >
                  <div className="flex items-center gap-3 mb-1">
                    <div className={`w-6 h-6 rounded-full border ${enabled ? 'border-green-400' : 'border-gray-300'}`} style={{ backgroundColor: enabled ? '#bbf7d0' : '#f3f4f6' }}></div>
                    <div className="font-medium text-gray-900 text-sm flex-1 truncate">
                      {settlement.name}
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-1">
                    <div className="text-xs text-gray-500">
                      {adminInfo && adminInfo.username && (
                        <div>Admin: {adminInfo.username}</div>
                      )}
                      {adminInfo && adminInfo.email && (
                        <div>Email: {adminInfo.email}</div>
                      )}
                      {adminInfo && adminInfo.phone && (
                        <div>Phone: {adminInfo.phone}</div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ml-2 ${enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{enabled ? 'Available' : 'Disabled'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 justify-end">
                    <div className="flex space-x-2">
                      {enabled ? (
                        <button
                          onClick={() => {
                            setSettlementToDisable(settlement.name);
                            setShowConfirmModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Disable settlement"
                        >
                          <FaTrash />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnableSettlement(settlement)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Enable settlement"
                        >
                          <FaPlus />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {/* Desktop: grid layout, keep old style */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 w-full">
            {paginatedSettlements.map((settlement, index) => {
              const enabled = availableSettlements.includes(settlement.name);
              const adminInfo = Object.entries(settlementAdmins).find(
                ([key]) => key.trim() === settlement.name.trim()
              )?.[1] || {};
              return (
                <div
                  key={`desktop-${index}-${settlement.name}-${settlement.english_name || ''}-${settlement.shem_napa || ''}`}
                  className={`rounded-xl shadow flex flex-col justify-between w-full min-w-0 ${enabled ? 'bg-green-50' : 'bg-gray-50'}`}
                  style={{ minHeight: '160px' }}
                >
                  <div className="flex items-center gap-3 p-3 pb-0">
                    <div className={`w-6 h-6 rounded-full border ${enabled ? 'border-green-400' : 'border-gray-300'}`} style={{ backgroundColor: enabled ? '#bbf7d0' : '#f3f4f6' }}></div>
                    <div className="font-medium text-gray-900 text-base flex-1 truncate">
                      {settlement.name}
                    </div>
                  </div>
                  <div className="flex items-start justify-between px-3 pt-1">
                    <div className="text-xs text-gray-500">
                      {adminInfo && adminInfo.username && (
                        <div>Admin: {adminInfo.username}</div>
                      )}
                      {adminInfo && adminInfo.email && (
                        <div>Email: {adminInfo.email}</div>
                      )}
                      {adminInfo && adminInfo.phone && (
                        <div>Phone: {adminInfo.phone}</div>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium mt-1 ml-2 ${enabled ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{enabled ? 'Available' : 'Disabled'}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 justify-end px-3 pb-3">
                    <div className="flex space-x-2">
                      {enabled ? (
                        <button
                          onClick={() => {
                            setSettlementToDisable(settlement.name);
                            setShowConfirmModal(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title="Disable settlement"
                        >
                          <FaTrash />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnableSettlement(settlement)}
                          className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50"
                          title="Enable settlement"
                        >
                          <FaPlus />
                        </button>
                      )}
                      {enabled ? (
                        <element></element>
                      ):(
                      <button
                        onClick={async () => {
                          try {
                            const settlementDoc = await getDocs(collection(db, 'settlements'));
                            const docToDelete = settlementDoc.docs.find(doc => doc.data().name === settlement.name);
                            if (docToDelete) {
                              await deleteDoc(docToDelete.ref);
                              toast.success(t('auth.adminSettlements.toastMessages.settlementDeletedSuccess'));
                              setAllSettlements(prev => prev.filter(s => s.name !== settlement.name));
                            } else {
                              toast.error(t('auth.adminSettlements.toastMessages.settlementDeletedError', { error: 'Settlement not found' }));
                            }
                          } catch (err) {
                            console.error('Failed to delete settlement:', err);
                            toast.error(t('auth.adminSettlements.toastMessages.settlementDeletedError', { error: err.message }));
                          }
                        }}
                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                        title="Delete settlement"
                      >
                        <FaTrash />
                      </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
              {t('auth.adminSettlements.pagination.previous')}
            </button>
            <span className="text-sm text-gray-600">
              {i18n.t('auth.adminSettlements.pagination.pageInfo', {
                current: page, total: totalPages
              })} 
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === totalPages}
              className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
              aria-label="Next page"
            >
              {t('auth.adminSettlements.pagination.next')}
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
        onCancel={() => {
          setShowConfirmModal(false);
          setSettlementToDisable(null);
        }}
        onConfirm={async () => {
          await handleDisableSettlement(settlementToDisable);
          setShowConfirmModal(false);
          setSettlementToDisable(null);
        }}
        loading={disablingSettlement}
      />
      {/* Settlement Modal */}
      {showSettlementModal && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{settlementForm.isEdit ? t('auth.adminSettlements.popup.editSettlement') : t('auth.adminSettlements.popup.addSettlement')}</h2>
            <div className="mb-4 relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('auth.adminSettlements.popup.settlementName')}</label>
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
                placeholder={t('auth.adminSettlements.popup.searchPlaceholder')}
                autoComplete="off"
              />
              {/* Suggestions dropdown */}
              {showSuggestions && settlementForm.name && filteredModalSettlements.length > 0 && (
                <ul className="absolute z-10 bg-white border border-gray-200 rounded w-full mt-1 max-h-40 overflow-y-auto shadow-lg">
                  {filteredModalSettlements.map((s, idx) => (
                    <li
                      key={`suggestion-${idx}-${s.name}-${s.english_name || ''}-${s.shem_napa || ''}`}
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
                {t('auth.adminSettlements.popup.cancel')}
              </button>
              <button
                onClick={handleSaveSettlement}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              >
                {t('auth.adminSettlements.popup.save')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal for Replace All */}
      {showConfirmModal && pendingFile && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-md shadow-lg flex flex-col items-center">
            <FaExclamationTriangle className="text-4xl text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2 text-center">{t('auth.adminSettlements.confirmationModal.title')}</h2>
            <p className="text-center mb-6">
              {t('auth.adminSettlements.confirmationModal.message')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={async () => {
                  setShowConfirmModal(false);
                  if (pendingFile) await doUpload(pendingFile);
                }}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-bold"
              >
                {t('auth.adminSettlements.confirmationModal.confirmButton')}
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setPendingFile(null);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded font-bold"
              >
                {t('auth.adminSettlements.confirmationModal.cancelButton')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{t('auth.adminSettlements.editModal.title')}</h2>
            <div className="mb-4 grid grid-cols-1 gap-2">
              <label className="text-sm font-medium">{t('auth.adminSettlements.editModal.fields.name')}
                <input name="name" value={editForm.name} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">{t('auth.adminSettlements.editModal.fields.englishName')}
                <input name="english_name" value={editForm.english_name} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">{t('auth.adminSettlements.editModal.fields.region')}
                <input name="shem_napa" value={editForm.shem_napa} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">{t('auth.adminSettlements.editModal.fields.municipality')}
                <input name="shem_moaatza" value={editForm.shem_moaatza} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
              <label className="text-sm font-medium">{t('auth.adminSettlements.editModal.fields.office')}
                <input name="lishka" value={editForm.lishka} onChange={handleEditChange} className="border px-2 py-1 rounded w-full" />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setEditModal({ open: false, settlement: null })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('auth.adminSettlements.editModal.cancelButton')}
              </button>
              <button
                onClick={handleEditSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                {t('auth.adminSettlements.editModal.saveButton')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Delete Modal */}
      {deleteModal.open && (
        <div className="fixed inset-0 backdrop-blur-sm bg-black/5 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4 text-center text-red-600">{t('auth.adminSettlements.deleteModal.title')}</h2>
            <p className="mb-6 text-center">
              {i18n.t('auth.adminSettlements.deleteModal.message', { settlementName: deleteModal.settlement.name })}
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteModal({ open: false, settlement: null })}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {t('auth.adminSettlements.deleteModal.cancelButton')}
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                {t('auth.adminSettlements.deleteModal.deleteButton')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettlements;
