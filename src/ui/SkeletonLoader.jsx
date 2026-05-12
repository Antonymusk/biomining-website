import React from 'react';

export const SkeletonLoader = ({ type = 'card', count = 1, className = '' }) => {
  const Skeletons = Array.from({ length: count }).map((_, i) => {
    switch (type) {
      case 'card':
        return (
          <div key={i} className={`bg-dark-card border border-slate-800 rounded-xl p-6 animate-pulse ${className}`}>
            <div className="w-12 h-12 bg-slate-800 rounded-lg mb-4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/3 mb-2"></div>
            <div className="h-6 bg-slate-800 rounded w-1/2"></div>
          </div>
        );
      case 'table-row':
        return (
          <div key={i} className={`flex items-center gap-4 py-4 border-b border-slate-800 animate-pulse ${className}`}>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/4"></div>
            <div className="h-8 bg-slate-800 rounded-full w-24 ml-auto"></div>
          </div>
        );
      case 'text':
        return <div key={i} className={`h-4 bg-slate-800 rounded animate-pulse mb-2 ${className}`}></div>;
      default:
        return <div key={i} className={`bg-slate-800 rounded animate-pulse ${className}`}></div>;
    }
  });

  return <>{Skeletons}</>;
};
