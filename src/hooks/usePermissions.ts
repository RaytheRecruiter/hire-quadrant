// Loads the signed-in user's company_members row (if any) and exposes
// permission helpers. Per Scott 2026-04-29 (#4) Phase 1.
//
// One member per (company, user). If a user belongs to multiple companies
// (Phase 2 territory), we pick the most-recent active row — Phase 1 ships
// against the assumption that each company user has a single membership.

import { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
  CompanyMember,
  PermissionKey,
  can as canCheck,
  effectivePermissions,
} from '../utils/permissions';

interface UsePermissionsResult {
  member: CompanyMember | null;
  loading: boolean;
  can: (key: PermissionKey) => boolean;
  isOwner: boolean;
  isAdmin: boolean;
  isStandard: boolean;
  refresh: () => Promise<void>;
}

export function usePermissions(): UsePermissionsResult {
  const { user } = useAuth();
  const [member, setMember] = useState<CompanyMember | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) {
      setMember(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from('company_members')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    setMember(data ? (data as CompanyMember) : null);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // Reload on user id change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const perms = effectivePermissions(member);

  return {
    member,
    loading,
    can: (key: PermissionKey) => canCheck(member, key),
    isOwner: member?.role === 'owner',
    isAdmin: member?.role === 'admin',
    isStandard: member?.role === 'standard',
    refresh: load,
    // Surface effective permissions for components that want the bag directly.
    ...{ permissions: perms },
  } as UsePermissionsResult;
}
