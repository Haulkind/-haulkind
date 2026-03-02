// Admin API client - MUST point to the official backend (285b)
// IMPORTANT: Do NOT override this with NEXT_PUBLIC_API_URL env var pointing to a different backend.
// The official backend is 285b which has the correct PostgreSQL database with all orders/jobs.
const OFFICIAL_BACKEND = 'https://haulkind-production-285b.up.railway.app';
const API_BASE_URL = OFFICIAL_BACKEND;

// Runtime logging to help debug API URL issues
if (typeof window !== 'undefined') {
  console.log('[Admin API] Using backend:', API_BASE_URL);
}

export interface Driver {
  id: string; // UUID
  name: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'blocked';
  driver_status?: 'pending_review' | 'approved' | 'rejected' | 'suspended';
  is_active?: boolean;
  selfie_url?: string | null;
  license_url?: string | null;
  vehicle_registration_url?: string | null;
  insurance_url?: string | null;
  rejection_reason?: string | null;
  suspension_reason?: string | null;
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
  status: 'pending' | 'dispatching' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';
  assigned_driver_id: string | null;
  created_at: string;
  updated_at: string;
  // Boolean flags from list query (lightweight)
  has_completion_photos: boolean | null;
  has_signature: boolean | null;
  has_photo_urls: boolean | null;
  // Full data from detail query (on-demand)
  completion_photos?: string | null;
  signature_data?: string | null;
  photo_urls?: string | null;
  // Payment/Stripe columns
  paid_at: string | null;
  stripe_payment_intent_id: string | null;
  price_total_cents: number | null;
  platform_fee_cents: number | null;
  driver_earnings_cents: number | null;
  payout_status: string | null;
}

export interface CashFlow {
  paid: { count: number; totalCents: number };
  platformFees: { totalCents: number };
  driverEarnings: { totalCents: number };
  unpaid: { count: number; totalEstimated: number };
  today: { count: number; totalCents: number };
  thisWeek: { count: number; totalCents: number };
  thisMonth: { count: number; totalCents: number };
  refunded: { count: number; totalCents: number };
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

  async approveDriver(id: string): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}/approve`, {
      method: 'POST',
    });
  }

  async rejectDriver(id: string, reason: string): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async suspendDriver(id: string, reason: string): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}/suspend`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async activateDriver(id: string): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}/activate`, {
      method: 'POST',
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

  async cancelOrder(id: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}/cancel`, {
      method: 'PUT',
    });
  }

  async getOrderMedia(id: string): Promise<{ completion_photos: string | null; signature_data: string | null; photo_urls: string | null }> {
    return this.request(`/admin/orders/${id}/media`);
  }

  async rescheduleOrder(id: string, pickup_date: string, pickup_time_window?: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ pickup_date, pickup_time_window }),
    });
  }

  // Payouts
  async getPayouts(params?: { status?: string; limit?: number; offset?: number }): Promise<{ payouts: any[]; total: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/admin/payouts${query ? `?${query}` : ''}`);
  }

  async getPayoutDetail(id: string): Promise<{ payout: any; items: any[]; jobs: any[] }> {
    return this.request(`/admin/payouts/${id}`);
  }

  async runWeeklyPayout(): Promise<any> {
    return this.request('/api/payouts/run-weekly', { method: 'POST' });
  }

  async retryPayoutItem(itemId: string): Promise<any> {
    return this.request(`/api/payouts/retry-item/${itemId}`, { method: 'POST' });
  }

  async getDriversStripeStatus(): Promise<{ drivers: any[]; summary: any }> {
    return this.request('/admin/stripe/drivers-status');
  }

  async getCashFlow(): Promise<CashFlow> {
    return this.request('/admin/cashflow');
  }
}

export const api = new ApiClient();
