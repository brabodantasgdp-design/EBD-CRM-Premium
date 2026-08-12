import React from "react";

export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse p-1">
      {/* Header skeleton */}
      <div className="h-28 bg-slate-200/80 rounded-2xl w-full" />

      {/* KPI Cards skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200/80 rounded-2xl p-4 space-y-3">
            <div className="h-4 bg-slate-300 rounded w-2/3" />
            <div className="h-8 bg-slate-300 rounded w-1/2" />
            <div className="h-3 bg-slate-300 rounded w-3/4" />
          </div>
        ))}
      </div>

      {/* Main Charts Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-80 bg-slate-200/80 rounded-2xl" />
        <div className="h-80 bg-slate-200/80 rounded-2xl" />
      </div>

      {/* Pipeline & Risk Row Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-72 bg-slate-200/80 rounded-2xl" />
        <div className="h-72 bg-slate-200/80 rounded-2xl" />
      </div>
    </div>
  );
};
