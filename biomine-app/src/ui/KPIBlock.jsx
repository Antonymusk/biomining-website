import React, { memo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const KPIBlock = memo(({ title, value, unit, trend, icon: Icon, colorClass = "text-primary" }) => {
  // Extract color for glow/backgrounds
  const bgClass = colorClass.replace('text-', 'bg-');

  return (
    <div className={`h-[130px] flex flex-col justify-between bg-dark-bg/40 backdrop-blur-md border border-white/5 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] rounded-xl p-4 relative overflow-hidden group hover:border-white/10 hover:shadow-[0_0_20px_rgba(0,0,0,0.2)] transition-all duration-300`}>
      
      {/* Top Header Row */}
      <div className="flex justify-between items-start z-10 relative">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-1.5 rounded-md bg-white/5 border border-white/5 shadow-sm ${colorClass}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500/90">{title}</h3>
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[10px] font-bold ${trend >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      
      {/* Bottom Value Row */}
      <div className="z-10 relative mt-auto">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold text-white tracking-tight leading-none">{value}</span>
          {unit && <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">{unit}</span>}
        </div>
      </div>
      
      {/* Subtle Glow Background */}
      <div className={`absolute bottom-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-5 group-hover:opacity-10 transition-opacity ${bgClass} translate-x-1/2 translate-y-1/2 pointer-events-none`}></div>
    </div>
  );
});

KPIBlock.displayName = 'KPIBlock';
