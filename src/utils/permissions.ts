// Per Scott 2026-04-29 (#4): company member permissions, Phase 1 MVP.
// Three roles. Owner and Admin implicitly have everything; Standard users
// are gated by the permission flags + scope. Phase 2 adds paid features
// (Database Search, billing, recruiter activity reports) — not modeled here.

export type CompanyRole = 'owner' | 'admin' | 'standard';
export type AccessScope = 'assigned' | 'all';
export type MemberStatus = 'active' | 'inactive' | 'pending';

export type PermissionKey =
  | 'view_assigned_jobs'
  | 'view_all_jobs'
  | 'post_jobs'
  | 'edit_jobs'
  | 'sponsor_jobs'
  | 'close_jobs'
  | 'view_applicants'
  | 'message_applicants'
  | 'view_resume_contact'
  | 'download_resumes'
  | 'edit_company_page'
  | 'respond_to_reviews'
  | 'view_analytics_basic'
  | 'view_analytics_full'
  | 'manage_users'
  | 'manage_billing';

export type Permissions = Record<PermissionKey, boolean>;

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  permissions: Permissions;
  scope: AccessScope;
  status: MemberStatus;
  joined_at: string | null;
}

export const STANDARD_DEFAULT_PERMISSIONS: Permissions = {
  view_assigned_jobs: true,
  view_all_jobs: false,
  post_jobs: false,
  edit_jobs: false,
  sponsor_jobs: false,
  close_jobs: false,
  view_applicants: true,
  message_applicants: true,
  view_resume_contact: false,
  download_resumes: false,
  edit_company_page: false,
  respond_to_reviews: false,
  view_analytics_basic: true,
  view_analytics_full: false,
  manage_users: false,
  manage_billing: false,
};

const ALL_TRUE: Permissions = Object.keys(STANDARD_DEFAULT_PERMISSIONS).reduce(
  (acc, k) => ({ ...acc, [k]: true }),
  {} as Permissions,
);

// Owner / Admin permission set. Admin cannot manage billing by default;
// Owner can. Both can manage users.
export function effectivePermissions(member: CompanyMember | null): Permissions {
  if (!member || member.status !== 'active') {
    return Object.keys(STANDARD_DEFAULT_PERMISSIONS).reduce(
      (acc, k) => ({ ...acc, [k]: false }),
      {} as Permissions,
    );
  }
  if (member.role === 'owner') {
    return ALL_TRUE;
  }
  if (member.role === 'admin') {
    // Admins inherit everything except managing billing (Owner-only by
    // default; the Owner can grant it via permissions.manage_billing).
    const adminBase = { ...ALL_TRUE, manage_billing: false };
    return { ...adminBase, ...(member.permissions || {}) };
  }
  // Standard user: explicit toggles, defaulting to recruiter floor.
  return { ...STANDARD_DEFAULT_PERMISSIONS, ...(member.permissions || {}) };
}

export function can(member: CompanyMember | null, key: PermissionKey): boolean {
  return effectivePermissions(member)[key] === true;
}

// Role display + helpers for UI.
export const ROLE_LABEL: Record<CompanyRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  standard: 'Standard User',
};

export const ROLE_DESCRIPTION: Record<CompanyRole, string> = {
  owner: 'Full account control. Can transfer ownership, manage billing, and remove any user.',
  admin: 'Full operational control. Can manage users below them but cannot remove the Owner.',
  standard: 'Recruiter / hiring manager access. Permissions are configurable.',
};

// UI grouping for the Edit modal toggles.
export const PERMISSION_GROUPS: {
  title: string;
  description?: string;
  keys: PermissionKey[];
}[] = [
  {
    title: 'Jobs',
    keys: ['post_jobs', 'edit_jobs', 'sponsor_jobs', 'close_jobs'],
  },
  {
    title: 'Candidates',
    keys: ['view_applicants', 'message_applicants', 'view_resume_contact', 'download_resumes'],
  },
  {
    title: 'Company Page',
    keys: ['edit_company_page', 'respond_to_reviews'],
  },
  {
    title: 'Analytics',
    keys: ['view_analytics_basic', 'view_analytics_full'],
  },
];

export const PERMISSION_LABEL: Record<PermissionKey, string> = {
  view_assigned_jobs: 'View assigned jobs',
  view_all_jobs: 'View all jobs',
  post_jobs: 'Post jobs',
  edit_jobs: 'Edit jobs',
  sponsor_jobs: 'Sponsor jobs',
  close_jobs: 'Close / delete jobs',
  view_applicants: 'View applicants',
  message_applicants: 'Message applicants',
  view_resume_contact: 'View resume / contact info',
  download_resumes: 'Download resumes',
  edit_company_page: 'Edit Company Page',
  respond_to_reviews: 'Respond to reviews',
  view_analytics_basic: 'View basic analytics',
  view_analytics_full: 'View full analytics',
  manage_users: 'Manage team members',
  manage_billing: 'Manage billing',
};
