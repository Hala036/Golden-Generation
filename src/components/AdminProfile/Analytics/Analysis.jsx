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
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import EmptyState from '../../EmptyState';
import { useLanguage } from '../../../context/LanguageContext';

const Analysis = () => {
  const { t } = useLanguage();
  const { users, jobs, events } = useFetchAnalysisData();
  // Real-time retiree counts for available settlements
  const [retireeCounts, setRetireeCounts] = useState({});
  const [availableSettlements, setAvailableSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    // Listen for available settlements
    const unsubSettlements = onSnapshot(collection(db, 'availableSettlements'), (snapshot) => {
      const settlements = snapshot.docs.map(doc => doc.data().name);
      setAvailableSettlements(settlements);
      setLoading(false);
    }, (err) => {
      setError('Failed to load settlements');
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{`${label}`}</p>
          <p className="text-blue-600">{`Value: ${payload[0].value}`}</p>
        </div>
      );
    }
    return null;
  };

  const StatCard = ({ title, value, icon, color, subtitle }) => (
    <div className={`bg-gradient-to-r ${color} rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform duration-200`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/80 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && <p className="text-white/70 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className="text-4xl opacity-80">{icon}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('analytics.analysis.title')}</h1>
          <p className="text-gray-600">{t('analytics.analysis.subtitle')}</p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title={t('analytics.analysis.metrics.totalUsers')}
            value={totalUsers.toLocaleString()}
            icon="👥"
            color="from-blue-500 to-blue-600"
            subtitle={t('analytics.analysis.subtitles.allRegisteredUsers')}
          />
          <StatCard
            title={t('analytics.analysis.metrics.volunteers')}
            value={totalVolunteers.toLocaleString()}
            icon="🤝"
            color="from-green-500 to-green-600"
            subtitle={t('analytics.analysis.subtitles.activeVolunteers')}
          />
          <StatCard
            title={t('analytics.analysis.metrics.retirees')}
            value={users.filter(u => u.role === "retiree").length.toLocaleString()}
            icon="👴"
            color="from-purple-500 to-purple-600"
            subtitle={t('analytics.analysis.subtitles.seniorMembers')}
          />
          <StatCard
            title={t('analytics.analysis.metrics.avgCompletion')}
            value={averageJobCompletionTime > 0 ? `${averageJobCompletionTime} days` : "N/A"}
            icon="⏱️"
            color="from-orange-500 to-orange-600"
            subtitle={t('analytics.analysis.subtitles.jobCompletionTime')}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Retirees by Town */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🏘️</span>
              {t('analytics.analysis.charts.retireesByTown')}
            </h3>
            {townChartData.length === 0 ? (
              <EmptyState
                icon={<span role="img" aria-label="chart">📊</span>}
                title={t('analytics.analysis.emptyStates.noTownData')}
                message={t('analytics.analysis.emptyStates.noTownDataMessage')}
              />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={townChartData.sort((a, b) => b.value - a.value)}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis type="category" dataKey="name" width={100} />
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
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📈</span>
              {t('analytics.analysis.charts.jobRequestsOverTime')}
            </h3>
            {jobByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={jobByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#10B981" 
                    strokeWidth={3}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: "#059669" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📈</div>
                  <p>{t('analytics.analysis.emptyStates.noTimeSeriesData')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Job Requests by Status */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">📋</span>
              {t('analytics.analysis.charts.jobRequestsByStatus')}
            </h3>
            {jobRequestsByStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={jobRequestsByStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {jobRequestsByStatus.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={primaryColors[index % primaryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">📋</div>
                  <p>{t('analytics.analysis.emptyStates.noStatusData')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Users by Role Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">👥</span>
              {t('analytics.analysis.charts.usersByRole')}
            </h3>
            {usersByRoleDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={usersByRoleDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {usersByRoleDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={gradientColors[index % gradientColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">👥</div>
                  <p>{t('analytics.analysis.emptyStates.noRoleData')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Events by Category */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🎉</span>
              {t('analytics.analysis.charts.eventsByCategory')}
            </h3>
            {eventsByCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={eventsByCategoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {eventsByCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={primaryColors[index % primaryColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🎉</div>
                  <p>{t('analytics.analysis.emptyStates.noEventCategoryData')}</p>
                </div>
              </div>
            )}
          </div>

          {/* Events Over Time */}
          <div className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
              <span className="mr-2">🗓️</span>
              {t('analytics.analysis.charts.eventsOverTime')}
            </h3>
            {eventsByMonthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={eventsByMonthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8B5CF6" 
                    strokeWidth={3}
                    dot={{ fill: "#8B5CF6", strokeWidth: 2, r: 6 }}
                    activeDot={{ r: 8, fill: "#7C3AED" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <div className="text-4xl mb-2">🗓️</div>
                  <p>{t('analytics.analysis.emptyStates.noEventTimeSeriesData')}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>{t('analytics.analysis.footer')} {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;

