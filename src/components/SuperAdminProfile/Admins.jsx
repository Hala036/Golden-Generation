import React, { useState, useEffect, useRef } from 'react';
import { FaEdit, FaTrash, FaPlus, FaEye, FaUsers, FaUserShield, FaSearch } from 'react-icons/fa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import EmptyState from '../EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import i18n from '../../i18n';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { validatePhoneNumber } from '../../utils/validation';
import AdminForm from '../SignUp/AdminForm';

const AdminFormFields = ({ formData, setFormData }) => (
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Admin Name *
      </label>
      <input
        type="text"
        className="border px-3 py-2 rounded-md w-full"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        placeholder="Enter admin name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Email *
      </label>
      <input
        type="email"
        className="border px-3 py-2 rounded-md w-full"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        placeholder="Enter email address"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Settlement *
      </label>
      <input
        type="text"
        className="border px-3 py-2 rounded-md w-full"
        value={formData.settlement}
        onChange={(e) => setFormData({ ...formData, settlement: e.target.value })}
        placeholder="Enter settlement name"
      />
    </div>
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Phone
      </label>
      <input
        type="tel"
        className="border px-3 py-2 rounded-md w-full"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        placeholder="Enter phone number"
      />
    </div>
  </div>
);

const AdminManagement = () => {
  const { t } = useLanguage();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [retireeCounts, setRetireeCounts] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    settlement: '',
    phone: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const prevShowEditModal = useRef(false);

  // Real-time admins from Firestore
  useEffect(() => {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('role', '==', 'admin'));
    const unsub = onSnapshot(adminQuery, (adminSnapshot) => {
      const adminsData = adminSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAdmins(adminsData);
      setLoading(false);
    }, (error) => {
      console.error('Firebase connection error:', error);
      toast.error('Failed to fetch admins. Please check your internet connection.');
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Real-time retiree counts for each admin's settlement
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const retireeQuery = query(usersRef, where('role', '==', 'retiree'));
    const unsub = onSnapshot(retireeQuery, (retireeSnapshot) => {
      // Get all retirees
      const retirees = retireeSnapshot.docs.map(doc => doc.data());
      // Get all settlements assigned to admins
      const settlements = admins.map(admin => admin.idVerification?.settlement || admin.settlement).filter(Boolean);
      // Count retirees for each settlement
      const counts = {};
      for (const settlement of settlements) {
        const normSettle = settlement.trim().normalize('NFC');
        console.log('Admin settlement:', normSettle);
        counts[normSettle] = retirees.filter(r => {
          const retireeSettle1 = r.idVerification?.settlement ? r.idVerification.settlement.trim().normalize('NFC') : null;
          const retireeSettle2 = r.settlement ? r.settlement.trim().normalize('NFC') : null;
          console.log('Comparing to retiree:', retireeSettle1, retireeSettle2);
          return (retireeSettle1 === normSettle) || (retireeSettle2 === normSettle);
        }).length;
      }
      setRetireeCounts(counts);
    });
    return () => unsub();
  }, [admins]);

  // Helper functions for validation
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^\d{9,15}$/.test(phone.replace(/\D/g, ''));
  const isValidUsername = (username) => /^[A-Za-z\u0590-\u05FF0-9_ ]+$/.test(username);

  const isDuplicateEmail = (email, excludeId = null) => {
    return admins.some(admin =>
      admin.credentials?.email === email && admin.id !== excludeId
    );
  };
  const isDuplicateSettlement = (settlement, excludeId = null) => {
    return admins.some(admin =>
      (admin.idVerification?.settlement || admin.settlement) === settlement && admin.id !== excludeId
    );
  };

  const handleAddAdmin = async () => {
    if (!formData.name || !formData.email || !formData.settlement) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Username validation: allow Hebrew, English, numbers, underscore, space
    if (!isValidUsername(formData.name)) {
      toast.error('שם משתמש יכול להכיל אותיות בעברית, אנגלית, מספרים, רווחים וקו תחתון בלבד');
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (formData.phone) {
      const phoneError = validatePhoneNumber(formData.phone);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }
    if (isDuplicateEmail(formData.email)) {
      toast.error('An admin with this email already exists');
      return;
    }
    if (isDuplicateSettlement(formData.settlement)) {
      toast.error('An admin is already assigned to this settlement');
      return;
    }
    try {
      // Create admin document
      const adminData = {
        credentials: {
          username: formData.name,
          email: formData.email
        },
        idVerification: {
          firstName: formData.name,
          settlement: formData.settlement,
          phone: formData.phone
        },
        role: 'admin',
        createdAt: new Date().toISOString()
      };

      const adminRef = doc(collection(db, 'users'));
      await setDoc(adminRef, adminData);

      // Add settlement to availableSettlements if not exists
      const settlementRef = doc(db, 'availableSettlements', formData.settlement);
      await setDoc(settlementRef, {
        available: true,
        adminId: adminRef.id
      }, { merge: true });

      toast.success('Admin added successfully!');
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error('Failed to add admin');
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin || !formData.name || !formData.email || !formData.settlement) {
      toast.error('Please fill in all required fields');
      return;
    }
    // Username validation: allow Hebrew, English, numbers, underscore, space
    if (!isValidUsername(formData.name)) {
      toast.error('שם משתמש יכול להכיל אותיות בעברית, אנגלית, מספרים, רווחים וקו תחתון בלבד');
      return;
    }
    if (!isValidEmail(formData.email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    if (formData.phone) {
      const phoneError = validatePhoneNumber(formData.phone);
      if (phoneError) {
        toast.error(phoneError);
        return;
      }
    }
    if (isDuplicateEmail(formData.email, selectedAdmin.id)) {
      toast.error('An admin with this email already exists');
      return;
    }
    if (isDuplicateSettlement(formData.settlement, selectedAdmin.id)) {
      toast.error('An admin is already assigned to this settlement');
      return;
    }
    try {
      const adminRef = doc(db, 'users', selectedAdmin.id);
      await updateDoc(adminRef, {
        'credentials.username': formData.name,
        'credentials.email': formData.email,
        'credentials.phone': formData.phone,
        'idVerification.firstName': formData.name,
        'idVerification.settlement': formData.settlement,
        'idVerification.phone': formData.phone,
        'role': 'admin'
      });

      // Update the availableSettlements document with new admin details (same as add logic)
      const settlementRef = doc(db, 'availableSettlements', formData.settlement);
      await setDoc(settlementRef, {
        available: true,
        adminId: selectedAdmin.id,
        adminUsername: formData.name,
        adminEmail: formData.email,
        adminPhone: formData.phone
      }, { merge: true });

      toast.success('Admin updated successfully!');
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error('Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete admin "${admin.credentials?.username || admin.idVerification?.firstName}"?\n\nThis will also remove the settlement from available settlements.`
    );

    if (!confirmDelete) return;

    try {
      // Delete admin user
      await deleteDoc(doc(db, 'users', admin.id));

      // Remove settlement from availableSettlements
      const settlement = admin.idVerification?.settlement;
      if (settlement) {
        await deleteDoc(doc(db, 'availableSettlements', settlement));
      }

      toast.success('Admin deleted successfully!');
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error('Failed to delete admin');
    }
  };

  const openEditModal = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.credentials?.username || admin.idVerification?.firstName || '',
      email: admin.credentials?.email || '',
      settlement: admin.idVerification?.settlement || '',
      phone: admin.idVerification?.phone || ''
    });
    setShowEditModal(true);
  };

  const openViewModal = (admin) => {
    setSelectedAdmin(admin);
    setShowViewModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      settlement: '',
      phone: ''
    });
    setSelectedAdmin(null);
  };

  const openAddModal = () => {
    resetForm();
    setShowAddModal(true);
  };

  // Filter admins based on search query
  const filteredAdmins = admins.filter(admin => {
    const searchLower = searchQuery.toLowerCase();
    const name = (admin.credentials?.username || admin.idVerification?.firstName || '').toLowerCase();
    const email = (admin.credentials?.email || '').toLowerCase();
    const settlement = (admin.idVerification?.settlement || admin.settlement || '').toLowerCase();
    const phone = (admin.credentials?.phone || admin.idVerification?.phone || '').toLowerCase();
    
    return name.includes(searchLower) || 
           email.includes(searchLower) || 
           settlement.includes(searchLower) || 
           phone.includes(searchLower);
  });

  // Modal component
  const Modal = ({ isOpen, onClose, title, children, showClose }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 backdrop-blur-sm bg-black/10 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md relative">
          {showClose && (
            <button
              className="absolute top-0 right-0 mt-2 mr-2 text-2xl text-gray-400 hover:text-gray-600 z-20"
              onClick={onClose}
              aria-label="Close"
              style={{ lineHeight: 1 }}
            >
              &times;
            </button>
          )}
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          {children}
        </div>
      </div>
    );
  };

  // Loading skeleton for admins
  const AdminsSkeleton = () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 border rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-5 bg-gray-200 rounded w-32 mb-1"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            </div>
            <div className="flex space-x-2">
              <div className="h-6 bg-gray-200 rounded w-16"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
              <div className="h-6 bg-gray-200 rounded w-6"></div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-20 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-16 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-18"></div>
            </div>
            <div>
              <div className="h-3 bg-gray-200 rounded w-12 mb-1"></div>
              <div className="h-4 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Loading skeleton for table rows
  const TableSkeleton = () => (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3 flex-1">
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            <div>
              <div className="h-4 bg-gray-200 rounded w-32 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-40"></div>
            </div>
          </div>
          <div className="h-6 bg-gray-200 rounded w-20 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-24 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-16 mx-4"></div>
          <div className="h-6 bg-gray-200 rounded w-20 mx-4"></div>
          <div className="flex space-x-2">
            <div className="h-6 bg-gray-200 rounded w-6"></div>
            <div className="h-6 bg-gray-200 rounded w-6"></div>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">{t('superadmin.admins.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{t("superadmin.admins.title")}</h1>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <FaSearch className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500"
          placeholder={t("superadmin.admins.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Admins Content */}
      {filteredAdmins.length === 0 ? (
        <EmptyState
          icon={<FaUserShield className="text-6xl text-gray-300" />}
          title={searchQuery ? t("superadmin.admins.noAdmins") : t("superadmin.admins.noAdmins")}
          message={
            searchQuery
              ? t("superadmin.admins.noAdminsMessage", { searchQuery })
              : t("superadmin.admins.noAdminsMessage")
          }
          actionLabel={searchQuery ? t("superadmin.admins.clearSearch") : t("superadmin.admins.addAdmin")}
          onAction={searchQuery ? () => setSearchQuery('') : openAddModal}
          className="p-8"
        />
      ) : (
        <>
          {/* Table for Larger Screens */}
          <div className="hidden sm:block">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("superadmin.admins.table.name")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("superadmin.admins.table.settlement")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("superadmin.admins.table.email")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("superadmin.admins.table.phone")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("superadmin.admins.table.retirees")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("superadmin.admins.table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.credentials?.username || admin.idVerification?.firstName || t("common.notAvailable")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {admin.idVerification?.settlement || admin.settlement || t("common.notAvailable")}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.credentials?.email || t("common.notAvailable")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.credentials?.phone || admin.idVerification?.phone || t("common.notAvailable")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FaUsers className="mr-1 ml-1" />
                        {i18n.t("superadmin.admins.retireesCount", {
                          count: retireeCounts[admin.idVerification?.settlement] || retireeCounts[admin.settlement] || 0
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(admin)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t("common.view")}
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => openEditModal(admin)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={t("common.edit")}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-red-600 hover:text-red-900"
                          title={t("common.delete")}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Add Admin Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Admin"
      >
        {showAddModal && (
          <AdminFormFields formData={formData} setFormData={setFormData} />
        )}
      </Modal>

      {/* Edit Admin Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Admin"
      >
        {showEditModal && selectedAdmin && (
          <AdminForm
            initialValues={{
              email: selectedAdmin.credentials?.email || '',
              username: selectedAdmin.credentials?.username || selectedAdmin.idVerification?.firstName || '',
              phone: selectedAdmin.idVerification?.phone || '',
            }}
            loading={false}
            buttonText="Update Admin"
            onSubmit={(data) => {
              if (data) {
                setFormData({
                  name: data.username,
                  email: data.email,
                  settlement: selectedAdmin.idVerification?.settlement || '',
                  phone: data.phone,
                });
                handleEditAdmin();
              } else {
                setShowEditModal(false);
              }
            }}
          />
        )}
      </Modal>

      {/* View Admin Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Admin Details"
        showClose={true}
      >
        {showViewModal && selectedAdmin && (
          <div>
            <div className="space-y-4 pt-2 pr-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAdmin.credentials?.username || selectedAdmin.idVerification?.firstName || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAdmin.credentials?.email || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Settlement
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAdmin.idVerification?.settlement || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAdmin.idVerification?.phone || 'N/A'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Registered Retirees
                </label>
                <p className="text-sm text-gray-900">
                  {retireeCounts[selectedAdmin.idVerification?.settlement] || 0} retirees
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Created At
                </label>
                <p className="text-sm text-gray-900">
                  {selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminManagement;
