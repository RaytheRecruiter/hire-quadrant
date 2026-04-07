import React from 'react';

interface SubscriptionBadgeProps {
  planName: string;
  className?: string;
}

const planColors: Record<string, string> = {
  Free: 'bg-gray-100 text-gray-700',
  Basic: 'bg-blue-100 text-blue-700',
  Premium: 'bg-purple-100 text-purple-700',
  Enterprise: 'bg-yellow-100 text-yellow-800',
};

const SubscriptionBadge: React.FC<SubscriptionBadgeProps> = ({ planName, className = '' }) => {
  const colorClasses = planColors[planName] || 'bg-gray-100 text-gray-700';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}
    >
      {planName}
    </span>
  );
};

export default SubscriptionBadge;
