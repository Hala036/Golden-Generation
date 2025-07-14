import { useMemo } from "react";

export const useChartData = (users, jobs, availableSettlements = [], events = []) => {
  // ✅ Retirees by Town — only allowed settlements
    const townChartData = useMemo(() => {
    const retireeCountsByTown = {};
    const seniorUsers = users.filter(user => user.role === "retiree");

    seniorUsers.forEach((user) => {
      const rawTown = user.idVerification?.settlement;
      if (!rawTown) return;

      // Capitalize each word, remove extra spaces
      const formattedTown = rawTown
        .trim()
        .replace(/\s+/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      if (availableSettlements.includes(formattedTown)) {
        retireeCountsByTown[formattedTown] = (retireeCountsByTown[formattedTown] || 0) + 1;
      }
    });

    return Object.entries(retireeCountsByTown).map(([name, value]) => ({ name, value }));
    }, [users, availableSettlements]);



  // 🔁 Existing logic: Job Requests by Month
  const jobByMonthData = useMemo(() => {
    const monthCounts = {};
    jobs.forEach((job) => {
      if (job.createdAt?.toDate) {
        const date = job.createdAt.toDate();
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    return Object.entries(monthCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [jobs]);

  const totalUsers = useMemo(() => users.length, [users]);

  const totalVolunteers = useMemo(
    () => users.filter(user => user.role === "volunteer").length,
    [users]
  );

  const jobRequestsByStatus = useMemo(() => {
    const statusCounts = {};
    jobs.forEach(job => {
      const status = job.status || "Unknown"; // Provide a default if status is missing
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return Object.entries(statusCounts).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  const averageJobCompletionTime = useMemo(() => {
    let totalDuration = 0;
    let completedJobsCount = 0;

    jobs.forEach(job => {
      if (job.createdAt?.toDate && job.completedAt?.toDate) {
        const created = job.createdAt.toDate().getTime();
        const completed = job.completedAt.toDate().getTime();
        const duration = completed - created;
        if (duration > 0) {
          totalDuration += duration;
          completedJobsCount++;
        }
      }
    });

    if (completedJobsCount === 0) return 0;

    const averageMs = totalDuration / completedJobsCount;
    const averageDays = averageMs / (1000 * 60 * 60 * 24);
    return averageDays.toFixed(2);
  }, [jobs]);

  const usersByRoleDistribution = useMemo(() => {
    const roleCounts = {};
    users.forEach(user => {
      const role = user.role || "Unknown"; // Provide a default if role is missing
      roleCounts[role] = (roleCounts[role] || 0) + 1;
    });
    return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
  }, [users]);

  const eventsByCategoryData = useMemo(() => {
    const categoryCounts = {};
    events.forEach(event => {
      const category = event.category || "Unknown"; // Provide a default if category is missing
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    return Object.entries(categoryCounts).map(([name, value]) => ({ name, value }));
  }, [events]);

  const eventsByMonthData = useMemo(() => {
    const monthCounts = {};
    events.forEach((event) => {
      if (event.createdAt?.toDate) {
        const date = event.createdAt.toDate();
        const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[month] = (monthCounts[month] || 0) + 1;
      }
    });
    return Object.entries(monthCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [events]);

  return {
    townChartData,
    jobByMonthData,
    totalUsers,
    totalVolunteers,
    jobRequestsByStatus,
    averageJobCompletionTime,
    usersByRoleDistribution,
    eventsByCategoryData,
    eventsByMonthData,
  };
};
