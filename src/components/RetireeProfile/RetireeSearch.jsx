import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase";
import { getAuth } from "firebase/auth";
import Select from "react-select";
import interestsList from '../../data/interests.json';
import jobsList from '../../data/jobs.json';
import interestTranslations from '../../data/interestTranslations.json';
import jobTitleTranslations from '../../data/jobTitleTranslations.json';
import { useNavigate } from "react-router-dom";

const RetireeSearch = () => {
  const { t } = useTranslation();
  const [retirees, setRetirees] = useState([]);
  const [filteredRetirees, setFilteredRetirees] = useState([]);
  const [mySettlement, setMySettlement] = useState(null);
  const [myUid, setMyUid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const navigate = useNavigate();

  // Fetch current retiree's settlement
  useEffect(() => {
    const fetchMySettlement = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }
      setMyUid(user.uid);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const settlement = data.idVerification?.settlement || data.settlement || data.credentials?.settlement;
        setMySettlement(settlement || null);
      }
      setLoading(false);
    };
    fetchMySettlement();
  }, []);

  // Fetch retirees in the same settlement
  useEffect(() => {
    const fetchRetirees = async () => {
      if (!mySettlement) return;
      setLoading(true);
      const q = query(collection(db, "users"), where("role", "==", "retiree"), where("idVerification.settlement", "==", mySettlement));
      const snapshot = await getDocs(q);
      let fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Fallback: case-insensitive filter if none found
      if (fetched.length === 0) {
        const allRetireesQ = query(collection(db, "users"), where("role", "==", "retiree"));
        const allSnapshot = await getDocs(allRetireesQ);
        fetched = allSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(r => {
            const s = r.idVerification?.settlement || r.settlement || r.credentials?.settlement;
            return s && s.toString().toLowerCase().trim() === mySettlement.toString().toLowerCase().trim();
          });
      }
      // Exclude self
      setRetirees(fetched.filter(r => r.id !== myUid));
      setLoading(false);
    };
    if (mySettlement && myUid) fetchRetirees();
  }, [mySettlement, myUid]);

  // Filtering logic
  useEffect(() => {
    let filtered = retirees;
    const normalize = s => (s || "").toString().toLowerCase().trim();
    // Helper to get all translations for a value (including itself)
    const getAllTranslations = (val, translationsMap) => {
      const normVal = normalize(val);
      const translations = translationsMap[val] || translationsMap[normVal] || [];
      return [val, ...translations];
    };
    // Interests: cross-language matching
    if (selectedInterests.length > 0) {
      const selectedInterestsAll = selectedInterests.flatMap(i => getAllTranslations(i, interestTranslations)).map(normalize);
      filtered = filtered.filter(r => {
        const interests = (r.lifestyle?.interests || []).map(normalize);
        return selectedInterestsAll.some(i => interests.includes(i));
      });
    }
    // Job Titles: cross-language matching
    if (selectedJobs.length > 0) {
      const selectedJobsAll = selectedJobs.flatMap(j => getAllTranslations(j, jobTitleTranslations)).map(normalize);
      filtered = filtered.filter(r => {
        const job = normalize(r.workBackground?.customJobInfo?.originalSelection?.jobTitle);
        return selectedJobsAll.includes(job);
      });
    }
    setFilteredRetirees(filtered);
  }, [retirees, selectedInterests, selectedJobs]);

  // Custom styles for react-select to be more mobile-friendly
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '44px', // Minimum touch target size
      fontSize: '16px', // Prevent zoom on iOS
      borderRadius: '8px',
      border: '1px solid #d1d5db',
      '&:hover': {
        border: '1px solid #9ca3af',
      },
    }),
    option: (provided) => ({
      ...provided,
      fontSize: '16px',
      padding: '12px 16px',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#e5e7eb',
      borderRadius: '6px',
      margin: '2px',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      fontSize: '14px',
      padding: '2px 6px',
    }),
    placeholder: (provided) => ({
      ...provided,
      fontSize: '16px',
      color: '#9ca3af',
    }),
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6">
      <div className="max-w-md mx-auto md:max-w-2xl lg:max-w-4xl xl:max-w-6xl">
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-6 text-gray-900 text-center">
          {t("retiree.search.title", "Find Retirees in Your Settlement")}
        </h1>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">{t("common.loading", "Loading...")}</p>
          </div>
        ) : !mySettlement ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            {t("retiree.search.noSettlement", "No settlement assigned. Please contact your administrator.")}
          </div>
        ) : (
          <>
            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
              <div className="space-y-4 md:space-y-6">
                <div className="md:flex md:space-x-6 md:space-y-0 space-y-4">
                  <div className="md:flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("retiree.search.interests", "Interests")}
                    </label>
                    <Select
                      isMulti
                      options={interestsList.map(i => ({ value: i, label: i }))}
                      value={selectedInterests.map(i => ({ value: i, label: i }))}
                      onChange={opts => setSelectedInterests(opts ? opts.map(o => o.value) : [])}
                      placeholder={t("retiree.search.selectInterests", "Select interests")}
                      classNamePrefix="react-select"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                  
                  <div className="md:flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("retiree.search.jobTitle", "Job Title")}
                    </label>
                    <Select
                      isMulti
                      options={jobsList.map(i => ({ value: i, label: i }))}
                      value={selectedJobs.map(i => ({ value: i, label: i }))}
                      onChange={opts => setSelectedJobs(opts ? opts.map(o => o.value) : [])}
                      placeholder={t("retiree.search.selectJobs", "Select job titles")}
                      classNamePrefix="react-select"
                      styles={customSelectStyles}
                      menuPortalTarget={document.body}
                      menuPosition="fixed"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Results Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-gray-900">
                {t("retiree.search.results", "Matching Retirees")}
              </h2>
              
              {filteredRetirees.length === 0 ? (
                <div className="text-center py-8 md:py-12 text-gray-500">
                  <div className="text-4xl md:text-6xl mb-2">👥</div>
                  <p className="text-base md:text-lg">{t("retiree.search.noResults", "No retirees found matching your criteria.")}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {filteredRetirees.map(r => {
                    // Normalize helper
                    const normalize = s => (s || "").toString().toLowerCase().trim();
                    // Get all translations for a value (including itself)
                    const getAllTranslations = (val, translationsMap) => {
                      const normVal = normalize(val);
                      const translations = translationsMap[val] || translationsMap[normVal] || [];
                      return [val, ...translations];
                    };
                    // Prepare sets for highlighting
                    const selectedInterestsAll = selectedInterests.flatMap(i => getAllTranslations(i, interestTranslations)).map(normalize);
                    const selectedJobsAll = selectedJobs.flatMap(j => getAllTranslations(j, jobTitleTranslations)).map(normalize);
                    // Retiree's data
                    const retireeInterests = (r.lifestyle?.interests || []);
                    const retireeJob = r.workBackground?.customJobInfo?.originalSelection?.jobTitle || "";
                    // Highlight logic
                    const highlightedInterests = retireeInterests.map((interest, index) => {
                      const isMatch = selectedInterestsAll.includes(normalize(interest));
                      return (
                        <span key={index} className={`inline-block mr-2 mb-1 px-2 py-1 rounded-full text-xs md:text-sm ${
                          isMatch 
                            ? "bg-yellow-100 text-yellow-800 border border-yellow-300" 
                            : "bg-gray-100 text-gray-700"
                        }`}>
                          {isMatch ? '⭐ ' : ''}{interest}
                        </span>
                      );
                    });
                    const isJobMatch = selectedJobsAll.includes(normalize(retireeJob));
                    
                    return (
                      <div key={r.id} className="bg-gray-50 rounded-lg p-4 md:p-6 border border-gray-200 h-fit">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg md:text-xl text-gray-900 mb-1">
                              {r.idVerification?.firstName} {r.idVerification?.lastName}
                            </h3>
                            <div className="text-sm md:text-base text-gray-600 space-y-1">
                              <div>{t("retiree.search.age", "Age")}: {r.idVerification?.age || t("common.notAvailable", "N/A")}</div>
                              <div>{t("retiree.search.gender", "Gender")}: {r.idVerification?.gender || t("common.notAvailable", "N/A")}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3 md:space-y-4 mb-4 md:mb-6">
                          <div className={`text-sm md:text-base ${isJobMatch ? "font-medium" : ""}`}>
                            <span className="text-gray-600">{t("retiree.search.jobTitle", "Job Title")}: </span>
                            <span className={isJobMatch ? "bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full" : "text-gray-900"}>
                              {isJobMatch ? '⭐ ' : ''}{retireeJob || t("common.notAvailable", "N/A")}
                            </span>
                          </div>
                          
                          <div className="text-sm md:text-base">
                            <span className="text-gray-600 block mb-2">{t("retiree.search.interests", "Interests")}:</span>
                            <div className="flex flex-wrap gap-1">
                              {highlightedInterests.length > 0 ? highlightedInterests : (
                                <span className="text-gray-500 text-xs md:text-sm">{t("common.notAvailable", "N/A")}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <button
                          className="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm md:text-base"
                          onClick={() => navigate('/view-profile', { state: { retireeData: r } })}
                          aria-label={t('retiree.search.viewProfile', 'View Profile')}
                        >
                          {t('retiree.search.viewProfile', 'View Profile')}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default RetireeSearch;