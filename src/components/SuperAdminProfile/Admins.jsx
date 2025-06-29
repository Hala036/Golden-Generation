import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaEye, FaUsers, FaUserShield } from 'react-icons/fa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import EmptyState from '../EmptyState';
import { useLanguage } from '../../context/LanguageContext';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

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
      toast.error(t('admin.management.messages.failedToFetchAdmins'));
      setLoading(false);
    });
    return () => unsub();
  }, [t]);

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
        counts[normSettle] = retirees.filter(r =>
          (r.idVerification?.settlement && r.idVerification.settlement.trim().normalize('NFC') === normSettle) ||
          (r.settlement && r.settlement.trim().normalize('NFC') === normSettle)
        ).length;
      }
      setRetireeCounts(counts);
    });
    return () => unsub();
  }, [admins]);

  const handleAddAdmin = async () => {
    if (!formData.name || !formData.email || !formData.settlement) {
      toast.error(t('admin.management.messages.fillRequiredFields'));
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

      toast.success(t('admin.management.messages.adminAddedSuccess'));
      setShowAddModal(false);
      resetForm();
    } catch (error) {
      console.error('Error adding admin:', error);
      toast.error(t('admin.management.messages.failedToAddAdmin'));
    }
  };

  const handleEditAdmin = async () => {
    if (!selectedAdmin || !formData.name || !formData.email || !formData.settlement) {
      toast.error(t('admin.management.messages.fillRequiredFields'));
      return;
    }

    try {
      const adminRef = doc(db, 'users', selectedAdmin.id);
      await updateDoc(adminRef, {
        'credentials.username': formData.name,
        'credentials.email': formData.email,
        'idVerification.firstName': formData.name,
        'idVerification.settlement': formData.settlement,
        'idVerification.phone': formData.phone
      });

      toast.success(t('admin.management.messages.adminUpdatedSuccess'));
      setShowEditModal(false);
      resetForm();
    } catch (error) {
      console.error('Error updating admin:', error);
      toast.error(t('admin.management.messages.failedToUpdateAdmin'));
    }
  };

  const handleDeleteAdmin = async (admin) => {
    const adminName = admin.credentials?.username || admin.idVerification?.firstName;
    const confirmDelete = window.confirm(
      t('admin.management.messages.confirmDelete', { adminName })
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

      toast.success(t('admin.management.messages.adminDeletedSuccess'));
    } catch (error) {
      console.error('Error deleting admin:', error);
      toast.error(t('admin.management.messages.failedToDeleteAdmin'));
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

  // Modal component
  const Modal = ({ isOpen, onClose, title, children, onSubmit, submitText }) => {
    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">{title}</h2>
          {children}
          <div className="flex justify-end gap-2 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              {t('common.cancel')}
            </button>
            {onSubmit && (
              <button
                onClick={onSubmit}
                className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600"
              >
                {submitText}
              </button>
            )}
          </div>
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
        <div className="text-lg">{t('admin.management.loadingAdmins')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.management.title')}</h1>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {admins.length === 0 ? (
          <EmptyState
            icon={<FaUserShield className="text-6xl text-gray-300" />}
            title={t('emptyStates.noAdmins')}
            message={t('emptyStates.noAdminsMessage')}
            actionLabel={t('emptyStates.addAdmin')}
            onAction={openAddModal}
            className="p-8"
          />
        ) : (
          <>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.management.table.adminName')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.management.table.settlement')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.management.table.email')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.management.table.phone')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.management.table.registeredRetirees')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('admin.management.table.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {admin.credentials?.username || admin.idVerification?.firstName || t('common.notAvailable')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {admin.idVerification?.settlement || admin.settlement || t('common.notAvailable')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.credentials?.email || t('common.notAvailable')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admin.credentials?.phone || admin.idVerification?.phone || t('common.notAvailable')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <FaUsers className="mr-1" />
                        {retireeCounts[admin.idVerification?.settlement] || 0} {t('admin.management.table.retirees')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openViewModal(admin)}
                          className="text-blue-600 hover:text-blue-900"
                          title={t('admin.management.viewAdmin')}
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => openEditModal(admin)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title={t('admin.management.editAdmin')}
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin)}
                          className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                          title={t('admin.management.deleteAdmin')}
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>

      {/* Edit Admin Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('admin.management.modal.editTitle')}
        onSubmit={handleEditAdmin}
        submitText={t('admin.management.updateAdmin')}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.management.form.adminName')} *
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('admin.management.form.adminNamePlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.management.form.email')} *
            </label>
            <input
              type="email"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t('admin.management.form.emailPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.management.form.settlement')} *
            </label>
            <input
              type="text"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.settlement}
              onChange={(e) => setFormData({ ...formData, settlement: e.target.value })}
              placeholder={t('admin.management.form.settlementPlaceholder')}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('admin.management.form.phone')}
            </label>
            <input
              type="tel"
              className="border px-3 py-2 rounded-md w-full"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t('admin.management.form.phonePlaceholder')}
            />
          </div>
        </div>
      </Modal>

      {/* View Admin Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={t('admin.management.modal.viewTitle')}
      >
        {selectedAdmin && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.management.table.adminName')}
              </label>
              <p className="text-sm text-gray-900">
                {selectedAdmin.credentials?.username || selectedAdmin.idVerification?.firstName || t('common.notAvailable')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.management.table.email')}
              </label>
              <p className="text-sm text-gray-900">
                {selectedAdmin.credentials?.email || t('common.notAvailable')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.management.table.settlement')}
              </label>
              <p className="text-sm text-gray-900">
                {selectedAdmin.idVerification?.settlement || t('common.notAvailable')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.management.table.phone')}
              </label>
              <p className="text-sm text-gray-900">
                {selectedAdmin.idVerification?.phone || t('common.notAvailable')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.management.table.registeredRetirees')}
              </label>
              <p className="text-sm text-gray-900">
                {retireeCounts[selectedAdmin.idVerification?.settlement] || 0} {t('admin.management.table.retirees')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('admin.management.modal.createdAt')}
              </label>
              <p className="text-sm text-gray-900">
                {selectedAdmin.createdAt ? new Date(selectedAdmin.createdAt).toLocaleDateString() : t('common.notAvailable')}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminManagement;
