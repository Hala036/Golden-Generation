import React from 'react';

const EmptyState = ({
  icon = null,
  title = 'No data found',
  message = '',
  actionLabel = '',
  onAction = null,
  children,
  className = '',
}) => (
  <div className={`flex flex-col items-center justify-center py-12 text-gray-400 ${className}`}>
    {icon && <div className="mb-4 text-5xl">{icon}</div>}
    <div className="text-xl font-semibold mb-2">{title}</div>
    {message && <div className="text-sm mb-2">{message}</div>}
    {children}
    {actionLabel && onAction && (
      <button
        onClick={onAction}
        className="mt-2 px-4 py-2 bg-yellow-400 text-black rounded hover:bg-yellow-500 font-semibold"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState; 