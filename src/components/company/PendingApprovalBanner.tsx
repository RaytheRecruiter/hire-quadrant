import React from 'react';
import { AlertTriangle } from 'lucide-react';

const PendingApprovalBanner: React.FC = () => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl px-6 py-4 flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
      <div>
        <h3 className="text-sm font-semibold text-amber-800">Account Pending Approval</h3>
        <p className="text-sm text-amber-700 mt-1">
          Your company account is pending admin approval. You'll have full access once an admin reviews your account.
        </p>
      </div>
    </div>
  );
};

export default PendingApprovalBanner;
