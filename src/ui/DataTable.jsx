import React, { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { SkeletonLoader } from './SkeletonLoader';
import { EmptyState } from './EmptyState';
import { Database } from 'lucide-react';

export const DataTable = memo(({ 
  data = [], 
  columns = [], 
  isLoading = false, 
  emptyTitle = "No Data Found", 
  emptyDescription = "There are no records to display.",
  height = 500,
  itemSize = 64
}) => {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemSize,
  });

  if (isLoading) {
    return (
      <div className="bg-dark-card border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex gap-4">
          {columns.map((col, idx) => (
            <div key={idx} className="h-4 bg-slate-800 rounded animate-pulse" style={{ width: col.width || '100%' }}></div>
          ))}
        </div>
        <div className="p-0">
          <SkeletonLoader type="table-row" count={5} className="px-4" />
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-dark-card border border-slate-800 rounded-xl overflow-hidden">
        <EmptyState icon={Database} title={emptyTitle} description={emptyDescription} />
      </div>
    );
  }

  const Row = ({ index }) => {
    const rowData = data[index];
    return (
      <div 
        className={`flex items-center px-4 border-b border-slate-800 hover:bg-slate-800/30 transition-colors h-full ${index % 2 === 0 ? 'bg-transparent' : 'bg-slate-900/20'}`}
      >
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="truncate px-2" style={{ width: col.width || `${100 / columns.length}%` }}>
            {col.render ? col.render(rowData) : rowData[col.key]}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-dark-card border border-slate-800 rounded-xl overflow-hidden flex flex-col">
      {/* Sticky Header */}
      <div className="flex items-center px-4 py-3 border-b border-slate-800 bg-slate-900 font-semibold text-xs text-slate-400 uppercase tracking-wider sticky top-0 z-10">
        {columns.map((col, colIdx) => (
          <div key={colIdx} className="px-2" style={{ width: col.width || `${100 / columns.length}%` }}>
            {col.title}
          </div>
        ))}
      </div>
      
      {/* Virtualized Body */}
      <div ref={parentRef} className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={virtualRow.index}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`
              }}
            >
              <Row index={virtualRow.index} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

DataTable.displayName = 'DataTable';
