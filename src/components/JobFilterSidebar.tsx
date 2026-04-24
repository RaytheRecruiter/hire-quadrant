import React from 'react';
import { Filter, X } from 'lucide-react';

export interface AdvancedFilters {
  experienceLevel: string;
  workplaceType: string;
  postedWithinDays: number;
  visaSponsor: boolean;
  securityClearance: string;
  minSalary: number;
}

export const DEFAULT_ADVANCED_FILTERS: AdvancedFilters = {
  experienceLevel: '',
  workplaceType: '',
  postedWithinDays: 0,
  visaSponsor: false,
  securityClearance: '',
  minSalary: 0,
};

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Any' },
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead / Principal' },
  { value: 'executive', label: 'Executive' },
];

const WORKPLACE_TYPES = [
  { value: '', label: 'Any' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
];

const POSTED_WINDOWS = [
  { value: 0, label: 'Anytime' },
  { value: 1, label: '24 hours' },
  { value: 3, label: '3 days' },
  { value: 7, label: '1 week' },
  { value: 14, label: '2 weeks' },
  { value: 30, label: '1 month' },
];

const CLEARANCES = [
  { value: '', label: 'Any' },
  { value: 'none', label: 'None required' },
  { value: 'public_trust', label: 'Public Trust' },
  { value: 'secret', label: 'Secret' },
  { value: 'top_secret', label: 'Top Secret' },
  { value: 'ts_sci', label: 'TS/SCI' },
];

interface Props {
  value: AdvancedFilters;
  onChange: (patch: Partial<AdvancedFilters>) => void;
  onReset: () => void;
  className?: string;
}

const JobFilterSidebar: React.FC<Props> = ({ value, onChange, onReset, className }) => {
  const activeCount =
    (value.experienceLevel ? 1 : 0) +
    (value.workplaceType ? 1 : 0) +
    (value.postedWithinDays > 0 ? 1 : 0) +
    (value.visaSponsor ? 1 : 0) +
    (value.securityClearance ? 1 : 0) +
    (value.minSalary > 0 ? 1 : 0);

  return (
    <aside
      className={`bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 ${className ?? ''}`}
      aria-label="Advanced filters"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary-500" />
          <h3 className="text-sm font-semibold text-secondary-900 dark:text-white">Filters</h3>
          {activeCount > 0 && (
            <span className="text-xs bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            Reset
          </button>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1.5">
            Minimum salary
          </label>
          <input
            type="range"
            min={0}
            max={250000}
            step={5000}
            value={value.minSalary}
            onChange={(e) => onChange({ minSalary: parseInt(e.target.value, 10) })}
            className="w-full accent-primary-500"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mt-1">
            <span>$0</span>
            <span className="font-semibold text-secondary-900 dark:text-white">
              {value.minSalary === 0 ? 'Any' : `$${Math.round(value.minSalary / 1000)}k+`}
            </span>
            <span>$250k+</span>
          </div>
        </div>

        <SelectField
          label="Experience"
          value={value.experienceLevel}
          options={EXPERIENCE_LEVELS}
          onChange={(v) => onChange({ experienceLevel: v })}
        />
        <SelectField
          label="Workplace"
          value={value.workplaceType}
          options={WORKPLACE_TYPES}
          onChange={(v) => onChange({ workplaceType: v })}
        />
        <SelectField
          label="Posted within"
          value={String(value.postedWithinDays)}
          options={POSTED_WINDOWS.map((p) => ({ value: String(p.value), label: p.label }))}
          onChange={(v) => onChange({ postedWithinDays: parseInt(v, 10) })}
        />
        <SelectField
          label="Security clearance"
          value={value.securityClearance}
          options={CLEARANCES}
          onChange={(v) => onChange({ securityClearance: v })}
        />

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={value.visaSponsor}
            onChange={(e) => onChange({ visaSponsor: e.target.checked })}
            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-sm text-gray-700 dark:text-slate-300">Visa sponsorship</span>
        </label>
      </div>
    </aside>
  );
};

const SelectField: React.FC<{
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (v: string) => void;
}> = ({ label, value, options, onChange }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-sm rounded-lg border-gray-200 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100 focus:ring-primary-500 focus:border-primary-500"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  </div>
);

export default JobFilterSidebar;
