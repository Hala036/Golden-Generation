import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import { useNavigate } from 'react-router-dom';
import Select from "react-select";
import interestsList from '../../data/interests.json';
import hobbiesList from '../../data/hobbies.json';
import jobsList from '../../data/jobs.json';
import volunteerAreasList from '../../data/volunteerAreas.json';
import EmptyState from '../EmptyState';
import { FaUsers } from 'react-icons/fa';
import i18n from "i18next";

const Retirees = () => {
  const { t } = useTranslation();
  const fieldGroups = [
    {
      label: t("admin.retirees.fieldGroups.personalInfo"),
      fields: [
        "idVerification.firstName",
        "idVerification.lastName",
        "idVerification.age",
        "idVerification.gender",
        "idVerification.settlement",
        "idVerification.phoneNumber",
        "idVerification.email",
        "personalDetails.maritalStatus",
        "personalDetails.education"
      ]
    },
    {
      label: t("admin.retirees.fieldGroups.work"),
      fields: [
        "workBackground.customJobInfo.originalSelection.jobTitle",
        "workBackground.customJobInfo.originalSelection.industry"
      ]
    },
    {
      label: t("admin.retirees.fieldGroups.lifestyle"),
      fields: [
        "lifestyle.interests",
        "lifestyle.hobbies"
      ]
    },
    {
      label: t("admin.retirees.fieldGroups.system"),
      fields: [
        "createdAt"
      ]
    }
  ];

  // Optional: group icons (add your own SVGs or emoji if desired)
  const groupIcons = {
    "Personal Info": "👤",
    "Work": "💼",
    "Lifestyle": "🌱",
    "System": "⚙️"
  };

  // Emoji mapping for interests
  const interestEmojis = {
    'Safety read books': '📚',
    'culture': '🎭',
    'cooking': '🍳',
    'trips': '✈️',
    'Photography': '📷',
    'sport': '🏆',
    'other': '🔍',
    "don't have": '❌',
    'study': '🎓',
    'gardening': '🌱',
    'computer': '💻',
    'craftsmanship': '🔨',
    'music': '🎵',
    'art': '🎨',
    'dancing': '💃',
    'hiking': '🥾',
    'meditation': '🧘',
    'yoga': '🧘‍♀️',
    'gaming': '🎮',
    'writing': '✍️',
    'volunteering': '🤝',
    'podcasts': '🎧',
    'movies': '🎬',
    'fashion': '👕',
    'languages': '🗣️',
    'astronomy': '🔭',
    'history': '📜',
    'science': '🔬',
    'technology': '📱',
    'baking': '🍰'
  };

  // Emoji mapping for hobbies (reuse interestEmojis and add new ones)
  const hobbyEmojis = {
    ...interestEmojis,
    'reading': '📖',
    'sports': '🏅',
    'technology': '💻',
    'science': '🔬',
    'fashion': '👗',
    'other': '🔍'
  };

  // Emoji mapping for jobs (partial, add more as needed)
  const jobEmojis = {
    'Doctor': '🩺',
    'Nurse': '👩‍⚕️',
    'Dentist': '🦷',
    'Pharmacist': '💊',
    'Software Engineer': '💻',
    'Civil Engineer': '🏗️',
    'Teacher': '👩‍🏫',
    'Lawyer': '⚖️',
    'Artist': '🎨',
    'Musician': '🎵',
    'Chef/Cook': '👨‍🍳',
    'Electrician': '💡',
    'Mechanic': '🔧',
    'Police Officer': '👮',
    'Firefighter': '🧑‍🚒',
    'Scientist': '🔬',
    'Volunteer': '🤝',
    'Retired': '🏖️',
    'Student': '📚',
    'Other': '❓'
  };

  // Emoji mapping for volunteer areas
  const volunteerAreaEmojis = {
    'publicity': '📢',
    'health': '🏥',
    'eater': '🍽️',
    'teaching': '👨‍🏫',
    'high-tech': '💻',
    'tourism': '🗺️',
    'safety': '🛡️',
    'funds': '💰',
    'special-treat': '🎉',
    'craftsmanship': '🔨',
    'aaliyah': '✈️',
    'culture': '🎭'
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [dynamicFilters, setDynamicFilters] = useState([]);
  const [retirees, setRetirees] = useState([]);
  const [adminSettlement, setAdminSettlement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [settlements, setSettlements] = useState([]);
  const fetchAdminSettlementCalled = useRef(false);
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);
  const [filterErrors, setFilterErrors] = useState([]);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [savedFilterSets, setSavedFilterSets] = useState([]);
  const [activeFilterSetName, setActiveFilterSetName] = useState(null);
  const [fieldSearch, setFieldSearch] = useState("");
  const [dropdownFocusIndex, setDropdownFocusIndex] = useState(-1);
  const fieldDropdownRefs = useRef([]);
  const searchInputRef = useRef(null);

  // Field definitions with user-friendly names and input types
  const fieldDefinitions = {
    "idVerification.firstName": {
      label: t("admin.retirees.fields.idVerification.firstName"),
      type: "text",
      path: ["idVerification", "firstName"]
    },
    "idVerification.lastName": {
      label: t("admin.retirees.fields.idVerification.lastName"),
      type: "text",
      path: ["idVerification", "lastName"]
    },
    "idVerification.age": {
      label: t("admin.retirees.fields.idVerification.age"),
      type: "range",
      path: ["idVerification", "age"]
    },
    "idVerification.gender": {
      label: t("admin.retirees.fields.idVerification.gender"),
      type: "select",
      options: ["Male", "Female", "Other"],
      path: ["idVerification", "gender"]
    },
    "idVerification.settlement": {
      label: t("admin.retirees.fields.idVerification.settlement"),
      type: "select",
      options: settlements,
      path: ["idVerification", "settlement"]
    },
    "idVerification.phoneNumber": {
      label: t("admin.retirees.fields.idVerification.phoneNumber"),
      type: "text",
      path: ["idVerification", "phoneNumber"]
    },
    "idVerification.email": {
      label: t("admin.retirees.fields.idVerification.email"),
      type: "text",
      path: ["idVerification", "email"]
    },
    "personalDetails.maritalStatus": {
      label: t("admin.retirees.fields.personalDetails.maritalStatus"),
      type: "select",
      options: [
          t("admin.retirees.options.maritalStatus.single"),
          t("admin.retirees.options.maritalStatus.married"),
          t("admin.retirees.options.maritalStatus.divorced"),
          t("admin.retirees.options.maritalStatus.widowed")
        ],
        path: ["personalDetails", "maritalStatus"]
    },
    "personalDetails.education": {
      label: t("admin.retirees.fields.personalDetails.education"),
      type: "select",
      options: [
        t("admin.retirees.options.education.none"),
        t("admin.retirees.options.education.primary"),
        t("admin.retirees.options.education.secondary"),
        t("admin.retirees.options.education.tertiary"),
        t("admin.retirees.options.education.other")
      ],
      path: ["personalDetails", "education"]
    },
    "personalDetails.healthCondition": {
      label: t("admin.retirees.fields.personalDetails.healthCondition"),
      type: "select",
      options: ["healthy", "withCaregiver", "nursing", "immobile"],
      path: ["personalDetails", "healthCondition"]
    },
    "personalDetails.hasCar": {
      label: t("admin.retirees.fields.personalDetails.hasCar"),
      type: "select",
      options: ["Yes", "No"],
      path: ["personalDetails", "hasCar"]
    },
    "personalDetails.livingAlone": {
      label: t("admin.retirees.fields.personalDetails.livingAlone"),
      type: "select",
      options: ["Yes", "No"],
      path: ["personalDetails", "livingAlone"]
    },
    "personalDetails.familyInSettlement": {
      label: t("admin.retirees.fields.personalDetails.familyInSettlement"),
      type: "select",
      options: ["Yes", "No"],
      path: ["personalDetails", "familyInSettlement"]
    },
    "personalDetails.hasWeapon": {
      label: t("admin.retirees.fields.personalDetails.hasWeapon"),
      type: "select",
      options: ["Yes", "No"],
      path: ["personalDetails", "hasWeapon"]
    },
    "personalDetails.militaryService": {
      label: t("admin.retirees.fields.personalDetails.militaryService"),
      type: "select",
      options: ["Yes", "No"],
      path: ["personalDetails", "militaryService"]
    },
    "workBackground.customJobInfo.originalSelection.jobTitle": {
      label: t("admin.retirees.fields.workBackground.customJobInfo.originalSelection.jobTitle"),
      type: "text",
      path: ["workBackground", "customJobInfo", "originalSelection", "jobTitle"]
    },
    "workBackground.customJobInfo.originalSelection.industry": {
      label: t("admin.retirees.fields.workBackground.customJobInfo.originalSelection.industry"),
      type: "text",
      path: ["workBackground", "customJobInfo", "originalSelection", "industry"]
    },
    "lifestyle.interests": {
      label: t("admin.retirees.fields.lifestyle.interests"),
      type: "text",
      path: ["lifestyle", "interests"]
    },
    "lifestyle.hobbies": {
      label: t("admin.retirees.fields.lifestyle.hobbies"),
      type: "text",
      path: ["lifestyle", "hobbies"]
    },
    "createdAt": {
      label: t("admin.retirees.fields.createdAt"),
      type: "date",
      path: ["createdAt"]
    },
    "status": {
      label: t("admin.retirees.fields.status"),
      type: "select",
      options: ["Active", "Inactive", "Pending", "Suspended"],
      path: ["status"]
    }
  };

  // Fetch settlements for dropdown
  useEffect(() => {
    const fetchSettlements = async () => {
      try {
        const settlementsRef = collection(db, "settlements");
        const settlementsSnapshot = await getDocs(settlementsRef);
        const settlementsList = settlementsSnapshot.docs.map(doc => doc.data().name).sort();
        setSettlements(settlementsList);
        
        // Update field definitions with settlements
        fieldDefinitions["idVerification.settlement"].options = settlementsList;
      } catch (error) {
        console.error("Error fetching settlements:", error);
      }
    };
    fetchSettlements();
  }, []);

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
          
          // Try different possible locations for settlement
          const settlement = adminData.idVerification?.settlement || 
                           adminData.settlement || 
                           adminData.credentials?.settlement;
          
          setAdminSettlement(settlement || null);
          setUserRole(adminData.role);
        } else {
          console.error("Admin document not found.");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching admin settlement:", error);
        setLoading(false);
      }
    };

    fetchAdminSettlement();
  }, []);

  // Handle loading state when userRole is determined
  useEffect(() => {
    if (userRole && !loading) {
      // If we have a userRole but loading is false, it means the fetchRetirees effect
      // has already run and completed, so we don't need to do anything
      return;
    }
    
    // If we have a userRole but loading is still true, the fetchRetirees effect
    // will handle the loading state
    if (userRole === null && !fetchAdminSettlementCalled.current) {
      // Still waiting for userRole to be determined
      return;
    }
    
    // If userRole is null but we've already tried to fetch admin settlement,
    // it means there was an error or no user found
    if (userRole === null && fetchAdminSettlementCalled.current) {
      setLoading(false);
    }
  }, [userRole, loading]);

  // Fetch retirees from Firestore
  useEffect(() => {
    const fetchRetirees = async () => {
      setLoading(true);
      try {
        let q;
        if (userRole === "superadmin") {
          q = query(collection(db, "users"), where("role", "==", "retiree"));
        } else if (userRole === "admin") {
          // For admin users, if no settlement is found, show empty list instead of infinite loading
          if (!adminSettlement) {
            setRetirees([]);
            setLoading(false);
            return;
          }
          
          q = query(
            collection(db, "users"),
            where("role", "==", "retiree"),
            where("idVerification.settlement", "==", adminSettlement)
          );
        } else {
          setRetirees([]);
          setLoading(false);
          return;
        }
        
        const querySnapshot = await getDocs(q);
        const fetchedRetirees = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // If no retirees found and admin has a settlement, try alternative queries
        if (fetchedRetirees.length === 0 && userRole === "admin" && adminSettlement) {
          
          // Try case-insensitive search by getting all retirees and filtering
          const allRetireesQuery = query(collection(db, "users"), where("role", "==", "retiree"));
          const allRetireesSnapshot = await getDocs(allRetireesQuery);
          const allRetirees = allRetireesSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
                    
          // Filter retirees by settlement (case-insensitive)
          const matchingRetirees = allRetirees.filter(retiree => {
            // Try different possible locations for settlement in retiree data
            const retireeSettlement = retiree.idVerification?.settlement || 
                                    retiree.settlement || 
                                    retiree.credentials?.settlement;
            
            if (!retireeSettlement) {
              return false;
            }
            
            // Normalize both settlements for comparison
            const normalizedRetireeSettlement = retireeSettlement.toString().toLowerCase().trim();
            const normalizedAdminSettlement = adminSettlement.toString().toLowerCase().trim();
            
            const match = normalizedRetireeSettlement === normalizedAdminSettlement;
            return match;
          });
          
          setRetirees(matchingRetirees);
        } else {
          setRetirees(fetchedRetirees);
        }
      } catch (error) {
        console.error("Error fetching retirees:", error);
        setRetirees([]);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we have a valid user role
    if (userRole) {
      fetchRetirees();
    }
  }, [userRole, adminSettlement]);

  // Helper function to get nested object value
  const getNestedValue = (obj, path) => {
    return path.reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
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

  // Helper: which fields are already used?
  const usedFields = dynamicFilters.map(f => f.field).filter(Boolean);
  const multiFilterFields = [];
  const availableFields = Object.keys(fieldDefinitions).filter(
    key => !usedFields.includes(key) || multiFilterFields.includes(key)
  );

  // Build react-select grouped options
  const selectFieldGroups = fieldGroups.map(group => ({
    label: `${groupIcons[group.label] || ''} ${group.label}`,
    options: group.fields
      .filter(key => availableFields.includes(key))
      .map(key => ({
        value: key,
        label: fieldDefinitions[key]?.label || key,
        isDisabled: usedFields.includes(key) && !multiFilterFields.includes(key)
      }))
  })).filter(group => group.options.length > 0);

  // Filtered field groups for dropdown
  const filteredFieldGroups = fieldGroups.map(group => ({
    ...group,
    fields: group.fields.filter(key => {
      const label = fieldDefinitions[key]?.label || key;
      return availableFields.includes(key) && label.toLowerCase().includes(fieldSearch.toLowerCase());
    })
  })).filter(group => group.fields.length > 0);

  // Flatten filtered fields for keyboard navigation
  const flatFilteredFields = filteredFieldGroups.flatMap(group => group.fields.map(key => ({
    key,
    group: group.label
  })));

  // Keyboard navigation for dropdown
  const handleDropdownKeyDown = (e, index) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setDropdownFocusIndex(i => Math.min(i + 1, flatFilteredFields.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setDropdownFocusIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && dropdownFocusIndex >= 0) {
      const { key } = flatFilteredFields[dropdownFocusIndex];
      updateFilter(index, "field", key);
      setDropdownFocusIndex(-1);
    }
  };

  // Highlight search matches
  const highlightMatch = (label, search) => {
    if (!search) return label;
    const idx = label.toLowerCase().indexOf(search.toLowerCase());
    if (idx === -1) return label;
    return <>{label.slice(0, idx)}<span className="bg-yellow-200 font-bold">{label.slice(idx, idx + search.length)}</span>{label.slice(idx + search.length)}</>;
  };

  // Enhanced addFilter: auto-focus field dropdown
  const addFilter = () => {
    setDynamicFilters(prev => {
      const newFilters = [...prev, { field: "", operator: "contains", value: "", value2: "" }];
      setTimeout(() => {
        if (fieldDropdownRefs.current[newFilters.length - 1]) {
          fieldDropdownRefs.current[newFilters.length - 1].focus();
        }
      }, 0);
      return newFilters;
    });
  };

  const updateFilter = (index, key, value) => {
    const updatedFilters = [...dynamicFilters];
    updatedFilters[index] = { ...updatedFilters[index], [key]: value };
    
    // If the field is changed, set the operator to the default for that field
    if (key === "field") {
      const ops = getOperatorsForField(value);
      updatedFilters[index].operator = ops.length > 0 ? ops[0].value : "contains";
      updatedFilters[index].value = "";
      updatedFilters[index].value2 = "";
    }
    // Reset value2 when changing operator
    if (key === "operator") {
      updatedFilters[index].value2 = "";
    }
    setDynamicFilters(updatedFilters);
  };

  const removeFilter = (index) => {
    const updatedFilters = dynamicFilters.filter((_, i) => i !== index);
    setDynamicFilters(updatedFilters);
  };

  const clearAllFilters = () => {
    setDynamicFilters([]);
    setSearchTerm("");
  };

  const saveFilterSet = () => {
    const filterSetName = prompt(t("admin.retirees.alert"));
    if (filterSetName) {
      const savedFilters = JSON.parse(localStorage.getItem("savedRetireeFilters") || "{}");
      savedFilters[filterSetName] = {
        searchTerm,
        dynamicFilters,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem("savedRetireeFilters", JSON.stringify(savedFilters));
      alert("Filter set saved successfully!");
    }
  };

  // Fetch saved filter sets from localStorage
  const fetchSavedFilterSets = () => {
    const saved = JSON.parse(localStorage.getItem("savedRetireeFilters") || "{}");
    setSavedFilterSets(Object.entries(saved));
  };

  // Open modal and fetch saved sets
  const openLoadModal = () => {
    fetchSavedFilterSets();
    setShowLoadModal(true);
  };

  // Load a filter set
  const handleLoadFilterSet = (filterSet, name) => {
    setSearchTerm(filterSet.searchTerm || "");
    setDynamicFilters(filterSet.dynamicFilters || []);
    setActiveFilterSetName(name);
    setShowLoadModal(false);
  };

  // Delete a filter set with confirmation
  const handleDeleteFilterSet = (name) => {
    if (!window.confirm(`Are you sure you want to delete the filter set "${name}"?`)) return;
    const saved = JSON.parse(localStorage.getItem("savedRetireeFilters") || "{}");
    delete saved[name];
    localStorage.setItem("savedRetireeFilters", JSON.stringify(saved));
    fetchSavedFilterSets();
    if (activeFilterSetName === name) setActiveFilterSetName(null);
  };

  // Helper to summarize filter set
  const summarizeFilterSet = (filterSet) => {
    const filters = filterSet.dynamicFilters || [];
    if (filters.length === 0 && !filterSet.searchTerm) return <span className="text-gray-400">(No filters)</span>;
    return (
      <span className="text-xs text-gray-600">
        {filterSet.searchTerm && <span>Search: "{filterSet.searchTerm}"; </span>}
        {filters.map((f, i) => {
          if (!f.field) return null;
          return (
            <span key={i}>
              {fieldDefinitions[f.field]?.label || f.field} {f.operator} {f.value}{f.value2 ? ` to ${f.value2}` : ""}{i < filters.length - 1 ? "; " : ""}
            </span>
          );
        })}
      </span>
    );
  };

  // Validation logic for filters
  const positiveOnlyFields = [
    "idVerification.age",
    // Add other positive-only numeric fields here
  ];
  const validateFilters = (filters) => {
    const errors = filters.map((filter) => {
      if (!filter.field || !filter.operator) return null;
      const fieldDef = fieldDefinitions[filter.field];
      if (!fieldDef) return null;
      // Range validation
      if (filter.operator === "range") {
        if (filter.value === '' && filter.value2 === '') return null;
        const min = filter.value === '' ? -Infinity : parseFloat(filter.value);
        const max = filter.value2 === '' ? Infinity : parseFloat(filter.value2);
        if ((filter.value !== '' && isNaN(min)) || (filter.value2 !== '' && isNaN(max))) {
          return "Min and Max must be numbers.";
        }
        if (min > max) {
          return "Min must be less than or equal to Max.";
        }
        // Positive-only check (fix: both min and max must be > 0 if provided)
        if (positiveOnlyFields.includes(filter.field)) {
          if ((filter.value !== '' && min <= 0) || (filter.value2 !== '' && max <= 0)) {
            return "Min and Max must be greater than 0.";
          }
        }
      }
      // Date range validation
      if (filter.operator === "date_range") {
        if (filter.value === '' && filter.value2 === '') return null;
        const start = filter.value === '' ? null : new Date(filter.value);
        const end = filter.value2 === '' ? null : new Date(filter.value2);
        if ((filter.value !== '' && isNaN(start.getTime())) || (filter.value2 !== '' && isNaN(end.getTime()))) {
          return "Start and End must be valid dates.";
        }
        if (start && end && start > end) {
          return "Start date must be before or equal to End date.";
        }
      }
      // Required value for text/select/array
      if (["contains", "equals", "starts_with", "ends_with"].includes(filter.operator)) {
        if (
          (Array.isArray(filter.value) && filter.value.length === 0) ||
          (!Array.isArray(filter.value) && (!filter.value || filter.value.trim() === ""))
        ) {
          return t('admin.retirees.filters.valueRequired');
        }
      }
      return null;
    });
    setFilterErrors(errors);
    return errors;
  };

  // Validate filters on change
  useEffect(() => {
    validateFilters(dynamicFilters);
    // eslint-disable-next-line
  }, [dynamicFilters]);

  // Helper: get unique values for an array field from retirees
  const getUniqueArrayFieldValues = (retirees, fieldPath) => {
    const values = new Set();
    retirees.forEach(retiree => {
      let val = fieldPath.reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), retiree);
      if (Array.isArray(val)) {
        val.forEach(v => values.add(v));
      } else if (val !== undefined && val !== null) {
        values.add(val);
      }
    });
    return Array.from(values).filter(Boolean).map(v => ({ value: v, label: v }));
  };

  const arrayFields = [
    "lifestyle.interests",
    "lifestyle.hobbies"
    // Add more array fields here if needed
  ];

  const filteredRetirees = retirees.filter((retiree) => {
    if (filterErrors.some((err) => err)) return false;
    const allValues = flattenObject(retiree);
    const matchesSearch = searchTerm === "" || allValues.some((val) => val.includes(searchTerm.toLowerCase()));
    const matchesDynamicFilters = dynamicFilters.every((filter) => {
      if (!filter.field || !filter.value) return true;
      const fieldDef = fieldDefinitions[filter.field];
      if (!fieldDef) return true;
      const value = getNestedValue(retiree, fieldDef.path);
      const filterValue = filter.value;
      switch (filter.operator) {
        case "contains":
          // For array fields, check if any selected value is included
          if (arrayFields.includes(filter.field)) {
            if (!Array.isArray(value)) return false;
            return filterValue.some(val => value.includes(val));
          }
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().includes(filterValue.toString().toLowerCase());
        case "equals":
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase() === filterValue.toString().toLowerCase();
        case "starts_with":
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().startsWith(filterValue.toString().toLowerCase());
        case "ends_with":
          if (value === null || value === undefined) return false;
          return value.toString().toLowerCase().endsWith(filterValue.toString().toLowerCase());
        case "range": {
          if (value === null || value === undefined) return false;
          const numValue = parseFloat(value);
          const min = filter.value === '' ? -Infinity : parseFloat(filter.value);
          const max = filter.value2 === '' ? Infinity : parseFloat(filter.value2);
          return !isNaN(numValue) && numValue >= min && numValue <= max;
        }
        case "date_range": {
          if (value === null || value === undefined) return false;
          const dateValue = new Date(value);
          const startDate = filter.value === '' ? new Date(-8640000000000000) : new Date(filter.value);
          const endDate = filter.value2 === '' ? new Date(8640000000000000) : new Date(filter.value2);
          return dateValue >= startDate && dateValue <= endDate;
        }
        default:
          return true;
      }
    });
    return matchesSearch && matchesDynamicFilters;
  });

  const handleViewProfile = (retiree) => {
    navigate("/view-profile", { state: { retireeData: retiree } });
  };

  const renderFilterInput = (filter, index) => {
    const fieldDef = fieldDefinitions[filter.field];
    if (!fieldDef) return null;

    // Interests field: use static list with translations
    if (filter.field === 'lifestyle.interests') {
      const options = interestsList.map((interest) => ({
        value: interest,
        label: t(`auth.lifestyle.${interest}`), // Dynamically translate interest labels
      }));
    
      return (
        <div className="min-w-[220px]">
          <Select
            isMulti
            options={options}
            value={
              Array.isArray(filter.value)
                ? options.filter((opt) => filter.value.includes(opt.value))
                : []
            }
            onChange={(selected) =>
              updateFilter(index, "value", selected ? selected.map((opt) => opt.value) : [])
            }
            placeholder={`Select ${fieldDef.label}`}
            classNamePrefix="react-select"
            formatOptionLabel={(option) => (
              <span style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: 8 }}>{interestEmojis[option.value] || ""}</span>
                <span>{option.label}</span>
              </span>
            )}
          />
        </div>
      );
    }
    
    // Hobbies field: use static list with translations
    if (filter.field === 'lifestyle.hobbies') {
      const options = hobbiesList.map((hobby) => ({
        value: hobby,
        label: t(`auth.lifestyle.${hobby}`), // Dynamically translate hobby labels
      }));
    
      return (
        <div className="min-w-[220px]">
          <Select
            isMulti
            options={options}
            value={
              Array.isArray(filter.value)
                ? options.filter((opt) => filter.value.includes(opt.value))
                : []
            }
            onChange={(selected) =>
              updateFilter(index, "value", selected ? selected.map((opt) => opt.value) : [])
            }
            placeholder={`Select ${fieldDef.label}`}
            classNamePrefix="react-select"
            formatOptionLabel={(option) => (
              <span style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: 8 }}>{hobbyEmojis[option.value] || ""}</span>
                <span>{option.label}</span>
              </span>
            )}
          />
        </div>
      );
    }

    // Jobs field: use static list with translations
    if (filter.field === 'workBackground.customJobInfo.originalSelection.jobTitle') {
      const options = jobsList.map((job) => ({
        value: job,
        label: t(`auth.signup.workBackground.jobs.${job}`), // Dynamically translate job labels
      }));
    
      return (
        <div className="min-w-[220px]">
          <Select
            isMulti
            options={options}
            value={
              Array.isArray(filter.value)
                ? options.filter((opt) => filter.value.includes(opt.value))
                : []
            }
            onChange={(selected) =>
              updateFilter(index, "value", selected ? selected.map((opt) => opt.value) : [])
            }
            placeholder={`Select ${fieldDef.label}`}
            classNamePrefix="react-select"
            formatOptionLabel={(option) => (
              <span style={{ display: "flex", alignItems: "center" }}>
                <span style={{ marginRight: 8 }}>{jobEmojis[option.value] || ""}</span>
                <span>{option.label}</span>
              </span>
            )}
          />
        </div>
      );
    }

    // Volunteer Areas field: use static list
    if (filter.field === 'veteransCommunity.volunteerAreas') {
      const options = volunteerAreasList.map(i => ({ value: i, label: i }));
      return (
        <div className="min-w-[220px]">
          <Select
            isMulti
            options={options}
            value={
              Array.isArray(filter.value)
                ? options.filter(opt => filter.value.includes(opt.value))
                : []
            }
            onChange={selected => updateFilter(index, "value", selected ? selected.map(opt => opt.value) : [])}
            placeholder={`Select ${fieldDef.label}`}
            classNamePrefix="react-select"
            formatOptionLabel={option => (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: 8 }}>{volunteerAreaEmojis[option.value] || ''}</span>
                <span>{option.label}</span>
              </span>
            )}
          />
        </div>
      );
    }

    // Array field: use react-select multi-select
    if (arrayFields.includes(filter.field)) {
      const options = getUniqueArrayFieldValues(retirees, fieldDef.path);
      return (
        <div className="min-w-[220px]">
          <Select
            isMulti
            options={options}
            value={
              Array.isArray(filter.value)
                ? options.filter(opt => filter.value.includes(opt.value))
                : []
            }
            onChange={selected => updateFilter(index, "value", selected ? selected.map(opt => opt.value) : [])}
            placeholder={`Select ${fieldDef.label}`}
            classNamePrefix="react-select"
          />
        </div>
      );
    }

    switch (fieldDef.type) {
      case "select":
        return (
          <select
            className="p-2 border rounded flex-1"
            value={filter.value}
            onChange={(e) => updateFilter(index, "value", e.target.value)}
          >
            <option value="">{t("admin.retirees.select")} {fieldDef.label}</option>
            {fieldDef.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "range":
        return (
          <div className="flex space-x-2 flex-1">
            <input
              type="number"
              placeholder={t("admin.retirees.minAge")}
              min={0}
              className="p-2 border rounded flex-1"
              value={filter.value}
              onChange={(e) => updateFilter(index, "value", e.target.value)}
            />
            <span className="self-center">to</span>
            <input
              type="number"
              placeholder={t("admin.retirees.maxAge")}
              min={0}
              className="p-2 border rounded flex-1"
              value={filter.value2}
              onChange={(e) => updateFilter(index, "value2", e.target.value)}
            />
          </div>
        );
      case "date":
        return (
          <div className="flex space-x-2 flex-1">
            <input
              type="date"
              className="p-2 border rounded flex-1"
              value={filter.value}
              onChange={(e) => updateFilter(index, "value", e.target.value)}
            />
            <span className="self-center">to</span>
            <input
              type="date"
              className="p-2 border rounded flex-1"
              value={filter.value2}
              onChange={(e) => updateFilter(index, "value2", e.target.value)}
            />
          </div>
        );
      default:
        return (
          <input
            type="text"
            placeholder={i18n.t("admin.retirees.filters.enterValue", { Value: fieldDef.label })}
            className="p-2 border rounded flex-1"
            value={filter.value}
            onChange={(e) => updateFilter(index, "value", e.target.value)}
          />
        );
    }
  };

  const getOperatorsForField = (fieldKey) => {
    const fieldDef = fieldDefinitions[fieldKey];
    if (!fieldDef) return [];

    switch (fieldDef.type) {
      case "range":
        return [{ value: "range", label: t("admin.retirees.defTypes.range") }];
      case "date":
        return [{ value: "date_range", label: t("admin.retirees.defTypes.dateRange") }];
      case "select":
        return [
          { value: "equals", label: t("admin.retirees.defTypes.equals") },
          { value: "contains", label: t("admin.retirees.defTypes.contains") }
        ];
      default:
        return [
          { value: "contains", label: t("admin.retirees.defTypes.contains") },
          { value: "equals", label: t("admin.retirees.defTypes.equals") },
          { value: "starts_with", label: t("admin.retirees.defTypes.startsWith") },
          { value: "ends_with", label: t("admin.retirees.defTypes.endsWith") }
        ];
    }
  };

  if (loading) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">{t("admin.retirees.title")}</h1>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-3 md:p-4 rounded shadow mb-6 max-w-xl mx-auto">        {/* ...existing code for search and filters... */}
        {/* Global Search */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("admin.retirees.filters.globalSearch")}
          </label>
          <input
            type="text"
            placeholder={t("admin.retirees.filters.search")}
            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Filter Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 space-x-4 mb-6">
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            onClick={addFilter}
            disabled={availableFields.length === 0}
          >
            {t("admin.retirees.filters.addFilter")}
          </button>
          <button
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
            onClick={clearAllFilters}
          >
            {t("admin.retirees.filters.clearAll")}
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg"
            onClick={saveFilterSet}
          >
            {t("admin.retirees.filters.saveFilters")}
          </button>
          <button
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg"
            onClick={openLoadModal}
          >
            {t("admin.retirees.filters.loadFilters")}
          </button>
        </div>

        {/* Dynamic Filters */}
        <div className="space-y-4">
          {dynamicFilters.map((filter, index) => (
            <div key={index} className="flex flex-col space-y-1">
                {/* Field Select (react-select) */}
                <div className="flex-1 min-w-[220px]">
                  <Select
                    options={selectFieldGroups}
                    value={
                      filter.field
                        ? {
                            value: filter.field,
                            label: fieldDefinitions[filter.field]?.label || filter.field
                          }
                        : null
                    }
                    onChange={option => updateFilter(index, "field", option ? option.value : "")}
                    placeholder={t("admin.retirees.filters.selectField")}
                    isSearchable
                    isClearable
                    menuPlacement="auto"
                    classNamePrefix="react-select"
                    styles={{
                      menu: provided => ({ ...provided, zIndex: 9999 }),
                      option: (provided, state) => ({
                        ...provided,
                        backgroundColor: state.isFocused ? '#e0e7ff' : provided.backgroundColor
                      })
                    }}
                  />
                </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {/* Operator Select (only if field is selected) */}
                {filter.field && (
                  <select
                    className="p-2 border rounded-lg min-w-[150px]"
                    value={filter.operator}
                    onChange={(e) => updateFilter(index, "operator", e.target.value)}
                  >
                    {getOperatorsForField(filter.field).map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* Value Input (only if field and operator are selected) */}
                {filter.field && filter.operator && renderFilterInput(filter, index)}

                {/* Remove Button */}
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
                  onClick={() => removeFilter(index)}
                >
                  {t("admin.retirees.filters.remove")}
                </button>
              </div>
              {/* Error message for this filter */}
              <div style={{ minHeight: '20px' }}>
                {filterErrors[index] && (
                  <div className="text-red-600 text-xs px-4 py-1 mt-1 bg-red-50 rounded">
                    {filterErrors[index]}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Results Count */}
        <div className="mt-4 text-sm text-gray-600">
          {t("admin.retirees.showingCount", { filtered: filteredRetirees.length, total: retirees.length })}
        </div>
      </div>

      {/* Retirees List: Cards on mobile, table on desktop */}
      <div>
        {/* Mobile: cards */}
        <div className="block sm:hidden space-y-3">
          {filteredRetirees.length === 0 ? (
            <div className="text-center text-gray-500 py-8">{t("admin.retirees.noRetireesFound")}</div>
          ) : (
            filteredRetirees.map((retiree) => (
              <div
                key={retiree.id}
                className="bg-white rounded-lg shadow p-3 flex flex-col gap-2 cursor-pointer hover:bg-gray-50"
                onClick={() => handleViewProfile(retiree)}
              >
                <div className="flex items-center gap-3 mb-1">
                  <FaUsers className="text-xl text-gray-400" />
                  <div className="font-medium text-gray-900 text-base flex-1 truncate">
                    {retiree.idVerification?.firstName} {retiree.idVerification?.lastName}
                  </div>
                </div>
                <div>
                  <div>
                    <span className="font-semibold text-gray-700">{t("admin.retirees.age")}:</span> {retiree.idVerification?.age || t("common.notAvailable")}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t("admin.retirees.gender")}:</span> {retiree.idVerification?.gender || t("common.notAvailable")}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t("admin.retirees.settlement")}:</span> {retiree.idVerification?.settlement || t("common.notAvailable")}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700">{t("admin.retirees.job")}:</span> {retiree.workBackground?.customJobInfo?.originalSelection?.jobTitle || t("common.notAvailable")}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Desktop: table */}
        <div className="hidden sm:block">
          <div className="bg-white rounded shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("admin.retirees.table.name")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("admin.retirees.table.age")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("admin.retirees.table.gender")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("admin.retirees.table.settlement")}
                  </th>
                  <th
                    className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${
                      document.documentElement.dir === 'rtl' ? 'text-right' : 'text-left'
                    }`}
                  >
                    {t("admin.retirees.table.work")}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRetirees.map((retiree) => (
                  <tr key={retiree.id}
                    className="cursor-pointer hover:bg-gray-100"
                    onClick={() => handleViewProfile(retiree)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {retiree.idVerification?.firstName} {retiree.idVerification?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{retiree.idVerification?.age || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{retiree.idVerification?.gender || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{retiree.idVerification?.settlement || "N/A"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {retiree.workBackground?.customJobInfo?.originalSelection?.jobTitle || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {retirees.length === 0 && !loading ? (
        userRole === "admin" && !adminSettlement ? (
          <EmptyState
            icon={<FaUsers />}
            title="No settlement assigned"
            message="You don't have a settlement assigned. Please contact your administrator to assign you to a settlement."
          />
        ) : (
          <EmptyState
            icon={<FaUsers />}
            title= {t("admin.retirees.noRetireesFound")}
            message={t("admin.retirees.noRetireesMessage")}
          />
        )
      ) : (
        filteredRetirees.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            {t("admin.retirees.noRetireesFound")}
          </div>
        )
      )}

      {/* Load Filter Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/5" role="dialog" aria-modal="true" aria-label="Load Filter Set Modal">
          <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{t("admin.retirees.filters.loadFilterSet")}</h2>
              <button
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
                onClick={() => setShowLoadModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            {savedFilterSets.length === 0 ? (
              <div className="text-gray-500">{t("admin.retirees.filters.noFiltersLoad")}</div>
            ) : (
              <ul className="space-y-2 max-h-60 overflow-y-auto" tabIndex={0}>
                {savedFilterSets.map(([name, filterSet]) => (
                  <li
                    key={name}
                    className={`flex flex-col bg-gray-50 rounded px-3 py-2 hover:bg-gray-100 cursor-pointer border ${activeFilterSetName === name ? 'border-blue-500 ring-2 ring-blue-200' : 'border-transparent'}`}
                    tabIndex={0}
                    aria-label={`Filter set ${name}`}
                    onClick={() => handleLoadFilterSet(filterSet, name)}
                    onKeyDown={e => { if (e.key === 'Enter') handleLoadFilterSet(filterSet, name); }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="flex-1 font-medium">
                        {name}
                        {activeFilterSetName === name && <span className="ml-2 text-blue-600 text-xs">(Active)</span>}
                      </span>
                      <button
                        className="ml-4 text-red-500 hover:text-red-700"
                        title="Delete filter set"
                        aria-label={`Delete filter set ${name}`}
                        onClick={e => { e.stopPropagation(); handleDeleteFilterSet(name); }}
                        onKeyDown={e => { e.stopPropagation(); if (e.key === 'Enter') handleDeleteFilterSet(name); }}
                      >
                        🗑️
                      </button>
                    </div>
                    <div className="mt-1">
                      {summarizeFilterSet(filterSet)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Retirees;
