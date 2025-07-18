import React from "react";
import { FaHistory, FaCheck, FaHourglass, FaUserClock, FaArchive } from "react-icons/fa";
import { useLanguage } from "../../context/LanguageContext";
import { useTranslation } from 'react-i18next';

function StatusHistory({ statusHistory }) {
  const { t } = useTranslation();
  if (!statusHistory || statusHistory.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500 italic">{t('admin.jobs.status.noHistory')}</p>
      </div>
    );
  }

  // Sort status history by timestamp (newest first)
  const sortedHistory = [...statusHistory].sort((a, b) => {
    return b.timestamp.seconds - a.timestamp.seconds;
  });

  // Get status icon based on status value
  const getStatusIcon = (status) => {
    switch (status) {
      case "Active":
        return <FaHourglass className="text-blue-500" />;
      case "In Progress":
        return <FaUserClock className="text-yellow-500" />;
      case "Fulfilled":
        return <FaCheck className="text-green-500" />;
      case "Archived":
        return <FaArchive className="text-gray-500" />;
      default:
        return <FaHistory className="text-gray-500" />;
    }
  };

  // Get status color based on status value
  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "border-blue-500";
      case "In Progress":
        return "border-yellow-500";
      case "Fulfilled":
        return "border-green-500";
      case "Archived":
        return "border-gray-500";
      default:
        return "border-gray-300";
    }
  };

  function formatStatusDate(ts) {
    if (!ts) return "Unknown date";
    // Firestore Timestamp
    if (typeof ts === "object" && typeof ts.seconds === "number") {
      return new Date(ts.seconds * 1000).toLocaleString();
    }
    // JS Date object
    if (ts instanceof Date) {
      return ts.toLocaleString();
    }
    // ISO string
    if (typeof ts === "string") {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? "Unknown date" : d.toLocaleString();
    }
    return "Unknown date";
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FaHistory className="mr-2 ml-2" /> {t('admin.jobs.status.history')}
      </h3>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline events */}
        <div className="space-y-6">
          {sortedHistory.map((item, index) => (
            <div key={index} className="relative pl-14">
              {/* Timeline dot */}
              <div
                className={`absolute left-4 top-1 w-4 h-4 rounded-full border-2 ${getStatusColor(
                  item.status
                )} bg-white z-10`}
              ></div>

              {/* Timeline content */}
              <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                <div className="flex items-center mb-2">
                  {getStatusIcon(item.status)}
                  <span className="font-semibold ml-2">{item.status ? t('admin.jobs.status.' + item.status.toLowerCase().replace(/ /g, '')) : ''}</span>
                  <span className="text-gray-500 text-sm ml-auto">
                    {formatStatusDate(item.timestamp)}
                  </span>
                </div>

                {item.notes && <p className="text-gray-600">{item.notes === 'Job request created' ? t('admin.jobs.notes.jobRequestCreated') : item.notes}</p>}

                {item.changedBy && (
                  <p className="text-gray-500 text-sm mt-2">
                    {t('admin.jobs.status.changed')} {item.changedBy}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Make sure this is at the very end of the file with no trailing code
export default StatusHistory;

