import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const functions = getFunctions(app);

// Analytics Service Class
class AnalyticsService {
  constructor() {
    this.functions = functions;
  }

  // Get comprehensive system analytics
  async getSystemAnalytics(timeRange = '30d', settlement = 'all') {
    try {
      const getSystemAnalyticsFunction = httpsCallable(this.functions, 'getSystemAnalytics');
      const result = await getSystemAnalyticsFunction({ timeRange, settlement });
      
      if (result.data.success) {
        return result.data.data;
      } else {
        throw new Error(result.data.error || 'Failed to fetch system analytics');
      }
    } catch (error) {
      throw error;
    }
  }

  // Get real-time metrics
  async getRealTimeMetrics() {
    try {
      const getRealTimeMetricsFunction = httpsCallable(this.functions, 'getRealTimeMetrics');
      const result = await getRealTimeMetricsFunction();
      
      if (result.data.success) {
        return result.data.data;
      } else {
        throw new Error(result.data.error || 'Failed to fetch real-time metrics');
      }
    } catch (error) {
      throw error;
    }
  }

  // Get user behavior analytics
  async getUserBehaviorAnalytics(userId, timeRange = '30d') {
    try {
      const getUserBehaviorAnalyticsFunction = httpsCallable(this.functions, 'getUserBehaviorAnalytics');
      const result = await getUserBehaviorAnalyticsFunction({ userId, timeRange });
      
      if (result.data.success) {
        return result.data.data;
      } else {
        throw new Error(result.data.error || 'Failed to fetch user behavior analytics');
      }
    } catch (error) {
      throw error;
    }
  }

  // Get predictive analytics
  async getPredictiveAnalytics() {
    try {
      const getPredictiveAnalyticsFunction = httpsCallable(this.functions, 'getPredictiveAnalytics');
      const result = await getPredictiveAnalyticsFunction();
      
      if (result.data.success) {
        return result.data.data;
      } else {
        throw new Error(result.data.error || 'Failed to fetch predictive analytics');
      }
    } catch (error) {
      throw error;
    }
  }

  // Export analytics report
  async exportAnalyticsReport(reportType, timeRange, format = 'json') {
    try {
      const exportAnalyticsReportFunction = httpsCallable(this.functions, 'exportAnalyticsReport');
      const result = await exportAnalyticsReportFunction({ reportType, timeRange, format });
      
      if (result.data.success) {
        return result.data.data;
      } else {
        throw new Error(result.data.error || 'Failed to export analytics report');
      }
    } catch (error) {
      throw error;
    }
  }

  // Download report as file
  async downloadReport(reportType, timeRange, format = 'json') {
    try {
      const reportData = await this.exportAnalyticsReport(reportType, timeRange, format);
      
      let content, filename, mimeType;
      
      switch (format.toLowerCase()) {
        case 'json':
          content = JSON.stringify(reportData, null, 2);
          filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.json`;
          mimeType = 'application/json';
          break;
        case 'csv':
          content = this.convertToCSV(reportData);
          filename = `${reportType}_report_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;
        default:
          throw new Error('Unsupported format');
      }

      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true, filename };
    } catch (error) {
      throw error;
    }
  }

  // Convert data to CSV format
  convertToCSV(data) {
    if (typeof data !== 'object' || data === null) {
      return '';
    }

    const flattenObject = (obj, prefix = '') => {
      const flattened = {};
      
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(flattened, flattenObject(obj[key], newKey));
          } else {
            flattened[newKey] = obj[key];
          }
        }
      }
      
      return flattened;
    };

    const flattened = flattenObject(data);
    const headers = Object.keys(flattened);
    const csvContent = [
      headers.join(','),
      Object.values(flattened).map(value => 
        typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value
      ).join(',')
    ].join('\n');

    return csvContent;
  }

  // Get analytics summary for dashboard
  async getAnalyticsSummary() {
    try {
      const [systemAnalytics, realTimeMetrics, predictiveAnalytics] = await Promise.all([
        this.getSystemAnalytics('30d'),
        this.getRealTimeMetrics(),
        this.getPredictiveAnalytics()
      ]);

      return {
        system: systemAnalytics,
        realTime: realTimeMetrics,
        predictions: predictiveAnalytics,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Subscribe to real-time updates
  subscribeToRealTimeUpdates(callback, interval = 5000) {
    const intervalId = setInterval(async () => {
      try {
        const metrics = await this.getRealTimeMetrics();
        callback(metrics);
      } catch (error) {
      }
    }, interval);

    // Return unsubscribe function
    return () => clearInterval(intervalId);
  }

  // Get analytics for specific time periods
  async getTimeSeriesAnalytics(timeRanges = ['7d', '30d', '90d']) {
    try {
      const promises = timeRanges.map(range => this.getSystemAnalytics(range));
      const results = await Promise.all(promises);
      
      return timeRanges.reduce((acc, range, index) => {
        acc[range] = results[index];
        return acc;
      }, {});
    } catch (error) {
      throw error;
    }
  }

  // Get settlement-specific analytics
  async getSettlementAnalytics(settlement) {
    try {
      const analytics = await this.getSystemAnalytics('30d', settlement);
      
      // Filter and process settlement-specific data
      const settlementData = {
        ...analytics,
        settlement,
        usersInSettlement: analytics.usersBySettlement[settlement] || 0,
        jobsInSettlement: analytics.jobsBySettlement?.[settlement] || 0
      };

      return settlementData;
    } catch (error) {
      throw error;
    }
  }

  // Get comparative analytics between settlements
  async getComparativeAnalytics(settlements) {
    try {
      const promises = settlements.map(settlement => 
        this.getSettlementAnalytics(settlement)
      );
      const results = await Promise.all(promises);
      
      return {
        settlements: results,
        comparison: this.generateComparisonData(results),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate comparison data between settlements
  generateComparisonData(settlementData) {
    if (settlementData.length < 2) {
      return null;
    }

    const metrics = ['totalUsers', 'activeUsers', 'totalJobs', 'completedJobs'];
    const comparison = {};

    metrics.forEach(metric => {
      const values = settlementData.map(data => data[metric] || 0);
      const max = Math.max(...values);
      const min = Math.min(...values);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;

      comparison[metric] = {
        max,
        min,
        average: avg,
        range: max - min,
        variance: values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length
      };
    });

    return comparison;
  }
}

// Create and export singleton instance
const analyticsService = new AnalyticsService();
export default analyticsService; 