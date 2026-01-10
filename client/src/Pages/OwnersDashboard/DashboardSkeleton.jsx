import React from 'react';

const DashboardSkeleton = () => {
  return (
    <>
      <div className="fixed inset-0 bg-slate-900 -z-10" />
      <div className="flex-1 w-full flex flex-col h-screen overflow-hidden animate-pulse">
        {/* Header Skeleton */}
        <div className="h-16 w-full border-b border-slate-700 bg-slate-800 flex items-center justify-between px-6 shrink-0 z-20">
           <div className="h-6 w-32 bg-slate-600 rounded"></div>
           <div className="h-10 w-20 rounded-md bg-slate-600"></div>
        </div>

        <main className="flex-1 overflow-y-auto p-10 sm:p-6 lg:p-8 pt-24">
          {/* Stats Cards Skeleton */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10 sm:gap-6 mb-10">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className="bg-slate-800 rounded-2xl p-6 border border-slate-700 h-32 flex flex-col justify-between gap-1"
              >
                <div className="flex justify-between items-start gap-10">
                  <div className="h-10 w-10 rounded-lg bg-slate-600"></div>
                </div>
                <div>
                   <div className="h-8 w-16 bg-slate-600 rounded mb-2"></div>
                   <div className="h-4 w-32 bg-slate-600/50 rounded"></div>
                </div>
              </div>
            ))}
          </section>

          {/* Section Header */}
          <div className="mb-6 space-y-2">
            <div className="h-7 w-40 bg-slate-600 rounded"></div>
            <div className="h-4 w-64 bg-slate-600/50 rounded"></div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <div className="h-9 w-24 bg-slate-600 rounded-lg"></div>
            <div className="h-9 w-24 bg-slate-700 rounded-lg"></div>
            <div className="h-9 w-24 bg-slate-700 rounded-lg"></div>
          </div>

          {/* List Items Skeleton */}
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="bg-slate-800 border border-slate-700 rounded-xl p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Avatar + User Info */}
                  <div className="flex items-center gap-4 w-full sm:w-2/3">
                    <div className="w-12 h-12 rounded-full bg-slate-600 shrink-0"></div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-32 bg-slate-600 rounded"></div>
                        <div className="h-5 w-16 bg-slate-600/50 rounded-full"></div>
                      </div>
                      <div className="h-4 w-48 bg-slate-600/50 rounded"></div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex gap-3 mt-2 sm:mt-0 w-full sm:w-auto">
                    <div className="h-9 w-24 bg-slate-700 rounded-lg"></div>
                    <div className="h-9 w-20 bg-slate-700 rounded-lg"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
};

export default DashboardSkeleton;