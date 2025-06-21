import React from 'react';
import { FaClock, FaCalendarAlt, FaTag } from 'react-icons/fa';
import { getCategoryAppearance } from '../../utils/categoryColors';
import { Clock, Calendar as CalendarIcon, Tag, Users, MapPin } from 'lucide-react';

const EventPopover = React.forwardRef(({ event, ...props }, ref) => {
  if (!event) return null;

  const appearance = getCategoryAppearance(event.category || 'default');

  const tagStyle = {
    backgroundColor: appearance?.style?.backgroundColor || '#a0aec0', // Default to gray
    color: appearance?.style?.color || 'white',
  };

  const renderContent = (content) => {
    if (typeof content === 'object' && content !== null && content.name) {
      return content.name;
    }
    return content;
  };

  // Get the dynamic appearance for the category tag
  const categoryAppearance = getCategoryAppearance(event.category);

  // Helper to format date for display
  const formatDate = (dateString) => {
    if (dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    }
    return 'N/A';
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs text-sm text-gray-700">
      <h3 className="font-bold text-lg mb-3 text-gray-800">{renderContent(event.title)}</h3>
      
      <div className="space-y-2">
        <div className="flex items-center">
          <FaClock className="mr-2 text-gray-400" />
          <span>{renderContent(event.timeFrom) || 'N/A'} - {renderContent(event.timeTo) || ''}</span>
        </div>
        <div className="flex items-center">
          <FaCalendarAlt className="mr-2 text-gray-400" />
          <span>{formatDate(event.startDate || event.date)}</span>
        </div>
        {event.category && (
          <div className="flex items-center pt-2">
            <span 
              className={`text-xs font-semibold px-2 py-1 rounded-full ${categoryAppearance.className || ''}`}
              style={categoryAppearance.style || {}}
            >
              {renderContent(event.category)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
});

export default EventPopover; 