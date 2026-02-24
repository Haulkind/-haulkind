// Driver API client
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app';

export interface Job {
  id: string;
  service_type: 'HAUL_AWAY' | 'LABOR_ONLY';
  customer_name: string;
  phone: string;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string;
  pickup_date: string | null;
  pickup_time_window: string | null;
  items_json: any;
  pricing_json: any;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface Driver {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'blocked';
}

class DriverApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('driver_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('driver_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('driver_token');
    }
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(email: string, password: string) {
    const data = await this.request('/driver/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe(): Promise<{ driver: Driver }> {
    return this.request('/driver/auth/me');
  }

  // Jobs
  async getAvailableJobs(): Promise<{ jobs: Job[] }> {
    return this.request('/driver/jobs/available');
  }

  async getMyJobs(): Promise<{ jobs: Job[] }> {
    return this.request('/driver/jobs/my-jobs');
  }

  async acceptJob(jobId: string): Promise<{ job: Job }> {
    return this.request(`/driver/jobs/${jobId}/accept`, {
      method: 'POST',
    });
  }

  async startJob(jobId: string): Promise<{ job: Job }> {
    return this.request(`/driver/jobs/${jobId}/start`, {
      method: 'POST',
    });
  }

  async completeJob(jobId: string): Promise<{ job: Job }> {
    return this.request(`/driver/jobs/${jobId}/complete`, {
      method: 'POST',
    });
  }
}

export const driverApi = new DriverApiClient();
