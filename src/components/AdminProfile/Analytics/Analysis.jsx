import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import useFetchAnalysisData from "../../../hooks/useFetchAnalysisData";
import { useChartData } from "../../../hooks/useChartData";
import { db } from '../../../firebase';
import { collection, query, where, onSnapshot, getDocs } from 'firebase/firestore';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import EmptyState from '../../EmptyState';
import { useLanguage } from '../../../context/LanguageContext';

const Analysis = () => {
  const { t } = useLanguage();
  const { users, jobs, events } = useFetchAnalysisData();
  const [retireeCounts, setRetireeCounts] = useState({});
  const [availableSettlements, setAvailableSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setLoading(true);
    // Listen for available settlements
    const unsubSettlements = onSnapshot(collection(db, 'availableSettlements'), (snapshot) => {
      const settlements = snapshot.docs.map(doc => doc.data().name);
      setAvailableSettlements(settlements);
      setLoading(false);
    }, (err) => {
      setError(t("analysis.errors.loadSettlements"));
      setLoading(false);
    });
    return () => unsubSettlements();
  }, []);

  useEffect(() => {
    if (availableSettlements.length === 0) return;
    // Listen for retirees
    const usersRef = collection(db, 'users');
    const retireeQuery = query(usersRef, where('role', '==', 'retiree'));
    const unsub = onSnapshot(retireeQuery, (retireeSnapshot) => {
      const retirees = retireeSnapshot.docs.map(doc => doc.data());
      const counts = {};
      for (const settlement of availableSettlements) {
        const normSettle = settlement.trim().normalize('NFC');
        counts[normSettle] = retirees.filter(r =>
          (r.idVerification?.settlement && r.idVerification.settlement.trim().normalize('NFC') === normSettle) ||
          (r.settlement && r.settlement.trim().normalize('NFC') === normSettle)
        ).length;
      }
      setRetireeCounts(counts);
    });
    return () => unsub();
  }, [availableSettlements]);

  useEffect(() => {
    // Fetch categories for mapping category IDs to names
    const fetchCategories = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'categories'));
        setCategories(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch {
        setError(t("analysis.errors.loadCategories"));
      }
    };
    fetchCategories();
  }, []);

  // Prepare data for charts
  const townChartData = availableSettlements.map(name => ({
    name,
    value: retireeCounts[name] || 0
  }));

  // Color palettes for different chart types
  const primaryColors = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4"];
  const gradientColors = ["#6366F1", "#8B5CF6", "#EC4899", "#F59E0B", "#10B981", "#06B6D4"];

  // Always call useChartData at the top level, passing fallback values if data is not ready
  const {
    jobByMonthData = [],
    totalUsers = 0,
    totalVolunteers = 0,
    jobRequestsByStatus = [],
    averageJobCompletionTime = 0,
    usersByRoleDistribution = [],
    eventsByCategoryData = [],
    eventsByMonthData = [],
  } = useChartData(
    users || [],
    jobs || [],
    availableSettlements || [],
    events || []
  );

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesRef = collection(db, "categories");
        const snapshot = await getDocs(categoriesRef);
        const categoriesData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
  
    fetchCategories();
  }, []);

  // Helper to get category name by id
  const getCategoryName = (id) => {
    if (!id || typeof id !== "string") {
      console.warn("Invalid category ID:", id);
      return t("unknown");
    }
  
    const cat = categories.find((c) => c.id === id);
  
    if (!cat) {
      console.warn("Category not found for ID:", id);
      return t("unknown");
    }
  
    return cat.translations?.[language] || cat.translations?.en || cat.name || t("unknown");
  };

  // Helper to get readable role name
  const getRoleName = (role) => {
    if (!role || role === "undefined") return t("unknown");
    const map = {
      admin: t('analysis.admin'),
      superadmin: t('analysis.superadmin'),
      retiree: t('analysis.retiree'),
      volunteer: t('analysis.volunteer'),
    };
    return map[role.toLowerCase()] || role.charAt(0).toUpperCase() + role.slice(1);
  };
  // Helper to get readable job status
  const getStatusName = (status) => {
    if (!status || status === "undefined") return t("unknown");
    const map = {
      active: t('analysis.status.active'),
      pending: t('analysis.status.pending'),
      completed: t('analysis.status.completed'),
      open: t('analysis.status.open'),
      closed: t('analysis.status.closed'),
      approved: t('analysis.status.approved'),
      rejected: t('analysis.status.rejected'),
      unknown: t('analysis.status.unknown'),
    };
    return map[status.toLowerCase()] || status.charAt(0).toUpperCase() + status.slice(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <Skeleton height={36} width={300} style={{ marginBottom: 24 }} />
            <Skeleton height={32} width={180} style={{ marginBottom: 16 }} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                <Skeleton height={28} width={200} style={{ marginBottom: 16 }} />
                <Skeleton height={300} width="100%" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                <Skeleton height={28} width={200} style={{ marginBottom: 16 }} />
                <Skeleton height={300} width="100%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${data.name}: ${data.value}`}</p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className={`bg-gradient-to-r ${color} rounded-xl shadow-lg p-4 sm:p-6 text-white transform hover:scale-105 transition-transform duration-200 w-full`}>
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <p className="text-white/80 text-xs sm:text-sm font-medium truncate">{title}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1 break-words">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1 truncate">{subtitle}</p>}
        </div>
        <div className="text-3xl sm:text-4xl opacity-80 flex-shrink-0">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-2 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-8 px-1">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">{t("analysis.title")}</h1>
          <p className="text-gray-600 text-xs sm:text-base">{t("analysis.subtitle")}</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-8">
          <StatCard
            title={t("analysis.statCards.totalUsers.title")}
            value={totalUsers.toLocaleString()}
            icon="👥"
            color="from-blue-500 to-blue-600"
            subtitle={t("analysis.statCards.totalUsers.subtitle")}
          />
          <StatCard
            title={t("analysis.statCards.volunteers.title")}
            value={totalVolunteers.toLocaleString()}
            icon="🤝"
            color="from-green-500 to-green-600"
            subtitle={t("analysis.statCards.volunteers.subtitle")}
          />
          <StatCard
            title={t("analysis.statCards.retirees.title")}
            value={users.filter(u => u.role === "retiree").length.toLocaleString()}
            icon="👴"
            color="from-purple-500 to-purple-600"
            subtitle={t("analysis.statCards.retirees.subtitle")}
          />
          <StatCard
            title={t("analysis.statCards.avgCompletion.title")}
            value={averageJobCompletionTime > 0 ? `${averageJobCompletionTime} ${t("days")}` : "N/A"}
            icon="⏱️"
            color="from-orange-500 to-orange-600"
            subtitle={t("analysis.statCards.avgCompletion.subtitle")}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mb-4 sm:mb-8">
          {/* Retirees by Town */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
              <span className="mr-2 ml-2">🏘️</span>
              {t("analysis.charts.retireesByTown.title")}
            </h3>
            {townChartData.length === 0 ? (
              <EmptyState
                icon={<span role="img" aria-label="chart">📊</span>}
                title={t("analysis.emptyStates.noTownData.title")}
                message={t("analysis.emptyStates.noTownData.message")}
              />
            ) : (
              <ResponsiveContainer width="100%" height={220} minHeight={180}>
                <BarChart 
                  data={townChartData.sort((a, b) => b.value - a.value)}
                  layout="vertical"
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} fontSize={10} />
                  <YAxis type="category" dataKey="name" width={70} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="url(#townGradient)" radius={[0, 4, 4, 0]} />
                  <defs>
                    <linearGradient id="townGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1D4ED8" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Job Requests Over Time */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
              <span className="mr-2 ml-2">📈</span>
              {t("analysis.charts.jobRequestsOverTime.title")}
            </h3>
            {jobByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} minHeight={180}>
                <LineChart data={jobByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: "#059669" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">📈</div>
                  <p className="text-xs sm:text-base">{t("analysis.charts.jobRequestsOverTime.noData")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Job Requests by Status */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
              <span className="mr-2 ml-2">📋</span>
              {t("analysis.charts.jobRequestsByStatus.title")}
            </h3>
            {jobRequestsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} minHeight={180}>
                <PieChart>
                  <Pie
                    data={jobRequestsByStatus.map(entry => ({ ...entry, name: getStatusName(entry.name) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {jobRequestsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={primaryColors[index % primaryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">📋</div>
                  <p className="text-xs sm:text-base">{t("analysis.charts.jobRequestsByStatus.noData")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Users by Role Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
              <span className="mr-2 ml-2">👥</span>
              {t("analysis.charts.usersByRole.title")}
            </h3>
            {usersByRoleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} minHeight={180}>
                <PieChart>
                  <Pie
                    data={usersByRoleDistribution.map(entry => ({ ...entry, name: getRoleName(entry.name) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usersByRoleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={gradientColors[index % gradientColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">👥</div>
                  <p className="text-xs sm:text-base">{t("analysis.charts.usersByRole.noData")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2 mb-4 sm:mb-8">
          {/* Events by Category */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
              <span className="mr-2 ml-2">🎉</span>
              {t("analysis.charts.eventsByCategory.title")}
            </h3>
            {eventsByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} minHeight={180}>
                <PieChart>
                  <Pie
                    data={eventsByCategoryData.map(entry => ({ ...entry, name: getCategoryName(entry.name) }))}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventsByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={primaryColors[index % primaryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">🎉</div>
                  <p className="text-xs sm:text-base">{t("analysis.charts.eventsByCategory.noData")}</p>
                </div>
              </div>
            )}
          </div>

          {/* Events Over Time */}
          <div className="bg-white rounded-xl shadow-lg p-2 sm:p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-base sm:text-xl font-semibold text-gray-800 mb-2 sm:mb-4 flex items-center">
              <span className="mr-2 ml-2">🗓️</span>
              {t("analysis.charts.eventsOverTime.title")}
            </h3>
            {eventsByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220} minHeight={180}>
                <LineChart data={eventsByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis allowDecimals={false} fontSize={10} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 7, fill: "#7C3AED" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-40 sm:h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl mb-2">🗓️</div>
                  <p className="text-xs sm:text-base">{t("analysis.charts.eventsOverTime.noData")}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-xs sm:text-sm">
          <p>{t("analysis.footer.lastUpdated")}: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

