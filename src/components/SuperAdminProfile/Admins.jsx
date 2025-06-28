import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaEye, FaUsers } from 'react-icons/fa';
import { db } from '../../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-hot-toast';

const AdminManagement = () => {
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
      toast.error('Failed to fetch admins');
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
      toast.error('Please fill in all required fields');
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

    try {
      const adminRef = doc(db, 'users', selectedAdmin.id);
      await updateDoc(adminRef, {
        'credentials.username': formData.name,
        'credentials.email': formData.email,
        'idVerification.firstName': formData.name,
        'idVerification.settlement': formData.settlement,
        'idVerification.phone': formData.phone
      });

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
              Cancel
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading admins...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Admin Management</h1>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Admin Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Settlement
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered Retirees
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {admins.map((admin) => (
              <tr key={admin.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {admin.credentials?.username || admin.idVerification?.firstName || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {admin.idVerification?.settlement || admin.settlement || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {admin.credentials?.email || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {admin.credentials?.phone || admin.idVerification?.phone || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    <FaUsers className="mr-1" />
                    {retireeCounts[admin.idVerification?.settlement] || 0} retirees
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => openViewModal(admin)}
                      className="text-blue-600 hover:text-blue-900"
                      title="View"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => openEditModal(admin)}
                      className="text-yellow-600 hover:text-yellow-900"
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDeleteAdmin(admin)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete admin"
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

      {/* Edit Admin Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Admin"
        onSubmit={handleEditAdmin}
        submitText="Update Admin"
      >
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
      </Modal>

      {/* View Admin Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Admin Details"
      >
        {selectedAdmin && (
          <div className="space-y-4">
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
        )}
      </Modal>
    </div>
  );
};

export default AdminManagement;
