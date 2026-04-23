import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface CompanyProfile {
  id: string;
  name: string;
  displayName: string;
  description: string;
  website?: string;
  logo?: string;
  industry: string;
  size: string;
  location: string;
  founded?: string;
  specialties: string[];
  benefits: string[];
  culture: string;
  xmlFeedPath: string;
  contactEmail?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CompanyContextType {
  companies: CompanyProfile[];
  loading: boolean;
  error: string | null;
  getCompanyByName: (name: string) => CompanyProfile | undefined;
  getCompanyById: (id: string) => CompanyProfile | undefined;
  addCompany: (company: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateCompany: (id: string, updates: Partial<CompanyProfile>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export const useCompanies = () => {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error('useCompanies must be used within a CompanyProvider');
  }
  return context;
};

interface CompanyProviderProps {
  children: ReactNode;
}

// Helper: Map Supabase snake_case row to camelCase CompanyProfile
const mapRowToCompany = (row: any): CompanyProfile => ({
  id: row.id,
  name: row.name,
  displayName: row.display_name ?? row.name,
  description: row.description ?? '',
  website: row.website,
  logo: row.logo,
  industry: row.industry ?? '',
  size: row.size ?? '',
  location: row.location ?? '',
  founded: row.founded,
  specialties: row.specialties ?? [],
  benefits: row.benefits ?? [],
  culture: row.culture ?? '',
  xmlFeedPath: row.xml_feed_path ?? '',
  contactEmail: row.contact_email,
  isActive: row.is_active ?? true,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
});

// Helper: Map camelCase fields to snake_case for Supabase
const mapCompanyToRow = (data: Partial<CompanyProfile>): Record<string, any> => {
  const mapping: Record<string, string> = {
    name: 'name',
    displayName: 'display_name',
    description: 'description',
    website: 'website',
    logo: 'logo',
    industry: 'industry',
    size: 'size',
    location: 'location',
    founded: 'founded',
    specialties: 'specialties',
    benefits: 'benefits',
    culture: 'culture',
    xmlFeedPath: 'xml_feed_path',
    contactEmail: 'contact_email',
    isActive: 'is_active',
  };

  const row: Record<string, any> = {};
  for (const [camelKey, value] of Object.entries(data)) {
    const snakeKey = mapping[camelKey];
    if (snakeKey) {
      row[snakeKey] = value;
    }
  }
  return row;
};

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('companies')
        .select('*')
        .limit(200);

      if (fetchError) {
        console.error('Error fetching companies:', fetchError);
        setError('Failed to load company profiles');
        return;
      }

      setCompanies((data || []).map(mapRowToCompany));
      setError(null);
    } catch (err) {
      console.error('Error loading company profiles:', err);
      setError('Failed to load company profiles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const getCompanyByName = (name: string) => {
    return companies.find(company =>
      company.name.toLowerCase() === name.toLowerCase() ||
      company.displayName.toLowerCase() === name.toLowerCase()
    );
  };

  const getCompanyById = (id: string) => {
    return companies.find(company => company.id === id);
  };

  const addCompany = async (companyData: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const row = mapCompanyToRow(companyData);
      const { data, error: insertError } = await supabase
        .from('companies')
        .insert(row)
        .select()
        .single();

      if (insertError) {
        console.error('Error adding company:', insertError);
        setError('Failed to add company');
        return;
      }

      const newCompany = mapRowToCompany(data);
      setCompanies(prev => [...prev, newCompany]);
    } catch (err) {
      console.error('Error adding company:', err);
      setError('Failed to add company');
    }
  };

  const updateCompany = async (id: string, updates: Partial<CompanyProfile>) => {
    try {
      const row = mapCompanyToRow(updates);
      const { error: updateError } = await supabase
        .from('companies')
        .update(row)
        .eq('id', id);

      if (updateError) {
        console.error('Error updating company:', updateError);
        setError('Failed to update company');
        return;
      }

      setCompanies(prev =>
        prev.map(company =>
          company.id === id
            ? { ...company, ...updates, updatedAt: new Date() }
            : company
        )
      );
    } catch (err) {
      console.error('Error updating company:', err);
      setError('Failed to update company');
    }
  };

  const deleteCompany = async (id: string) => {
    try {
      const { error: deleteError } = await supabase
        .from('companies')
        .update({ is_active: false })
        .eq('id', id);

      if (deleteError) {
        console.error('Error deleting company:', deleteError);
        setError('Failed to delete company');
        return;
      }

      setCompanies(prev =>
        prev.map(company =>
          company.id === id
            ? { ...company, isActive: false, updatedAt: new Date() }
            : company
        )
      );
    } catch (err) {
      console.error('Error deleting company:', err);
      setError('Failed to delete company');
    }
  };

  const value: CompanyContextType = {
    companies,
    loading,
    error,
    getCompanyByName,
    getCompanyById,
    addCompany,
    updateCompany,
    deleteCompany
  };

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
};
