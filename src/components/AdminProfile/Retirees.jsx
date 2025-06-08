import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";

const Retirees = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState([]);
  const [retirees, setRetirees] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchAdminSettlementCalled = useRef(false);

  // Fetch admin's settlement
  useEffect(() => {
    const fetchAdminSettlement = async () => {
      if (fetchAdminSettlementCalled.current) return;
      fetchAdminSettlementCalled.current = true;

      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          console.error("No logged-in user found.");
          setLoading(false);
          return;
        }

        const adminDocRef = doc(db, "users", user.uid);
        const adminDoc = await getDoc(adminDocRef);

        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          if (adminData.role === "admin") {
            setAdminSettlement(adminData.idVerification?.settlement || null);
          } else {
            console.error("User is not an admin.");
          }
        } else {
          console.error("Admin document not found in the users collection.");
        }
      } catch (error) {
        console.error("Error fetching admin settlement:", error);
      }
    };

    fetchAdminSettlement();
  }, []);

  // Fetch retirees from Firestore
  useEffect(() => {
    const fetchRetirees = async () => {
      if (!adminSettlement) {
        if (!fetchAdminSettlementCalled.current) {
          console.error("Admin settlement is null or undefined. Cannot fetch retirees.");
        }
        setLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "users"),
          where("role", "==", "retiree"),
          where("idVerification.settlement", "==", adminSettlement)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const fetchedRetirees = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRetirees(fetchedRetirees);
        } else {
          console.error("No retirees found for the admin's settlement.");
        }
      } catch (error) {
        console.error("Error fetching retirees:", error);
      } finally {
        setLoading(false);
      }
    };

    if (adminSettlement) {
      fetchRetirees();
    }
  }, [adminSettlement]);

  const addFilter = () => {
    setDynamicFilters([...dynamicFilters, { key: "", value: "" }]);
  };

  const updateFilter = (index, key, value) => {
    const updatedFilters = [...dynamicFilters];
    updatedFilters[index] = { ...updatedFilters[index], [key]: value };
    setDynamicFilters(updatedFilters);
  };

  const removeFilter = (index) => {
    const updatedFilters = dynamicFilters.filter((_, i) => i !== index);
    setDynamicFilters(updatedFilters);
  };

  // Helper to flatten all values in a nested object
  const flattenObject = (obj) => {
    const result = [];

    const recursiveFlatten = (value) => {
      if (value === null || value === undefined) return;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        result.push(value.toString().toLowerCase());
      } else if (Array.isArray(value)) {
        value.forEach(recursiveFlatten);
      } else if (typeof value === "object") {
        Object.values(value).forEach(recursiveFlatten);
      }
    };

    recursiveFlatten(obj);
    return result;
  };

  const filteredRetirees = retirees.filter((retiree) => {
    const allValues = flattenObject(retiree);
    const matchesSearch = searchTerm === "" || allValues.some((val) => val.includes(searchTerm.toLowerCase()));

    const matchesDynamicFilters = dynamicFilters.every((filter) => {
      if (!filter.key || !filter.value) return true;
      const value = retiree[filter.key];
      if (value === null || value === undefined) return false;
      if (Array.isArray(value)) {
        return value.some((v) =>
          v.toString().toLowerCase().includes(filter.value.toLowerCase())
        );
      }
      return value.toString().toLowerCase().includes(filter.value.toLowerCase());
    });

    return matchesSearch && matchesDynamicFilters;
  });

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("admin.retirees.title")}</h1>
        <button className="bg-yellow-400 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded">
          {t("admin.retirees.addRetiree")}
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t("admin.retirees.filters.search")}
            className="w-full p-2 border rounded"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Dynamic Filters */}
        <div className="space-y-4">
          {dynamicFilters.map((filter, index) => (
            <div key={index} className="flex space-x-4 items-center">
              <select
                className="p-2 border rounded"
                value={filter.key}
                onChange={(e) => updateFilter(index, "key", e.target.value)}
              >
                <option value="">{t("common.select")}</option>
                {retirees.length > 0 &&
                  Object.keys(retirees[0]).map((key) => (
                    <option key={key} value={key}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </option>
                  ))}
              </select>
              <input
                type="text"
                placeholder={t("admin.retirees.filters.enterValue")}
                className="p-2 border rounded"
                value={filter.value}
                onChange={(e) => updateFilter(index, "value", e.target.value)}
              />
              <button
                className="bg-[#FF4137] hover:bg-[#FF291E] text-white px-4 py-2 rounded"
                onClick={() => removeFilter(index)}
              >
                {t("admin.retirees.filters.remove")}
              </button>
            </div>
          ))}
          <button
            className="bg-[#7FDF7F] hover:bg-[#58D558] text-white px-4 py-2 rounded"
            onClick={addFilter}
          >
            {t("admin.retirees.filters.addFilter")}
          </button>
        </div>
      </div>

      {/* Retirees Table */}
      <div className="bg-white rounded shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.retirees.table.name")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.retirees.table.age")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.retirees.table.gender")}
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t("admin.retirees.table.work")}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredRetirees.map((retiree) => (
              <tr key={retiree.id}>
                <td className="px-6 py-4 whitespace-nowrap">{retiree.idVerification?.firstName || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">{retiree.idVerification?.age || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">{retiree.idVerification?.gender || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap">{retiree.workBackground?.customJobInfo?.originalSelection?.jobTitle || "N/A"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Retirees;
