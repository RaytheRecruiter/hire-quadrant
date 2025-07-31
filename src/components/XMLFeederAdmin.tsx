import React, { useState } from 'react';
import { useJobs } from '../contexts/JobContext';
import { XMLJobFeeder, xmlFeederUtils } from '../utils/xmlGenerator';
import { Job } from '../contexts/JobContext';
import { Download, Plus, Trash2, FileText, Copy, Save } from 'lucide-react';

const XMLFeederAdmin: React.FC = () => {
  const { jobs } = useJobs();
  const [feeder] = useState(() => new XMLJobFeeder());
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
  const [xmlPreview, setXmlPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    title: '',
    company: '',
    location: '',
    type: 'full-time',
    salary: '',
    description: '',
    requirements: [''],
    benefits: ['']
  });

  const handleJobSelection = (jobId: string, selected: boolean) => {
    if (selected) {
      setSelectedJobs([...selectedJobs, jobId]);
    } else {
      setSelectedJobs(selectedJobs.filter(id => id !== jobId));
    }
  };

  const handleSelectAll = () => {
    if (selectedJobs.length === jobs.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs.map(job => job.id));
    }
  };

  const generateXMLFromSelected = () => {
    const selectedJobData = jobs.filter(job => selectedJobs.includes(job.id));
    const xml = xmlFeederUtils.generateXMLFromJobs(selectedJobData);
    setXmlPreview(xml);
    setShowPreview(true);
  };

  const generateXMLFromAll = () => {
    const xml = xmlFeederUtils.generateXMLFromJobs(jobs);
    setXmlPreview(xml);
    setShowPreview(true);
  };

  const generateSampleXML = () => {
    const sampleFeeder = xmlFeederUtils.withSampleData();
    const xml = sampleFeeder.generateXML();
    setXmlPreview(xml);
    setShowPreview(true);
  };

  const downloadXML = (filename: string = 'jobs.xml') => {
    if (!xmlPreview) return;
    
    const blob = new Blob([xmlPreview], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!xmlPreview) return;
    
    try {
      await navigator.clipboard.writeText(xmlPreview);
      alert('XML copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy XML:', err);
      alert('Failed to copy XML to clipboard');
    }
  };

  const saveToLocalStorage = () => {
    if (!xmlPreview) return;
    
    localStorage.setItem('generated-jobs-xml', xmlPreview);
    alert('XML saved to localStorage!');
  };

  const updateNewJobField = (field: keyof Job, value: any) => {
    setNewJob(prev => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field: 'requirements' | 'benefits', index: number, value: string) => {
    const currentArray = newJob[field] || [''];
    const updatedArray = [...currentArray];
    updatedArray[index] = value;
    setNewJob(prev => ({ ...prev, [field]: updatedArray }));
  };

  const addArrayItem = (field: 'requirements' | 'benefits') => {
    const currentArray = newJob[field] || [''];
    setNewJob(prev => ({ ...prev, [field]: [...currentArray, ''] }));
  };

  const removeArrayItem = (field: 'requirements' | 'benefits', index: number) => {
    const currentArray = newJob[field] || [''];
    const updatedArray = currentArray.filter((_, i) => i !== index);
    setNewJob(prev => ({ ...prev, [field]: updatedArray }));
  };

  const addCustomJob = () => {
    if (!newJob.title || !newJob.company || !newJob.location) {
      alert('Please fill in at least title, company, and location');
      return;
    }

    const job: Job = {
      id: `custom-${Date.now()}`,
      title: newJob.title || '',
      company: newJob.company || '',
      location: newJob.location || '',
      type: newJob.type as Job['type'] || 'full-time',
      salary: newJob.salary || '',
      description: newJob.description || '',
      requirements: (newJob.requirements || ['']).filter(req => req.trim() !== ''),
      benefits: (newJob.benefits || ['']).filter(benefit => benefit.trim() !== ''),
      postedDate: new Date(),
      applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      views: 0,
      applications: 0
    };

    feeder.addJob(job);
    const xml = feeder.generateXML();
    setXmlPreview(xml);
    setShowPreview(true);

    // Reset form
    setNewJob({
      title: '',
      company: '',
      location: '',
      type: 'full-time',
      salary: '',
      description: '',
      requirements: [''],
      benefits: ['']
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">XML Job Feeder</h1>
        <p className="text-gray-600">Generate XML files from job data for external systems</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Controls */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={generateXMLFromAll}
                className="w-full flex items-center justify-center px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
              >
                <FileText className="h-5 w-5 mr-2" />
                Generate XML from All Jobs ({jobs.length})
              </button>
              
              <button
                onClick={generateSampleXML}
                className="w-full flex items-center justify-center px-4 py-3 bg-secondary-500 text-white rounded-lg hover:bg-secondary-600 transition-colors duration-300"
              >
                <Plus className="h-5 w-5 mr-2" />
                Generate Sample XML
              </button>
            </div>
          </div>

          {/* Job Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Select Jobs</h2>
              <button
                onClick={handleSelectAll}
                className="text-primary-500 hover:text-primary-600 font-medium"
              >
                {selectedJobs.length === jobs.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
            
            <div className="max-h-64 overflow-y-auto space-y-2">
              {jobs.map((job) => (
                <label key={job.id} className="flex items-center p-2 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedJobs.includes(job.id)}
                    onChange={(e) => handleJobSelection(job.id, e.target.checked)}
                    className="mr-3 h-4 w-4 text-primary-500 focus:ring-primary-400 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{job.title}</div>
                    <div className="text-sm text-gray-500">{job.company} - {job.location}</div>
                  </div>
                </label>
              ))}
            </div>
            
            {selectedJobs.length > 0 && (
              <button
                onClick={generateXMLFromSelected}
                className="w-full mt-4 flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
              >
                <FileText className="h-4 w-4 mr-2" />
                Generate XML from Selected ({selectedJobs.length})
              </button>
            )}
          </div>

          {/* Add Custom Job */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add Custom Job</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Job Title"
                  value={newJob.title || ''}
                  onChange={(e) => updateNewJobField('title', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                />
                <input
                  type="text"
                  placeholder="Company"
                  value={newJob.company || ''}
                  onChange={(e) => updateNewJobField('company', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Location"
                  value={newJob.location || ''}
                  onChange={(e) => updateNewJobField('location', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                />
                <select
                  value={newJob.type || 'full-time'}
                  onChange={(e) => updateNewJobField('type', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
              
              <input
                type="text"
                placeholder="Salary Range"
                value={newJob.salary || ''}
                onChange={(e) => updateNewJobField('salary', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
              
              <textarea
                placeholder="Job Description"
                value={newJob.description || ''}
                onChange={(e) => updateNewJobField('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
              />
              
              {/* Requirements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Requirements</label>
                {(newJob.requirements || ['']).map((req, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      placeholder="Requirement"
                      value={req}
                      onChange={(e) => updateArrayField('requirements', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    />
                    <button
                      onClick={() => removeArrayItem('requirements', index)}
                      className="ml-2 p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('requirements')}
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                >
                  + Add Requirement
                </button>
              </div>
              
              {/* Benefits */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Benefits</label>
                {(newJob.benefits || ['']).map((benefit, index) => (
                  <div key={index} className="flex items-center mb-2">
                    <input
                      type="text"
                      placeholder="Benefit"
                      value={benefit}
                      onChange={(e) => updateArrayField('benefits', index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-400 focus:border-primary-400"
                    />
                    <button
                      onClick={() => removeArrayItem('benefits', index)}
                      className="ml-2 p-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addArrayItem('benefits')}
                  className="text-primary-500 hover:text-primary-600 text-sm font-medium"
                >
                  + Add Benefit
                </button>
              </div>
              
              <button
                onClick={addCustomJob}
                className="w-full flex items-center justify-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Job & Generate XML
              </button>
            </div>
          </div>
        </div>

        {/* Right Column - XML Preview */}
        <div className="space-y-6">
          {showPreview && xmlPreview && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">XML Preview</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-300"
                  >
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </button>
                  <button
                    onClick={saveToLocalStorage}
                    className="flex items-center px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300"
                  >
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </button>
                  <button
                    onClick={() => downloadXML('jobs.xml')}
                    className="flex items-center px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-300"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-auto">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-mono">
                  {xmlPreview}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default XMLFeederAdmin;