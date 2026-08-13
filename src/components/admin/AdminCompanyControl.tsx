import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Building2,
  Search,
  ChevronDown,
  ChevronRight,
  Loader2,
  Lock,
  Unlock,
  UserX,
  UserCheck,
  Trash2,
  Briefcase,
  Users,
} from 'lucide-react';
import { supabase } from '../../utils/supabaseClient';

// Ray: "Admins need to be able to control the full functionality of
// companies. (Take down jobs, remove users from company, etc.)"
//
// jobs already has an "Admins can manage jobs" RLS policy (FOR ALL, any
// admin, any company) from 20260407000004_fix_jobs_rls_policy.sql, so the
// job-status writes below just work. company_members needed a new
// super-admin bypass — see 20260813_admin_company_members_bypass.sql.

interface CompanyRow {
  id: string;
  name: string;
  display_name: string | null;
}

interface CompanyJobRow {
  id: string;
  title: string;
  status: 'open' | 'closed' | null;
  posted_date: string | null;
}

interface CompanyMemberRow {
  id: string;
  user_id: string;
  role: string;
  status: string;
  profile: { name: string | null; email: string | null } | null;
}

const AdminCompanyControl: React.FC = () => {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [jobsByCompany, setJobsByCompany] = useState<Record<string, CompanyJobRow[]>>({});
  const [membersByCompany, setMembersByCompany] = useState<Record<string, CompanyMemberRow[]>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [jobBusyId, setJobBusyId] = useState<string | null>(null);
  const [memberBusyId, setMemberBusyId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('companies')
        .select('id, name, display_name')
        .order('display_name', { ascending: true });
      if (error) {
        toast.error(error.message);
      } else {
        setCompanies((data as CompanyRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, []);

  const loadDetail = async (companyId: string) => {
    setDetailLoading(companyId);
    const [jobsRes, membersRes] = await Promise.all([
      supabase
        .from('jobs')
        .select('id, title, status, posted_date')
        .eq('company_id', companyId)
        .order('posted_date', { ascending: false }),
      supabase
        .from('company_members')
        .select('id, user_id, role, status')
        .eq('company_id', companyId)
        .order('role', { ascending: true }),
    ]);

    const jobs = (jobsRes.data as CompanyJobRow[]) ?? [];
    setJobsByCompany((m) => ({ ...m, [companyId]: jobs }));

    const memberRows = (membersRes.data as Array<{ id: string; user_id: string; role: string; status: string }>) ?? [];
    if (memberRows.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, name, email')
        .in('id', memberRows.map((m) => m.user_id));
      const profileById = new Map(
        ((profiles as Array<{ id: string; name: string | null; email: string | null }>) ?? []).map((p) => [p.id, p]),
      );
      setMembersByCompany((m) => ({
        ...m,
        [companyId]: memberRows.map((r) => ({ ...r, profile: profileById.get(r.user_id) ?? null })),
      }));
    } else {
      setMembersByCompany((m) => ({ ...m, [companyId]: [] }));
    }
    setDetailLoading(null);
  };

  const toggleExpand = (company: CompanyRow) => {
    if (expandedId === company.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(company.id);
    if (!jobsByCompany[company.id]) loadDetail(company.id);
  };

  const toggleJobStatus = async (companyId: string, job: CompanyJobRow) => {
    const next = job.status === 'closed' ? 'open' : 'closed';
    setJobBusyId(job.id);
    const { error } = await supabase.from('jobs').update({ status: next }).eq('id', job.id);
    setJobBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setJobsByCompany((m) => ({
      ...m,
      [companyId]: (m[companyId] ?? []).map((j) => (j.id === job.id ? { ...j, status: next } : j)),
    }));
    toast.success(next === 'closed' ? 'Job taken down' : 'Job reopened');
  };

  const setMemberStatus = async (companyId: string, member: CompanyMemberRow, status: 'active' | 'inactive') => {
    setMemberBusyId(member.id);
    const { error } = await supabase
      .from('company_members')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', member.id);
    setMemberBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembersByCompany((m) => ({
      ...m,
      [companyId]: (m[companyId] ?? []).map((row) => (row.id === member.id ? { ...row, status } : row)),
    }));
    toast.success(status === 'inactive' ? 'Member deactivated' : 'Member reactivated');
  };

  const removeMember = async (companyId: string, member: CompanyMemberRow) => {
    const label = member.profile?.name || member.profile?.email || 'this user';
    if (!window.confirm(`Remove ${label} from this company? This deletes the membership entirely — they'll lose access immediately.`)) {
      return;
    }
    setMemberBusyId(member.id);
    const { error } = await supabase.from('company_members').delete().eq('id', member.id);
    setMemberBusyId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    setMembersByCompany((m) => ({
      ...m,
      [companyId]: (m[companyId] ?? []).filter((row) => row.id !== member.id),
    }));
    toast.success('Member removed');
  };

  const filteredCompanies = (() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) => (c.display_name || c.name || '').toLowerCase().includes(q));
  })();

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-6">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Building2 className="w-5 h-5 text-green-600" />
          Company Control
        </h2>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
          Take down a company's jobs or remove team members — for cases the company's own Owner/Admin can't or shouldn't handle themselves.
        </p>
      </div>

      <div className="px-6 pt-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search companies…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
      </div>

      <div className="p-6">
        {filteredCompanies.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-slate-400">No companies match "{searchTerm}"</p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-slate-700 border border-gray-100 dark:border-slate-700 rounded-lg">
            {filteredCompanies.map((company) => {
              const expanded = expandedId === company.id;
              const jobs = jobsByCompany[company.id];
              const members = membersByCompany[company.id];
              return (
                <div key={company.id}>
                  <button
                    type="button"
                    onClick={() => toggleExpand(company)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                      {expanded ? <ChevronDown className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
                      {company.display_name || company.name}
                    </span>
                  </button>

                  {expanded && (
                    <div className="px-4 pb-4 bg-gray-50/50 dark:bg-slate-900/30">
                      {detailLoading === company.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-6" />
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2">
                          {/* Jobs */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 p-3">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5" />
                              Jobs ({jobs?.length ?? 0})
                            </h4>
                            {!jobs || jobs.length === 0 ? (
                              <p className="text-xs text-gray-400 dark:text-slate-500">No jobs.</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                                {jobs.map((job) => {
                                  const isClosed = job.status === 'closed';
                                  return (
                                    <li key={job.id} className="flex items-center justify-between gap-2 text-sm">
                                      <span className="truncate text-gray-800 dark:text-slate-200">{job.title}</span>
                                      <button
                                        type="button"
                                        onClick={() => toggleJobStatus(company.id, job)}
                                        disabled={jobBusyId === job.id}
                                        className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium disabled:opacity-60 ${
                                          isClosed
                                            ? 'bg-gray-200 text-gray-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-gray-300'
                                            : 'bg-green-100 text-green-800 hover:bg-green-200'
                                        }`}
                                      >
                                        {jobBusyId === job.id ? (
                                          <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : isClosed ? (
                                          <Lock className="h-3 w-3" />
                                        ) : (
                                          <Unlock className="h-3 w-3" />
                                        )}
                                        {isClosed ? 'Take down' : 'Open'}
                                      </button>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>

                          {/* Members */}
                          <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700 p-3">
                            <h4 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5" />
                              Team ({members?.length ?? 0})
                            </h4>
                            {!members || members.length === 0 ? (
                              <p className="text-xs text-gray-400 dark:text-slate-500">No team members.</p>
                            ) : (
                              <ul className="space-y-1.5 max-h-64 overflow-y-auto">
                                {members.map((member) => (
                                  <li key={member.id} className="flex items-center justify-between gap-2 text-sm">
                                    <div className="min-w-0">
                                      <p className="truncate text-gray-800 dark:text-slate-200">
                                        {member.profile?.name || member.profile?.email || member.user_id}
                                      </p>
                                      <p className="text-[10px] text-gray-400 dark:text-slate-500 capitalize">
                                        {member.role} · {member.status}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setMemberStatus(company.id, member, member.status === 'active' ? 'inactive' : 'active')
                                        }
                                        disabled={memberBusyId === member.id}
                                        title={member.status === 'active' ? 'Deactivate' : 'Reactivate'}
                                        className="p-1 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-60"
                                      >
                                        {member.status === 'active' ? <UserX className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => removeMember(company.id, member)}
                                        disabled={memberBusyId === member.id}
                                        title="Remove entirely"
                                        className="p-1 rounded text-rose-600 hover:bg-rose-50 disabled:opacity-60"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCompanyControl;
