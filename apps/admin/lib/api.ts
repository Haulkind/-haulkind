// Admin API client
const API_BASE_URL = 'https://haulkind-api-production-b00f.up.railway.app';

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
