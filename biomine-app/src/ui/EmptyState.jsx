import React from 'react';

export const EmptyState = ({ icon: Icon, title, description, action }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center h-full min-h-[400px]">
      {Icon && (
        <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
          <Icon className="w-10 h-10 text-slate-500" />
        </div>
      )}
      <h3 className="text-xl font-semibold text-slate-200 mb-2">{title}</h3>
      <p className="text-slate-400 max-w-md mb-8">{description}</p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
};
