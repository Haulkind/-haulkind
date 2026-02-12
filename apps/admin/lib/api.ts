// Admin API client
// Use same origin when running on same domain (no CORS needed)
const API_BASE_URL = typeof window !== 'undefined' && window.location.origin.includes('railway.app') 
  ? window.location.origin 
  : (process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app');

export interface Driver {
  id: string; // UUID
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'blocked';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  user_id: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  total_orders: number;
}

export interface Order {
  id: string; // UUID
  service_type: 'HAUL_AWAY' | 'LABOR_ONLY';
  customer_name: string;
  phone: string;
  email: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string;
  lat: number | null;
  lng: number | null;
  pickup_date: string | null;
  pickup_time_window: string | null;
  items_json: any;
  pricing_json: any;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  assigned_driver_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Stats {
  drivers: {
    total: number;
    pending: number;
    approved: number;
    blocked: number;
  };
  customers: {
    total: number;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
    byStatus: Record<string, number>;
  };
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
    }
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
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
    const data = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/admin/auth/me');
  }

  // Stats
  async getStats(): Promise<Stats> {
    return this.request('/admin/stats/overview');
  }

  // Drivers
  async getDrivers(params?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ drivers: Driver[]; total: number; limit: number; offset: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/admin/drivers${query ? `?${query}` : ''}`);
  }

  async getDriver(id: string): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}`);
  }

  async updateDriverStatus(id: string, status: 'pending' | 'approved' | 'blocked'): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Customers
  async getCustomers(params?: { search?: string; limit?: number; offset?: number }): Promise<{ customers: Customer[]; total: number; limit: number; offset: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/admin/customers${query ? `?${query}` : ''}`);
  }

  async getCustomer(id: string): Promise<{ customer: Customer }> {
    return this.request(`/admin/customers/${id}`);
  }

  // Orders
  async getOrders(params?: { status?: string; service_type?: string; search?: string; limit?: number; offset?: number }): Promise<{ orders: Order[]; total: number; limit: number; offset: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/admin/orders${query ? `?${query}` : ''}`);
  }

  async getOrder(id: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}`);
  }

  async assignOrder(id: string, driver_id: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}/assign`, {
      method: 'PUT',
      body: JSON.stringify({ driver_id }),
    });
  }
}

export const api = new ApiClient();
