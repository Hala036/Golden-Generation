import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ScatterChart, Scatter, ComposedChart
} from "recharts";
import { 
  CalendarIcon, 
  ChartBarIcon, 
  ClockIcon, 
  UserGroupIcon,
  TrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import useFetchAnalysisData from "../../../hooks/useFetchAnalysisData";
import { useChartData } from "../../../hooks/useChartData";
import { useLanguage } from '../../../context/LanguageContext';

const AdvancedAnalysis = () => {
  const { t } = useLanguage();
  const { users, jobs, availableSettlements, loading, error } = useFetchAnalysisData();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSettlement, setSelectedSettlement] = useState('all');
  const [realTimeMetrics, setRealTimeMetrics] = useState({
    activeUsers: 0,
    pendingJobs: 0,
    systemHealth: 'healthy',
    responseTime: 0
  });

  const {
    townChartData,
    jobByMonthData,
    totalUsers,
    totalVolunteers,
    jobRequestsByStatus,
    averageJobCompletionTime,
    usersByRoleDistribution,
  } = useChartData(users, jobs, availableSettlements);

  // Simulate real-time metrics
  useEffect(() => {
    const interval = setInterval(() => {
      setRealTimeMetrics(prev => ({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        pendingJobs: Math.floor(Math.random() * 20) + 5,
        systemHealth: Math.random() > 0.1 ? 'healthy' : 'warning',
        responseTime: Math.floor(Math.random() * 200) + 50
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Enhanced metrics calculations
  const enhancedMetrics = {
    userGrowthRate: ((users.filter(u => {
      const createdAt = u.createdAt?.toDate?.() || new Date();
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return createdAt > thirtyDaysAgo;
    }).length / totalUsers) * 100).toFixed(1),
    
    jobCompletionRate: jobs.length > 0 ? 
      ((jobs.filter(j => j.status === 'completed').length / jobs.length) * 100).toFixed(1) : 0,
    
    averageResponseTime: jobs.length > 0 ? 
      (jobs.reduce((acc, job) => {
        if (job.createdAt?.toDate && job.assignedAt?.toDate) {
          return acc + (job.assignedAt.toDate() - job.createdAt.toDate());
        }
        return acc;
      }, 0) / jobs.filter(j => j.assignedAt).length / (1000 * 60 * 60)).toFixed(1) : 0,
    
    userRetentionRate: ((users.filter(u => {
      const lastActive = u.lastActive?.toDate?.() || new Date();
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return lastActive > sevenDaysAgo;
    }).length / totalUsers) * 100).toFixed(1)
  };

  const timeRangeOptions = [
    { value: '7d', label: t('analytics.advanced.timeRanges.7d') },
    { value: '30d', label: t('analytics.advanced.timeRanges.30d') },
    { value: '90d', label: t('analytics.advanced.timeRanges.90d') },
    { value: '1y', label: t('analytics.advanced.timeRanges.1y') },
    { value: 'all', label: t('analytics.advanced.timeRanges.all') }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const MetricCard = ({ title, value, subtitle, icon, color, trend, trendValue }) => (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${color} hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {icon}
            <h3 className="text-lg font-semibold text-gray-800 ml-2">{title}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-600">{subtitle}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              {trend === 'up' ? <TrendingUpIcon className="w-4 h-4 mr-1" /> : <TrendingUpIcon className="w-4 h-4 mr-1 transform rotate-180" />}
              {trendValue}% {t('analytics.advanced.trends.fromLastPeriod')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SystemHealthCard = ({ health, responseTime }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t('analytics.advanced.systemHealth.title')}</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          health === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {health === 'healthy' ? <CheckCircleIcon className="w-4 h-4 mr-1" /> : <ExclamationTriangleIcon className="w-4 h-4 mr-1" />}
          {health === 'healthy' ? t('analytics.advanced.systemHealth.healthy') : t('analytics.advanced.systemHealth.warning')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">{t('analytics.advanced.systemHealth.responseTime')}</p>
          <p className="text-2xl font-bold text-gray-900">{responseTime}ms</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('analytics.advanced.systemHealth.uptime')}</p>
          <p className="text-2xl font-bold text-gray-900">99.9%</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-lg text-gray-700">{t('analytics.advanced.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <XCircleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <div className="text-red-500 text-xl mb-4">{t('analytics.advanced.error.title')}</div>
            <div className="text-gray-700">{error}</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('analytics.advanced.title')}</h1>
          <p className="text-gray-600">{t('analytics.advanced.subtitle')}</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.advanced.filters.timeRange')}</label>
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {timeRangeOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.advanced.filters.settlement')}</label>
              <select 
                value={selectedSettlement} 
                onChange={(e) => setSelectedSettlement(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('analytics.advanced.filters.allSettlements')}</option>
                {availableSettlements.map(settlement => (
                  <option key={settlement} value={settlement}>{settlement}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Real-time Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title={t('analytics.advanced.metrics.activeUsers')}
            value={realTimeMetrics.activeUsers}
            subtitle={t('analytics.advanced.subtitles.currentlyOnline')}
            icon={<UserGroupIcon className="w-6 h-6 text-blue-600" />}
            color="border-blue-500"
            trend="up"
            trendValue="12"
          />
          <MetricCard
            title={t('analytics.advanced.metrics.pendingJobs')}
            value={realTimeMetrics.pendingJobs}
            subtitle={t('analytics.advanced.subtitles.awaitingAssignment')}
            icon={<ClockIcon className="w-6 h-6 text-orange-600" />}
            color="border-orange-500"
            trend="down"
            trendValue="8"
          />
          <MetricCard
            title={t('analytics.advanced.metrics.userGrowth')}
            value={`${enhancedMetrics.userGrowthRate}%`}
            subtitle={t('analytics.advanced.subtitles.last30Days')}
            icon={<TrendingUpIcon className="w-6 h-6 text-green-600" />}
            color="border-green-500"
            trend="up"
            trendValue="15"
          />
          <MetricCard
            title={t('analytics.advanced.metrics.completionRate')}
            value={`${enhancedMetrics.jobCompletionRate}%`}
            subtitle={t('analytics.advanced.subtitles.jobsCompleted')}
            icon={<CheckCircleIcon className="w-6 h-6 text-purple-600" />}
            color="border-purple-500"
            trend="up"
            trendValue="5"
          />
        </div>

        {/* System Health and Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-1">
            <SystemHealthCard health={realTimeMetrics.systemHealth} responseTime={realTimeMetrics.responseTime} />
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <ChartBarIcon className="w-6 h-6 mr-2 text-blue-600" />
                {t('analytics.advanced.charts.performanceTrends')}
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={jobByMonthData.slice(-6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6" 
                    fill="#3B82F6" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Enhanced Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* User Engagement Analysis */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.advanced.charts.userEngagement')}</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={usersByRoleDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="value" stroke="#EF4444" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Job Status Distribution */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.advanced.charts.jobStatusDistribution')}</h3>
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
                    <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.advanced.additionalAnalytics.responseTimeAnalysis')}</h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600 mb-2">{enhancedMetrics.averageResponseTime}h</p>
              <p className="text-sm text-gray-600">{t('analytics.advanced.subtitles.averageResponseTime')}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.advanced.additionalAnalytics.userRetention')}</h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600 mb-2">{enhancedMetrics.userRetentionRate}%</p>
              <p className="text-sm text-gray-600">{t('analytics.advanced.subtitles.7DayRetentionRate')}</p>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.advanced.additionalAnalytics.settlementCoverage')}</h3>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600 mb-2">{availableSettlements.length}</p>
              <p className="text-sm text-gray-600">{t('analytics.advanced.subtitles.activeSettlements')}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>{t('analytics.advanced.footer')} {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default AdvancedAnalysis;