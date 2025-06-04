import React from "react";

const Analysis = () => {
  // Mock data
  const totalSeniors = 120;
  const totalTowns = 15;
  const totalJobRequests = 45;
  const completedJobRequests = 30;
  const pendingJobRequests = totalJobRequests - completedJobRequests;
  const mostActiveTown = "Springfield";
  const mostRequestedDomain = "Medical Escort";

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">System Analysis</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Total Seniors */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Total Seniors</h3>
          <p className="text-3xl font-bold">{totalSeniors}</p>
        </div>

        {/* Total Towns */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Total Towns</h3>
          <p className="text-3xl font-bold">{totalTowns}</p>
        </div>

        {/* Total Job Requests */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Total Job Requests</h3>
          <p className="text-3xl font-bold">{totalJobRequests}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Completed Job Requests */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Completed Job Requests</h3>
          <p className="text-3xl font-bold">{completedJobRequests}</p>
        </div>

        {/* Pending Job Requests */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Pending Job Requests</h3>
          <p className="text-3xl font-bold">{pendingJobRequests}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        {/* Most Active Town */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Most Active Town</h3>
          <p className="text-2xl font-bold">{mostActiveTown}</p>
        </div>

        {/* Most Requested Domain */}
        <div className="bg-white p-6 rounded shadow">
          <h3 className="text-xl mb-2">Most Requested Domain</h3>
          <p className="text-2xl font-bold">{mostRequestedDomain}</p>
        </div>
      </div>
    </div>
  );
};

export default Analysis;
