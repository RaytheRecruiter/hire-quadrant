import React, { useState } from 'react';
import { resolveLogoUrl, getInitials, colorFromString } from '../utils/companyLogo';

interface Props {
  company?: string | null;
  logoUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  xs: { box: 'h-8 w-8', text: 'text-xs' },
  sm: { box: 'h-10 w-10', text: 'text-sm' },
  md: { box: 'h-12 w-12', text: 'text-base' },
  lg: { box: 'h-16 w-16', text: 'text-xl' },
  xl: { box: 'h-24 w-24', text: 'text-3xl' },
};

const CompanyLogo: React.FC<Props> = ({ company, logoUrl, size = 'md', className = '' }) => {
  const [failed, setFailed] = useState(false);
  const resolved = resolveLogoUrl(company, logoUrl);
  const s = sizeMap[size];
  const initials = getInitials(company);
  const bgColor = company ? colorFromString(company) : 'bg-gray-100 text-gray-500';

  if (resolved && !failed) {
    return (
      <div className={`${s.box} rounded-xl overflow-hidden bg-white border border-gray-100 flex items-center justify-center flex-shrink-0 ${className}`}>
        <img
          src={resolved}
          alt={company || 'Company logo'}
          className="w-full h-full object-contain p-1"
          onError={() => setFailed(true)}
          loading="lazy"
          width={96}
          height={96}
          fetchPriority="low"
        />
      </div>
    );
  }

  return (
    <div className={`${s.box} rounded-xl ${bgColor} flex items-center justify-center font-display font-bold flex-shrink-0 ${s.text} ${className}`}>
      {initials}
    </div>
  );
};

export default CompanyLogo;
