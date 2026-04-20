import React from 'react';

const JobCardSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-card border border-gray-100 p-5 flex items-start gap-4">
    <div className="skeleton h-12 w-12 rounded-xl flex-shrink-0" />
    <div className="flex-1 space-y-2.5">
      <div className="skeleton h-5 w-2/3" />
      <div className="skeleton h-4 w-1/2" />
      <div className="flex gap-2 pt-1">
        <div className="skeleton h-6 w-16 rounded-full" />
        <div className="skeleton h-6 w-20 rounded-full" />
        <div className="skeleton h-6 w-14 rounded-full" />
      </div>
    </div>
    <div className="skeleton h-10 w-20 rounded-xl flex-shrink-0" />
  </div>
);

export default JobCardSkeleton;
