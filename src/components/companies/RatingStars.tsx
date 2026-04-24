import React from 'react';
import { Star } from 'lucide-react';

interface Props {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<Props['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

const RatingStars: React.FC<Props> = ({ value, size = 'md', showValue = false, className = '' }) => {
  const full = Math.floor(value);
  const hasHalf = value - full >= 0.25 && value - full < 0.75;
  const rounded = hasHalf ? full + 0.5 : Math.round(value);

  return (
    <div className={`inline-flex items-center gap-1 ${className}`} aria-label={`Rated ${value} out of 5`}>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = i <= rounded;
          const half = !filled && i - 0.5 === rounded;
          return (
            <Star
              key={i}
              className={`${SIZE_CLASS[size]} ${
                filled || half ? 'fill-amber-400 text-amber-400' : 'text-gray-300 dark:text-slate-600'
              }`}
              aria-hidden="true"
            />
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-secondary-900 dark:text-white">{value.toFixed(1)}</span>
      )}
    </div>
  );
};

export default RatingStars;
