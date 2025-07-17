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

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">{t("retiree.search.title", "Find Retirees in Your Settlement")}</h1>
      {loading ? (
        <div>{t("common.loading", "Loading...")}</div>
      ) : !mySettlement ? (
        <div className="text-red-600">{t("retiree.search.noSettlement", "No settlement assigned. Please contact your administrator.")}</div>
      ) : (
        <>
          <div className="bg-white p-4 rounded shadow mb-6">
            <div className="mb-4">
              <label className="block font-medium mb-1">{t("retiree.search.interests", "Interests")}</label>
              <Select
                isMulti
                options={interestsList.map(i => ({ value: i, label: i }))}
                value={selectedInterests.map(i => ({ value: i, label: i }))}
                onChange={opts => setSelectedInterests(opts ? opts.map(o => o.value) : [])}
                placeholder={t("retiree.search.selectInterests", "Select interests")}
                classNamePrefix="react-select"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">{t("retiree.search.jobTitle", "Job Title")}</label>
              <Select
                isMulti
                options={jobsList.map(i => ({ value: i, label: i }))}
                value={selectedJobs.map(i => ({ value: i, label: i }))}
                onChange={opts => setSelectedJobs(opts ? opts.map(o => o.value) : [])}
                placeholder={t("retiree.search.selectJobs", "Select job titles")}
                classNamePrefix="react-select"
              />
            </div>
          </div>
          <div className="bg-white rounded shadow p-4">
            <h2 className="text-lg font-semibold mb-4">{t("retiree.search.results", "Matching Retirees")}</h2>
            {filteredRetirees.length === 0 ? (
              <div className="text-gray-500">{t("retiree.search.noResults", "No retirees found matching your criteria.")}</div>
            ) : (
              <ul className="divide-y">
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
                  const highlightedInterests = retireeInterests.map(interest => {
                    const isMatch = selectedInterestsAll.includes(normalize(interest));
                    return (
                      <span key={interest} className={isMatch ? "bg-yellow-200 rounded px-1 mx-0.5" : ""}>
                        {isMatch ? '★ ' : ''}{interest}
                      </span>
                    );
                  });
                  const isJobMatch = selectedJobsAll.includes(normalize(retireeJob));
                  return (
                    <li key={r.id} className="py-3">
                      <div className="font-bold">{r.idVerification?.firstName} {r.idVerification?.lastName}</div>
                      <div className="text-sm text-gray-600">{t("retiree.search.age", "Age")}: {r.idVerification?.age || t("common.notAvailable", "N/A")}</div>
                      <div className="text-sm text-gray-600">{t("retiree.search.gender", "Gender")}: {r.idVerification?.gender || t("common.notAvailable", "N/A")}</div>
                      <div className={`text-sm ${isJobMatch ? "bg-yellow-200 rounded px-1" : "text-gray-600"}`}>{t("retiree.search.jobTitle", "Job Title")}: {isJobMatch ? '★ ' : ''}{retireeJob || t("common.notAvailable", "N/A")}</div>
                      <div className="text-sm text-gray-600">{t("retiree.search.interests", "Interests")}: {highlightedInterests}</div>
                      {/* Quick Actions */}
                      <div className="mt-2 flex gap-2">
                        <button
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                          onClick={() => navigate('/view-profile', { state: { retireeData: r } })}
                          aria-label={t('retiree.search.viewProfile', 'View Profile')}
                        >
                          {t('retiree.search.viewProfile', 'View Profile')}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default RetireeSearch; 