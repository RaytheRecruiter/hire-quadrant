import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

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
  addCompany: (company: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompany: (id: string, updates: Partial<CompanyProfile>) => void;
  deleteCompany: (id: string) => void;
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

export const CompanyProvider: React.FC<CompanyProviderProps> = ({ children }) => {
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCompanies = () => {
      try {
        // Load companies from localStorage or initialize with defaults
        const storedCompanies = localStorage.getItem('company_profiles');
        
        if (storedCompanies) {
          const parsed = JSON.parse(storedCompanies);
          // Convert date strings back to Date objects
          const companiesWithDates = parsed.map((company: any) => ({
            ...company,
            createdAt: new Date(company.createdAt),
            updatedAt: new Date(company.updatedAt)
          }));
          setCompanies(companiesWithDates);
        } else {
          // Initialize with default company profiles for existing XML feeds
          const defaultCompanies: CompanyProfile[] = [
            {
              id: 'hire-quadrant',
              name: 'Hire Quadrant',
              displayName: 'Hire Quadrant',
              description: 'Hire Quadrant is a leading staffing and recruitment company specializing in connecting top talent with innovative companies across various industries. We focus on building long-term partnerships and providing personalized recruitment solutions.',
              website: 'https://hirequadrant.com',
              logo: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
              industry: 'Staffing & Recruiting',
              size: '50-200 employees',
              location: 'Washington, DC Metro Area',
              founded: '2015',
              specialties: [
                'Healthcare Staffing',
                'Technology Recruitment',
                'Project Management',
                'Clinical Services',
                'IT Consulting'
              ],
              benefits: [
                'Competitive compensation packages',
                'Comprehensive health benefits',
                'Professional development opportunities',
                'Flexible work arrangements',
                'Career advancement support'
              ],
              culture: 'We foster a collaborative environment where innovation thrives and every team member is valued. Our culture emphasizes work-life balance, continuous learning, and making a positive impact in the communities we serve.',
              xmlFeedPath: '/data/listofportaljobs.xml',
              contactEmail: 'careers@hirequadrant.com',
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];
          
          setCompanies(defaultCompanies);
          localStorage.setItem('company_profiles', JSON.stringify(defaultCompanies));
        }
      } catch (err) {
        console.error('Error loading company profiles:', err);
        setError('Failed to load company profiles');
      } finally {
        setLoading(false);
      }
    };

    loadCompanies();
  }, []);

  const saveCompanies = (updatedCompanies: CompanyProfile[]) => {
    try {
      localStorage.setItem('company_profiles', JSON.stringify(updatedCompanies));
      setCompanies(updatedCompanies);
    } catch (err) {
      console.error('Error saving company profiles:', err);
      setError('Failed to save company profiles');
    }
  };

  const getCompanyByName = (name: string) => {
    return companies.find(company => 
      company.name.toLowerCase() === name.toLowerCase() ||
      company.displayName.toLowerCase() === name.toLowerCase()
    );
  };

  const getCompanyById = (id: string) => {
    return companies.find(company => company.id === id);
  };

  const addCompany = (companyData: Omit<CompanyProfile, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newCompany: CompanyProfile = {
      ...companyData,
      id: `company-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedCompanies = [...companies, newCompany];
    saveCompanies(updatedCompanies);
  };

  const updateCompany = (id: string, updates: Partial<CompanyProfile>) => {
    const updatedCompanies = companies.map(company =>
      company.id === id
        ? { ...company, ...updates, updatedAt: new Date() }
        : company
    );
    saveCompanies(updatedCompanies);
  };

  const deleteCompany = (id: string) => {
    const updatedCompanies = companies.filter(company => company.id !== id);
    saveCompanies(updatedCompanies);
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