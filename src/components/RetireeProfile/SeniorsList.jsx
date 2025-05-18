import React, { useState, useEffect } from 'react';
import { FaEdit, FaEye, FaTrash, FaPhone, FaMapMarkerAlt, FaBriefcase } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { Modal, Input, Select, Button } from 'antd';

const SeniorsList = () => {
  const [seniors, setSeniors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedSenior, setSelectedSenior] = useState(null);
  const [editForm, setEditForm] = useState({});

  // Mock data - replace with actual Firebase calls
  useEffect(() => {
    const mockSeniors = [
      {
        id: '1',
        name: 'David Cohen',
        age: 67,
        phone: '+972-50-123-4567',
        city: 'Tel Aviv',
        interests: ['Technology', 'Gardening'],
        workFields: ['Engineering', 'Consulting'],
        email: 'david.cohen@email.com'
      },
      {
        id: '2',
        name: 'Sarah Levy',
        age: 72,
        phone: '+972-54-987-6543',
        city: 'Jerusalem',
        interests: ['Arts', 'Cooking'],
        workFields: ['Education', 'Art Therapy'],
        email: 'sarah.levy@email.com'
      },
      {
        id: '3',
        name: 'Michael Ben-David',
        age: 65,
        phone: '+972-52-555-1234',
        city: 'Haifa',
        interests: ['Sports', 'Music'],
        workFields: ['Medicine', 'Sports Coaching'],
        email: 'michael.bendavid@email.com'
      }
    ];
    
    setTimeout(() => {
      setSeniors(mockSeniors);
      setLoading(false);
    }, 1000);
  }, []);

  const handleEdit = (senior) => {
    setSelectedSenior(senior);
    setEditForm({ ...senior });
    setEditModalVisible(true);
  };

  const handleDelete = async (seniorId) => {
    try {
      // Implement actual delete logic here
      setSeniors(seniors.filter(s => s.id !== seniorId));
      toast.success('Senior deleted successfully');
    } catch (error) {
      toast.error('Failed to delete senior');
    }
  };

  const handleSaveEdit = async () => {
    try {
      // Implement actual update logic here
      setSeniors(seniors.map(s => s.id === editForm.id ? editForm : s));
      setEditModalVisible(false);
      toast.success('Senior updated successfully');
    } catch (error) {
      toast.error('Failed to update senior');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">All Registered Seniors ({seniors.length})</h3>
        <Button type="primary" className="bg-yellow-500 border-yellow-500">
          Export Data
        </Button>
      </div>

      <div className="grid gap-4">
        {seniors.map((senior) => (
          <div key={senior.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-800">{senior.name}</h4>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Age:</span>
                    <span>{senior.age} years</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaPhone className="text-gray-400" />
                    <span>{senior.phone}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-gray-400" />
                    <span>{senior.city}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">Email:</span>
                    <span>{senior.email}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="mb-2">
                    <span className="font-medium text-gray-700">Interests: </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {senior.interests.map((interest, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Work Fields: </span>
                    <div className="inline-flex flex-wrap gap-1 mt-1">
                      {senior.workFields.map((field, index) => (
                        <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(senior)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit Senior"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(senior.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete Senior"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      <Modal
        title="Edit Senior Information"
        open={editModalVisible}
        onOk={handleSaveEdit}
        onCancel={() => setEditModalVisible(false)}
        okText="Save Changes"
        cancelText="Cancel"
      >
        {editForm && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Age</label>
              <Input
                type="number"
                value={editForm.age}
                onChange={(e) => setEditForm({...editForm, age: parseInt(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={editForm.phone}
                onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <Input
                value={editForm.city}
                onChange={(e) => setEditForm({...editForm, city: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Interests</label>
              <Select
                mode="tags"
                value={editForm.interests}
                onChange={(value) => setEditForm({...editForm, interests: value})}
                className="w-full"
                placeholder="Add interests"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Work Fields</label>
              <Select
                mode="tags"
                value={editForm.workFields}
                onChange={(value) => setEditForm({...editForm, workFields: value})}
                className="w-full"
                placeholder="Add work fields"
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SeniorsList;