import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, ComposedChart, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar
} from "recharts";
import analyticsService from "../../../services/analyticsService";
import { useLanguage } from '../../../context/LanguageContext';
import { useTheme } from '../../../context/ThemeContext';
import { useChartData } from '../../../hooks/useChartData';
import useFetchAnalysisData from '../../../hooks/useFetchAnalysisData';
import EmptyState from '../../EmptyState';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const ComprehensiveAnalytics = () => {
  const { t } = useLanguage();
  const { theme } = useTheme();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [predictiveData, setPredictiveData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [selectedSettlement, setSelectedSettlement] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [exporting, setExporting] = useState(false);

  // Fetch initial data
  useEffect(() => {
    fetchAnalyticsData();
    const unsubscribe = analyticsService.subscribeToRealTimeUpdates(setRealTimeData);
    
    return () => unsubscribe();
  }, [selectedTimeRange, selectedSettlement]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [systemData, predictiveData] = await Promise.all([
        analyticsService.getSystemAnalytics(selectedTimeRange, selectedSettlement),
        analyticsService.getPredictiveAnalytics()
      ]);

      setAnalyticsData(systemData);
      setPredictiveData(predictiveData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format) => {
    try {
      setExporting(true);
      await analyticsService.downloadReport('comprehensive', selectedTimeRange, format);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

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
            <span className="text-2xl mr-2">{icon}</span>
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
          <p className="text-sm text-gray-600">{subtitle}</p>
          {trend && (
            <div className={`flex items-center mt-2 text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
              <span className="mr-1">{trend === 'up' ? '↗' : '↘'}</span>
              {trendValue}% {t('analytics.comprehensive.trends.fromLastPeriod')}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const SystemHealthCard = ({ health, responseTime, cpuUsage, memoryUsage }) => (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{t('analytics.comprehensive.systemHealth.title')}</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          health === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          <span className="mr-1">{health === 'healthy' ? '✓' : '⚠'}</span>
          {health === 'healthy' ? t('analytics.comprehensive.systemHealth.healthy') : t('analytics.comprehensive.systemHealth.warning')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">{t('analytics.comprehensive.systemHealth.responseTime')}</p>
          <p className="text-2xl font-bold text-gray-900">{responseTime}ms</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('analytics.comprehensive.systemHealth.cpuUsage')}</p>
          <p className="text-2xl font-bold text-gray-900">{cpuUsage}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('analytics.comprehensive.systemHealth.memoryUsage')}</p>
          <p className="text-2xl font-bold text-gray-900">{memoryUsage}%</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('analytics.comprehensive.systemHealth.uptime')}</p>
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
          <span className="ml-4 text-lg text-gray-700">{t('analytics.comprehensive.loading')}</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-red-500 text-xl mb-4">⚠️ {t('analytics.comprehensive.error.title')}</div>
            <div className="text-gray-700">{error}</div>
            <button 
              onClick={fetchAnalyticsData}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {t('analytics.comprehensive.error.retry')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: t('analytics.comprehensive.tabs.overview'), icon: '📊' },
    { id: 'users', label: t('analytics.comprehensive.tabs.users'), icon: '👥' },
    { id: 'jobs', label: t('analytics.comprehensive.tabs.jobs'), icon: '📋' },
    { id: 'predictions', label: t('analytics.comprehensive.tabs.predictions'), icon: '🔮' },
    { id: 'performance', label: t('analytics.comprehensive.tabs.performance'), icon: '⚡' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">{t('analytics.comprehensive.title')}</h1>
              <p className="text-gray-600">{t('analytics.comprehensive.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {exporting ? t('analytics.comprehensive.export.exporting') : t('analytics.comprehensive.export.json')}
              </button>
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {exporting ? t('analytics.comprehensive.export.exporting') : t('analytics.comprehensive.export.csv')}
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.comprehensive.filters.timeRange')}</label>
              <select 
                value={selectedTimeRange} 
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="7d">{t('analytics.comprehensive.timeRanges.7d')}</option>
                <option value="30d">{t('analytics.comprehensive.timeRanges.30d')}</option>
                <option value="90d">{t('analytics.comprehensive.timeRanges.90d')}</option>
                <option value="1y">{t('analytics.comprehensive.timeRanges.1y')}</option>
                <option value="all">{t('analytics.comprehensive.timeRanges.all')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('analytics.comprehensive.filters.settlement')}</label>
              <select 
                value={selectedSettlement} 
                onChange={(e) => setSelectedSettlement(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">{t('analytics.comprehensive.filters.allSettlements')}</option>
                {analyticsData?.settlements?.map(settlement => (
                  <option key={settlement.id} value={settlement.id}>{settlement.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Real-time Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title={t('analytics.comprehensive.metrics.activeUsers')}
                value={realTimeData?.activeUsers || 0}
                subtitle={t('analytics.comprehensive.subtitles.currentlyOnline')}
                icon="👥"
                color="border-blue-500"
                trend="up"
                trendValue="12"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.pendingJobs')}
                value={realTimeData?.pendingJobs || 0}
                subtitle={t('analytics.comprehensive.subtitles.awaitingAssignment')}
                icon="⏰"
                color="border-orange-500"
                trend="down"
                trendValue="8"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.totalUsers')}
                value={analyticsData?.totalUsers?.toLocaleString() || 0}
                subtitle={t('analytics.comprehensive.subtitles.allRegisteredUsers')}
                icon="👤"
                color="border-green-500"
                trend="up"
                trendValue="15"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.completionRate')}
                value={`${analyticsData?.jobCompletionRate || 0}%`}
                subtitle={t('analytics.comprehensive.subtitles.jobsCompleted')}
                icon="✅"
                color="border-purple-500"
                trend="up"
                trendValue="5"
              />
            </div>

            {/* System Health and Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SystemHealthCard 
                  health={realTimeData?.systemHealth}
                  responseTime={realTimeData?.responseTime}
                  cpuUsage={realTimeData?.cpuUsage}
                  memoryUsage={realTimeData?.memoryUsage}
                />
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">📈</span>
                    {t('analytics.comprehensive.charts.performanceTrends')}
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={analyticsData?.jobsByMonth || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Area 
                        type="monotone" 
                        dataKey="count" 
                        stroke="#3B82F6" 
                        fill="#3B82F6" 
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.userDistribution')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analyticsData?.usersByRole || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(analyticsData?.usersByRole || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.jobStatusDistribution')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={Object.entries(analyticsData?.jobsByStatus || {}).map(([name, value]) => ({ name, value }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title={t('analytics.comprehensive.metrics.newUsers')}
                value={analyticsData?.newUsers || 0}
                subtitle={t('analytics.comprehensive.subtitles.thisPeriod')}
                icon="🆕"
                color="border-green-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.activeUsers')}
                value={analyticsData?.activeUsers || 0}
                subtitle={t('analytics.comprehensive.subtitles.last7Days')}
                icon="🟢"
                color="border-blue-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.userGrowth')}
                value={`${((analyticsData?.newUsers / analyticsData?.totalUsers) * 100).toFixed(1)}%`}
                subtitle={t('analytics.comprehensive.subtitles.growthRate')}
                icon="📈"
                color="border-purple-500"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.usersBySettlement')}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart 
                  data={Object.entries(analyticsData?.usersBySettlement || {}).map(([name, value]) => ({ name, value }))}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={150} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title={t('analytics.comprehensive.metrics.totalJobs')}
                value={analyticsData?.totalJobs || 0}
                subtitle={t('analytics.comprehensive.subtitles.allTime')}
                icon="📋"
                color="border-blue-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.completedJobs')}
                value={analyticsData?.completedJobs || 0}
                subtitle={t('analytics.comprehensive.subtitles.successfullyCompleted')}
                icon="✅"
                color="border-green-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.avgResponseTime')}
                value={`${analyticsData?.averageResponseTime || 0}h`}
                subtitle={t('analytics.comprehensive.subtitles.timeToAssign')}
                icon="⏱️"
                color="border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.jobTrendsOverTime')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={Object.entries(analyticsData?.jobsByMonth || {}).map(([month, count]) => ({ month, count }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="#10B981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.jobStatusBreakdown')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(analyticsData?.jobsByStatus || {}).map(([name, value]) => ({ name, value }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {Object.entries(analyticsData?.jobsByStatus || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && predictiveData && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title={t('analytics.comprehensive.metrics.predictedGrowth')}
                value={`${predictiveData.userGrowth?.nextMonth || 0}`}
                subtitle={t('analytics.comprehensive.subtitles.usersNextMonth')}
                icon="🔮"
                color="border-purple-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.jobDemand')}
                value={`${predictiveData.jobDemand?.nextMonth || 0}`}
                subtitle={t('analytics.comprehensive.subtitles.jobsNextMonth')}
                icon="📈"
                color="border-blue-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.completionRate')}
                value={`${predictiveData.completionRate?.predicted || 0}%`}
                subtitle={t('analytics.comprehensive.subtitles.predictedSuccess')}
                icon="✅"
                color="border-green-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.churnRisk')}
                value={`${predictiveData.churnPrediction?.churnRate || 0}%`}
                subtitle={t('analytics.comprehensive.subtitles.atRiskUsers')}
                icon="⚠️"
                color="border-red-500"
              />
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.growthPredictions')}</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={[
                  { period: 'Current', users: analyticsData?.totalUsers || 0, jobs: analyticsData?.totalJobs || 0 },
                  { period: 'Next Month', users: predictiveData.userGrowth?.nextMonth || 0, jobs: predictiveData.jobDemand?.nextMonth || 0 },
                  { period: 'Next Quarter', users: predictiveData.userGrowth?.nextQuarter || 0, jobs: predictiveData.jobDemand?.nextQuarter || 0 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="users" fill="#3B82F6" name="Users" />
                  <Bar dataKey="jobs" fill="#10B981" name="Jobs" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                title={t('analytics.comprehensive.metrics.systemUptime')}
                value="99.9%"
                subtitle={t('analytics.comprehensive.subtitles.reliability')}
                icon="🟢"
                color="border-green-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.avgResponseTime')}
                value={`${realTimeData?.responseTime || 0}ms`}
                subtitle={t('analytics.comprehensive.subtitles.apiPerformance')}
                icon="⚡"
                color="border-blue-500"
              />
              <MetricCard
                title={t('analytics.comprehensive.metrics.errorRate')}
                value="0.1%"
                subtitle={t('analytics.comprehensive.subtitles.systemErrors')}
                icon="🔧"
                color="border-orange-500"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.systemPerformanceMetrics')}</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: t('analytics.comprehensive.performanceMetrics.uptime'), value: 99.9, fullMark: 100 },
                    { metric: t('analytics.comprehensive.performanceMetrics.responseTime'), value: 85, fullMark: 100 },
                    { metric: t('analytics.comprehensive.performanceMetrics.errorRate'), value: 95, fullMark: 100 },
                    { metric: t('analytics.comprehensive.performanceMetrics.userSatisfaction'), value: 88, fullMark: 100 },
                    { metric: t('analytics.comprehensive.performanceMetrics.jobCompletion'), value: 92, fullMark: 100 }
                  ]}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name={t('analytics.comprehensive.performanceMetrics.performance')} dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{t('analytics.comprehensive.charts.resourceUtilization')}</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{t('analytics.comprehensive.systemHealth.cpuUsage')}</span>
                      <span>{realTimeData?.cpuUsage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${realTimeData?.cpuUsage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm text-gray-600 mb-1">
                      <span>{t('analytics.comprehensive.systemHealth.memoryUsage')}</span>
                      <span>{realTimeData?.memoryUsage || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${realTimeData?.memoryUsage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8">
          <p>{t('analytics.comprehensive.footer')} {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveAnalytics; 