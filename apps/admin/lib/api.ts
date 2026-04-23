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
  driver_name: string | null;
  driver_display_name: string | null;
  driver_phone: string | null;
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

export type AdminRole = 'admin' | 'guest';

// HTTP methods that do not mutate server state. Anything else is blocked on
// the client when the current user has role === 'guest' (and will also be
// rejected by the backend — client-side blocking is just a UX nicety).
const READ_ONLY_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

class ApiClient {
  private token: string | null = null;
  private role: AdminRole | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('admin_token');
      const cachedRole = localStorage.getItem('admin_role');
      if (cachedRole === 'admin' || cachedRole === 'guest') {
        this.role = cachedRole;
      }
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
    this.role = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
    }
  }

  setRole(role: AdminRole | null) {
    this.role = role;
    if (typeof window !== 'undefined') {
      if (role) localStorage.setItem('admin_role', role);
      else localStorage.removeItem('admin_role');
    }
  }

  getRole(): AdminRole | null {
    return this.role;
  }

  isGuest(): boolean {
    return this.role === 'guest';
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const method = (options.method || 'GET').toUpperCase();

    // Client-side guard: refuse write calls if we already know this user is a
    // read-only guest. This gives an instant, friendly error instead of a
    // round-trip to the server (which would also reject with 403).
    if (this.role === 'guest' && !READ_ONLY_METHODS.has(method)) {
      throw new Error('Read-only access: your account cannot modify data');
    }

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
  async login(email: string, password: string, totp_code?: string) {
    const body: any = { email, password };
    if (totp_code) body.totp_code = totp_code;
    const data = await this.request('/admin/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    if (data.token) {
      this.setToken(data.token);
    }
    if (data?.admin?.role === 'admin' || data?.admin?.role === 'guest') {
      this.setRole(data.admin.role);
    }
    return data;
  }

  async getMe() {
    const data = await this.request('/admin/auth/me');
    if (data?.admin?.role === 'admin' || data?.admin?.role === 'guest') {
      this.setRole(data.admin.role);
    }
    return data;
  }

  // Guest (read-only auditor) account management — admin-only on the backend.
  async listGuests(): Promise<{ guests: Array<{ id: number; email: string; name: string | null; created_at: string }> }> {
    return this.request('/admin/users/guests');
  }

  async createOrResetGuest(email: string, name?: string): Promise<{
    success: boolean;
    action: 'created' | 'reset';
    guest: { id: number; email: string; name: string; role: 'guest' };
    temporary_password: string;
  }> {
    return this.request('/admin/users/guest', {
      method: 'POST',
      body: JSON.stringify({ email, name }),
    });
  }

  async deleteGuest(id: number): Promise<{ success: boolean }> {
    return this.request(`/admin/users/guest/${id}`, { method: 'DELETE' });
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

  async editDriver(id: string, data: { name?: string; email?: string; phone?: string; vehicle_type?: string }): Promise<{ driver: Driver }> {
    return this.request(`/admin/drivers/${id}/edit`, {
      method: 'PUT',
      body: JSON.stringify(data),
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

  async getOrderMedia(id: string): Promise<{
    completion_photos: string | null;
    before_photos: string | null;
    after_photos: string | null;
    signature_data: string | null;
    photo_urls: string | null;
  }> {
    return this.request(`/admin/orders/${id}/media`);
  }

  async rescheduleOrder(id: string, pickup_date: string, pickup_time_window?: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}/reschedule`, {
      method: 'PUT',
      body: JSON.stringify({ pickup_date, pickup_time_window }),
    });
  }

  async createOrder(data: {
    customer_name: string;
    customer_phone: string;
    customer_email?: string;
    service_type?: string;
    pickup_address?: string;
    description?: string;
    estimated_price?: string;
    scheduled_for?: string;
    pickup_time_window?: string;
    photo_urls?: string;
    signature_data?: string;
    assign_driver_id?: string;
    mark_completed?: boolean;
    mark_paid?: boolean;
  }): Promise<{ order: Order }> {
    return this.request('/admin/orders/create', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completeAndPayOrder(id: string, price_total: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}/complete-paid`, {
      method: 'PUT',
      body: JSON.stringify({ price_total }),
    });
  }

  async deleteOrder(id: string): Promise<{ success: boolean; deleted_id: string }> {
    return this.request(`/admin/orders/${id}`, {
      method: 'DELETE',
    });
  }

  async reactivateOrder(id: string): Promise<{ order: Order }> {
    return this.request(`/admin/orders/${id}/reactivate`, {
      method: 'PUT',
    });
  }

  async getDriverLocations(): Promise<{ drivers: Array<{
    id: string;
    name: string;
    display_name: string;
    phone: string;
    email: string;
    status: string;
    driver_status: string;
    is_online: boolean;
    vehicle_type: string;
    lat: number | null;
    lng: number | null;
    heading: number | null;
    speed: number | null;
    location_updated_at: string | null;
  }> }> {
    return this.request('/admin/drivers/locations');
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

  // Leads
  async getLeads(params?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ leads: any[]; total: number; limit: number; offset: number }> {
    const query = new URLSearchParams(params as any).toString();
    return this.request(`/admin/leads${query ? `?${query}` : ''}`);
  }

  async updateLeadStatus(id: string, status: string, notes?: string): Promise<{ lead: any }> {
    return this.request(`/admin/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status, notes }),
    });
  }

  async deleteLead(id: string): Promise<{ success: boolean; deleted_id: string }> {
    return this.request(`/admin/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // Security
  async changePassword(
    current_password: string,
    new_password: string,
    totp_code?: string,
  ): Promise<{ success: boolean; message: string }> {
    return this.request('/admin/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ current_password, new_password, totp_code }),
    });
  }

  async setup2FA(): Promise<{ secret: string; qr_code: string; otpauth_url: string }> {
    return this.request('/admin/auth/2fa/setup', {
      method: 'POST',
    });
  }

  async verify2FA(totp_code: string): Promise<{ success: boolean; message: string }> {
    return this.request('/admin/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ totp_code }),
    });
  }

  async disable2FA(password: string): Promise<{ success: boolean; message: string }> {
    return this.request('/admin/auth/2fa/disable', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  }
}

export const api = new ApiClient();
