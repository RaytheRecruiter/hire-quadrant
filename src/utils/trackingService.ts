/**
 * Supabase-based tracking service that works across devices and browser sessions
 * Uses Supabase database for persistent storage and BroadcastChannel for real-time updates
 */

import { supabase } from './supabaseClient';

interface LocalJobStats {
  views: number;
  applications: number;
  lastUpdated: Date;
}

interface TrackingData {
  jobs: Record<string, LocalJobStats>;
  globalStats: {
    totalViews: number;
    totalApplications: number;
    lastReset: Date;
  };
  sessionId: string;
  lastSync: Date;
}

type TrackingUpdateCallback = () => void;

export class TrackingService {
  private static readonly BROADCAST_CHANNEL = 'job_tracking_updates';
  private static readonly SYNC_INTERVAL = 2000; // 2 seconds for database sync
  
  private static data: TrackingData | undefined;
  private static updateCallbacks: TrackingUpdateCallback[] = [];
  private static broadcastChannel: BroadcastChannel | null = null;
  private static syncInterval: NodeJS.Timeout | null = null;
  private static sessionId: string = '';
  private static viewedJobIds: Set<string> = new Set(); // Track viewed jobs in current session
  private static initialized = false;

  /**
   * Initialize the tracking service
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;
    
    // Initialize sessionId
    if (!this.sessionId) {
      this.sessionId = this.generateSessionId();
    }
    
    this.initializeLocalData();
    await this.loadDataFromSupabase();
    this.setupBroadcastChannel();
    this.startSyncInterval();
    this.viewedJobIds.clear(); // Clear viewedJobIds on initialization to ensure fresh session tracking
    
    this.initialized = true;
    
    console.log('TrackingService initialized with session ID:', this.sessionId);
  }

  /**
   * Generates a unique session ID
   */
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Initialize local data structure
   */
  private static initializeLocalData(): void {
    this.data = {
      jobs: {},
      globalStats: {
        totalViews: 0,
        totalApplications: 0,
        lastReset: new Date()
      },
      sessionId: this.sessionId,
      lastSync: new Date()
    };
  }

  /**
   * Load tracking data from Supabase
   */
  private static async loadDataFromSupabase(): Promise<void> {
    if (!this.data) {
      console.error('TrackingService data not initialized');
      return;
    }
    
    if (!supabase) {
      console.warn('Supabase client not available, falling back to local storage');
      this.loadDataFromLocalStorage();
      return;
    }
    
    try {
      console.log('Loading tracking data from Supabase...');
      
      const { data: trackingData, error } = await supabase
        .from('job_tracking')
        .select('job_id, views, applications, last_updated');

      if (error) {
        console.error('Error loading tracking data from Supabase:', error);
        this.loadDataFromLocalStorage();
        return;
      }

      if (trackingData && trackingData.length > 0) {
        // Convert Supabase data to local format
        const jobs: Record<string, LocalJobStats> = {};
        let totalViews = 0;
        let totalApplications = 0;

        trackingData.forEach((row) => {
          jobs[row.job_id] = {
            views: row.views || 0,
            applications: row.applications || 0,
            lastUpdated: new Date(row.last_updated)
          };
          totalViews += row.views || 0;
          totalApplications += row.applications || 0;
        });

        this.data = {
          ...this.data,
          jobs,
          globalStats: {
            totalViews,
            totalApplications,
            lastReset: new Date()
          },
          lastSync: new Date()
        };

        console.log('Loaded tracking data from Supabase:', this.data);
        this.notifyCallbacks();
      } else {
        console.log('No tracking data found in Supabase, starting fresh');
      }
    } catch (error) {
      console.error('Error loading tracking data from Supabase:', error);
      this.loadDataFromLocalStorage();
    }
  }

  /**
   * Fallback: Load tracking data from localStorage
   */
  private static loadDataFromLocalStorage(): void {
    if (!this.data) {
      console.error('TrackingService data not initialized');
      return;
    }
    
    try {
      const stored = localStorage.getItem('job_tracking_data');
      if (stored) {
        const parsedData = JSON.parse(stored);
        
        if (parsedData.globalStats) {
          parsedData.globalStats.lastReset = new Date(parsedData.globalStats.lastReset);
        }
        if (parsedData.lastSync) {
          parsedData.lastSync = new Date(parsedData.lastSync);
        }
        
        Object.keys(parsedData.jobs || {}).forEach(jobId => {
          if (parsedData.jobs[jobId].lastUpdated) {
            parsedData.jobs[jobId].lastUpdated = new Date(parsedData.jobs[jobId].lastUpdated);
          }
        });

        this.data = {
          ...this.data,
          ...parsedData,
          sessionId: this.sessionId,
          lastSync: new Date()
        };

        console.log('Loaded tracking data from localStorage:', this.data);
        this.notifyCallbacks();
      }
    } catch (error) {
      console.error('Error loading tracking data from localStorage:', error);
    }
  }

  /**
   * Setup BroadcastChannel for cross-tab communication
   */
  private static setupBroadcastChannel(): void {
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel(this.BROADCAST_CHANNEL);
        
        this.broadcastChannel.addEventListener('message', (event) => {
          console.log('Received broadcast message:', event.data);
          this.handleBroadcastMessage(event.data);
        });
        
        console.log('BroadcastChannel setup successful');
      } catch (error) {
        console.warn('BroadcastChannel not supported:', error);
      }
    } else {
      console.warn('BroadcastChannel not available in this browser');
    }
  }

  /**
   * Handle broadcast messages from other tabs/windows
   */
  private static handleBroadcastMessage(message: any): void {
    if (message.type === 'tracking_update' && message.sessionId !== this.sessionId) {
      console.log('Received tracking update from another session, reloading data');
      this.loadDataFromSupabase();
    } else if (message.type === 'stats_reset' && message.sessionId !== this.sessionId) {
      console.log('Received stats reset from another session, reloading data');
      this.loadDataFromSupabase();
    }
  }

  /**
   * Broadcast update to other tabs/windows
   */
  private static broadcastUpdate(type: string = 'tracking_update'): void {
    if (this.broadcastChannel) {
      try {
        const message = {
          type,
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        };
        console.log('Broadcasting message:', message);
        this.broadcastChannel.postMessage(message);
      } catch (error) {
        console.warn('Error broadcasting update:', error);
      }
    }
  }

  /**
   * Start periodic sync interval for database synchronization
   */
  private static startSyncInterval(): void {
    this.syncInterval = setInterval(() => {
      this.syncWithSupabase();
    }, this.SYNC_INTERVAL);
  }

  /**
   * Sync with Supabase database
   */
  private static async syncWithSupabase(): Promise<void> {
    if (!supabase || !this.data) return;

    try {
      const { data: latestData, error } = await supabase
        .from('job_tracking')
        .select('job_id, views, applications, last_updated')
        .order('last_updated', { ascending: false })
        .limit(1);

      if (error) {
        console.error('Error syncing with Supabase:', error);
        return;
      }

      if (latestData && latestData.length > 0) {
        const latestUpdate = new Date(latestData[0].last_updated);
        if (latestUpdate > this.data.lastSync) {
          console.log('Newer data found in Supabase, reloading...');
          await this.loadDataFromSupabase();
        }
      }
    } catch (error) {
      console.error('Error syncing with Supabase:', error);
    }
  }

  /**
   * Add callback for tracking updates
   */
  static addUpdateCallback(callback: TrackingUpdateCallback): void {
    this.updateCallbacks.push(callback);
    console.log('Added update callback, total callbacks:', this.updateCallbacks.length);
  }

  /**
   * Remove callback for tracking updates
   */
  static removeUpdateCallback(callback: TrackingUpdateCallback): void {
    this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    console.log('Removed update callback, remaining callbacks:', this.updateCallbacks.length);
  }

  /**
   * Notify all callbacks of updates
   */
  private static notifyCallbacks(): void {
    console.log('Notifying callbacks of update, callback count:', this.updateCallbacks.length);
    this.updateCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('Error in tracking update callback:', error);
      }
    });
  }

  /**
   * Save tracking data to Supabase and broadcast update
   */
  private static async saveDataToSupabase(jobId: string, views: number, applications: number): Promise<void> {
    if (!supabase || !this.data) {
      console.warn('Supabase not available, falling back to localStorage');
      this.saveDataToLocalStorage();
      return;
    }

    try {
      const { error } = await supabase
        .from('job_tracking')
        .upsert({
          job_id: jobId,
          views: views,
          applications: applications,
          last_updated: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving tracking data to Supabase:', error);
        this.saveDataToLocalStorage();
        return;
      }

      this.data.lastSync = new Date();
      console.log(`Saved tracking data to Supabase for job ${jobId}: views=${views}, applications=${applications}`);
      
      this.broadcastUpdate();
      this.notifyCallbacks();
    } catch (error) {
      console.error('Error saving tracking data to Supabase:', error);
      this.saveDataToLocalStorage();
    }
  }

  /**
   * Fallback: Save tracking data to localStorage
   */
  private static saveDataToLocalStorage(): void {
    if (!this.data) {
      console.error('TrackingService data not initialized');
      return;
    }
    
    try {
      this.data.lastSync = new Date();
      const dataToSave = JSON.stringify(this.data);
      localStorage.setItem('job_tracking_data', dataToSave);
      console.log('Saved tracking data to localStorage:', this.data);
      this.broadcastUpdate();
      this.notifyCallbacks();
    } catch (error) {
      console.error('Error saving tracking data to localStorage:', error);
    }
  }

  /**
   * Get job statistics
   */
  static getJobStats(jobId: string): LocalJobStats {
    if (!this.data) {
      return { views: 0, applications: 0, lastUpdated: new Date() };
    }
    
    if (!this.data.jobs[jobId]) {
      this.data.jobs[jobId] = {
        views: 0,
        applications: 0,
        lastUpdated: new Date()
      };
    }
    return this.data.jobs[jobId];
  }

  /**
   * Get job views count
   */
  static getJobViews(jobId: string): number {
    return this.getJobStats(jobId).views;
  }

  /**
   * Get job applications count
   */
  static getJobApplications(jobId: string): number {
    return this.getJobStats(jobId).applications;
  }

  /**
   * Increment job views with Supabase sync
   */
  static async incrementJobViews(jobId: string): Promise<void> {
    try {
      if (this.viewedJobIds.has(jobId)) {
        console.log(`Job ${jobId} already viewed in this session. Skipping increment.`);
        return;
      }
      this.viewedJobIds.add(jobId);
      console.log(`Incrementing views for job ${jobId}`);
      
      let currentViews = 0;
      let currentApplications = 0;
      
      if (supabase) {
        try {
          const { data: jobData, error } = await supabase
            .from('job_tracking')
            .select('views, applications')
            .eq('job_id', jobId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching current job stats:', error);
          } else if (jobData) {
            currentViews = jobData.views || 0;
            currentApplications = jobData.applications || 0;
          }
        } catch (error) {
          console.error('Error fetching job stats from Supabase:', error);
        }
      } else {
        const localStats = this.getJobStats(jobId);
        currentViews = localStats.views;
        currentApplications = localStats.applications;
      }
      
      const newViews = currentViews + 1;

      this.data!.jobs[jobId] = {
        views: newViews,
        applications: currentApplications,
        lastUpdated: new Date()
      };
      
      this.data!.globalStats.totalViews += 1;

      console.log(`Updated views for job ${jobId} from ${currentViews} to ${newViews}`);

      await this.saveDataToSupabase(jobId, newViews, currentApplications);
    } catch (error) {
      console.error('Error incrementing job views:', error);
      this.viewedJobIds.delete(jobId);
    }
  }

  /**
   * Increment job applications with Supabase sync
   */
  static async incrementJobApplications(jobId: string): Promise<void> {
    try {
      console.log(`Incrementing applications for job ${jobId}`);
      
      let currentViews = 0;
      let currentApplications = 0;
      
      if (supabase) {
        try {
          const { data: jobData, error } = await supabase
            .from('job_tracking')
            .select('views, applications')
            .eq('job_id', jobId)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching current job stats:', error);
          } else if (jobData) {
            currentViews = jobData.views || 0;
            currentApplications = jobData.applications || 0;
          }
        } catch (error) {
          console.error('Error fetching job stats from Supabase:', error);
        }
      } else {
        const localStats = this.getJobStats(jobId);
        currentViews = localStats.views;
        currentApplications = localStats.applications;
      }
      
      const newApplications = currentApplications + 1;

      this.data!.jobs[jobId] = {
        views: currentViews,
        applications: newApplications,
        lastUpdated: new Date()
      };
      
      this.data!.globalStats.totalApplications += 1;

      console.log(`Updated applications for job ${jobId} from ${currentApplications} to ${newApplications}`);

      await this.saveDataToSupabase(jobId, currentViews, newApplications);
    } catch (error) {
      console.error('Error incrementing job applications:', error);
    }
  }

  /**
   * Get global statistics
   */
  static getGlobalStats() {
    if (!this.data) {
      return { totalViews: 0, totalApplications: 0, lastReset: new Date() };
    }
    return { ...this.data.globalStats };
  }

  /**
   * Get all job statistics
   */
  static getAllJobStats(): Record<string, LocalJobStats> {
    if (!this.data) {
      return {};
    }
    return { ...this.data.jobs };
  }

  /**
   * Reset all statistics with Supabase sync
   */
  static async resetAllStats(): Promise<void> {
    try {
      console.log('Resetting all job statistics...');
      
      if (!this.sessionId) {
        this.sessionId = this.generateSessionId();
      }

      if (supabase) {
        const { error } = await supabase
          .from('job_tracking')
          .delete()
          .neq('job_id', '');

        if (error) {
          console.error('Error resetting stats in Supabase:', error);
        } else {
          console.log('Successfully reset all stats in Supabase');
        }
      }

      this.viewedJobIds.clear();
      this.data = {
        jobs: {},
        globalStats: {
          totalViews: 0,
          totalApplications: 0,
          lastReset: new Date()
        },
        sessionId: this.sessionId,
        lastSync: new Date()
      };

      localStorage.removeItem('job_tracking_data');
      
      if (this.broadcastChannel) {
        this.broadcastChannel.postMessage({
          type: 'stats_reset',
          sessionId: this.sessionId,
          timestamp: new Date().toISOString()
        });
      }
      
      this.notifyCallbacks();
      console.log('All statistics reset successfully');
    } catch (error) {
      console.error('Error resetting all stats:', error);
    }
  }

  /**
   * Get statistics for multiple jobs
   */
  static getBulkJobStats(jobIds: string[]): Record<string, LocalJobStats> {
    const result: Record<string, LocalJobStats> = {};
    jobIds.forEach(jobId => {
      result[jobId] = this.getJobStats(jobId);
    });
    return result;
  }

  /**
   * Export tracking data for backup
   */
  static exportData(): string {
    if (!this.data) {
      return JSON.stringify({ jobs: {}, globalStats: { totalViews: 0, totalApplications: 0, lastReset: new Date() } });
    }
    return JSON.stringify(this.data, null, 2);
  }

  /**
   * Import tracking data from backup
   */
  static importData(jsonData: string): boolean {
    try {
      const imported = JSON.parse(jsonData);
      
      if (imported.jobs && imported.globalStats) {
        if (imported.globalStats.lastReset) {
          imported.globalStats.lastReset = new Date(imported.globalStats.lastReset);
        }
        if (imported.lastSync) {
          imported.lastSync = new Date(imported.lastSync);
        }
        
        Object.keys(imported.jobs || {}).forEach(jobId => {
          if (imported.jobs[jobId].lastUpdated) {
            imported.jobs[jobId].lastUpdated = new Date(imported.jobs[jobId].lastUpdated);
          }
        });

        this.data = {
          ...imported,
          sessionId: this.sessionId,
          lastSync: new Date()
        };
        
        this.saveDataToLocalStorage();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing tracking data:', error);
      return false;
    }
  }

  /**
   * Get tracking data summary
   */
  static getSummary() {
    if (!this.data) {
      return {
        jobCount: 0,
        totalViews: 0,
        totalApplications: 0,
        lastReset: new Date(),
        averageViewsPerJob: '0',
        averageApplicationsPerJob: '0',
        conversionRate: '0',
        sessionId: this.sessionId || 'not-initialized',
        lastSync: new Date()
      };
    }
    
    const jobCount = Object.keys(this.data.jobs).length;
    const totalViews = this.data.globalStats.totalViews;
    const totalApplications = this.data.globalStats.totalApplications;
    const lastReset = this.data.globalStats.lastReset;

    return {
      jobCount,
      totalViews,
      totalApplications,
      lastReset,
      averageViewsPerJob: jobCount > 0 ? (totalViews / jobCount).toFixed(1) : '0',
      averageApplicationsPerJob: jobCount > 0 ? (totalApplications / jobCount).toFixed(1) : '0',
      conversionRate: totalViews > 0 ? ((totalApplications / totalViews) * 100).toFixed(1) : '0',
      sessionId: this.sessionId,
      lastSync: this.data.lastSync
    };
  }

  /**
   * Force sync with Supabase
   */
  static forceSync(): void {
    this.syncWithSupabase();
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage({
        type: 'sync_request',
        sessionId: this.sessionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get active session info
   */
  static getSessionInfo() {
    const supabaseConnected = !!supabase;

    if (!this.data) {
      return {
        sessionId: this.sessionId || 'not-initialized',
        lastSync: new Date(),
        broadcastSupported: !!this.broadcastChannel,
        initialized: this.initialized,
        supabaseConnected,
      };
    }
    
    return {
      sessionId: this.sessionId,
      lastSync: this.data.lastSync,
      broadcastSupported: !!this.broadcastChannel,
      initialized: this.initialized,
      supabaseConnected,
    };
  }

  /**
   * Cleanup resources
   */
  static cleanup(): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.close();
      this.broadcastChannel = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    this.viewedJobIds.clear();
    this.updateCallbacks = [];
    this.initialized = false;
  }
}

// Ensure the service initializes
TrackingService.initialize();

// Cleanup on page unload to prevent memory leaks
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    TrackingService.cleanup();
  });
}