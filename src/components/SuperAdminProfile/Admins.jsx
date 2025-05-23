import React from 'react';
import { FaTrash } from 'react-icons/fa';

const Admins = ({ settlements, handleEditAdmin, handleDeleteAdmin, setFormData, setIsEditing, setShowModal }) => {
  return (
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
  );
};

export default Admins;
