import React, { useState } from 'react';
import { useJobs } from '../contexts/JobContext';
import { Building2, Plus, Trash2, Edit3, Save, X } from 'lucide-react';

interface CompanySource {
  id: string;
  name: string;
  xmlPath: string;
  contactEmail?: string;
  apiEndpoint?: string;
  isActive: boolean;
  lastSync?: Date;
  jobCount: number;
}

const CompanySourceManager: React.FC = () => {
  const { jobs } = useJobs();

  // Calculate job counts dynamically from actual job data
  const calculateJobCount = (xmlPath: string): number => {
    return jobs.filter(job => job.sourceXmlFile === xmlPath).length;
  };

  const [sources, setSources] = useState<CompanySource[]>(() => {
    const initialSources = [
      {
        id: '1',
        name: 'Hire Quadrant',
        xmlPath: '/data/listofportaljobs.xml',
        contactEmail: 'admin@hirequadrant.com',
        isActive: true,
        lastSync: new Date(),
        jobCount: 0
      },
      {
        id: '2',
        name: 'Hire Quadrant - External Feed',
        xmlPath: '/data/getportaljobs.xml',
        contactEmail: 'admin@hirequadrant.com',
        isActive: true,
        lastSync: new Date(),
        jobCount: 0
      },
      {
        id: '3',
        name: 'Hire Quadrant - Copy Feed',
        xmlPath: '/data/getportaljobs copy.xml',
        contactEmail: 'admin@hirequadrant.com',
        isActive: true,
        lastSync: new Date(),
        jobCount: 0
      }
    ];

    // Update job counts with actual data
    return initialSources.map(source => ({
      ...source,
      jobCount: calculateJobCount(source.xmlPath)
    }));
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSource, setNewSource] = useState<Partial<CompanySource>>({
    name: '',
    xmlPath: '',
    contactEmail: '',
    apiEndpoint: '',
    isActive: true
  });

  const handleAddSource = () => {
    if (!newSource.name || !newSource.xmlPath) return;

    const source: CompanySource = {
      id: Date.now().toString(),
      name: newSource.name,
      xmlPath: newSource.xmlPath,
      contactEmail: newSource.contactEmail,
      apiEndpoint: newSource.apiEndpoint,
      isActive: newSource.isActive || true,
      jobCount: calculateJobCount(newSource.xmlPath || '')
    };

    setSources([...sources, source]);
    setNewSource({
      name: '',
      xmlPath: '',
      contactEmail: '',
      apiEndpoint: '',
      isActive: true
    });
  };

  const handleDeleteSource = (id: string) => {
    setSources(sources.filter(s => s.id !== id));
  };

  const handleToggleActive = (id: string) => {
    setSources(sources.map(s => 
      s.id === id ? { ...s, isActive: !s.isActive } : s
    ));
  };

  const handleUpdateSource = (id: string, updates: Partial<CompanySource>) => {
    setSources(sources.map(s => 
      s.id === id ? { 
        ...s, 
        ...updates,
        jobCount: updates.xmlPath ? calculateJobCount(updates.xmlPath) : s.jobCount,
        lastSync: new Date()
      } : s
    ));
    setEditingId(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Source Manager</h1>
        <p className="text-gray-600">Manage XML feeds from partner companies</p>
      </div>

      {/* Add New Source */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Company Source</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Company Name"
            value={newSource.name || ''}
            onChange={(e) => setNewSource({ ...newSource, name: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <input
            type="text"
            placeholder="XML File Path (e.g., /data/company-jobs.xml)"
            value={newSource.xmlPath || ''}
            onChange={(e) => setNewSource({ ...newSource, xmlPath: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <input
            type="email"
            placeholder="Contact Email"
            value={newSource.contactEmail || ''}
            onChange={(e) => setNewSource({ ...newSource, contactEmail: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
          <input
            type="url"
            placeholder="API Endpoint (optional)"
            value={newSource.apiEndpoint || ''}
            onChange={(e) => setNewSource({ ...newSource, apiEndpoint: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
          />
        </div>
        
        <button
          onClick={handleAddSource}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </button>
      </div>

      {/* Sources List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Company Sources</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    XML Path
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sources.map((source) => (
                  <tr key={source.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 bg-primary-100 rounded-lg mr-3">
                          <Building2 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{source.name}</div>
                          {source.lastSync && (
                            <div className="text-xs text-gray-500">
                              Last sync: {source.lastSync.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                        {source.xmlPath}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {source.contactEmail}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {calculateJobCount(source.xmlPath)} jobs
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleActive(source.id)}
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          source.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {source.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingId(source.id)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSource(source.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Setup Instructions</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p><strong>1. XML File Format:</strong> Ensure partner companies provide XML files in the standard job format.</p>
          <p><strong>2. File Placement:</strong> Upload XML files to the <code className="bg-blue-100 px-1 rounded">public/data/</code> directory.</p>
          <p><strong>3. Attribution:</strong> Jobs will automatically show "via [Company Name]" to credit the source.</p>
          <p><strong>4. Applications:</strong> When candidates apply, their information is tracked with the source company for proper attribution.</p>
        </div>
      </div>
    </div>
  );
};

export default CompanySourceManager;