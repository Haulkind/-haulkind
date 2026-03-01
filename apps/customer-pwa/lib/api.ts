const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://haulkind-production-285b.up.railway.app';

// ============================================================
// Auth
// ============================================================
export async function registerCustomer(data: { name: string; email: string; phone: string; password: string }) {
  const res = await fetch(`${API_URL}/customer/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function loginCustomer(data: { email: string; password: string }) {
  const res = await fetch(`${API_URL}/customer/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/customer/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function updateProfile(token: string, data: { name?: string; phone?: string }) {
  const res = await fetch(`${API_URL}/customer/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ============================================================
// Orders
// ============================================================
export async function getMyOrders(token: string, status?: 'active' | 'completed') {
  const qs = status ? `?status=${status}` : '';
  const res = await fetch(`${API_URL}/customer/orders${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

export async function getOrderDetail(token: string, orderId: string) {
  const res = await fetch(`${API_URL}/customer/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

// ============================================================
// Anonymous order tracking
// ============================================================
export async function trackOrder(data: { token?: string; orderId?: string }) {
  const res = await fetch(`${API_URL}/customer/orders/track`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

// ============================================================
// Quotes & Jobs (reusing existing endpoints)
// ============================================================
export async function getQuote(data: {
  serviceType: string;
  volumeTier?: string;
  addons?: string[];
  helperCount?: number;
  estimatedHours?: number;
}) {
  const res = await fetch(`${API_URL}/quotes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function createJob(data: {
  serviceType: string;
  serviceAreaId: number;
  pickupLat: number;
  pickupLng: number;
  pickupAddress: string;
  scheduledFor: string;
  volumeTier?: string;
  addons?: string[];
  helperCount?: number;
  estimatedHours?: number;
  customerNotes?: string;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  timeWindow?: string;
  total?: number;
}) {
  const res = await fetch(`${API_URL}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function payJob(jobId: string) {
  const res = await fetch(`${API_URL}/jobs/${jobId}/pay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  return res.json();
}

// Stripe Checkout — creates a Stripe Checkout Session and returns the URL
export async function createCheckoutSession(jobId: string, successUrl: string, cancelUrl: string) {
  const res = await fetch(`${API_URL}/api/checkout/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jobId, successUrl, cancelUrl }),
  });
  return res.json();
}

export async function lookupServiceArea(lat: number, lng: number) {
  const res = await fetch(`${API_URL}/service-areas/lookup?lat=${lat}&lng=${lng}`);
  return res.json();
}

// ============================================================
// Push Notifications
// ============================================================
export async function getVapidKey() {
  const res = await fetch(`${API_URL}/customer/push/vapid-key`);
  return res.json();
}

export async function subscribePush(subscription: PushSubscription, jobId?: string, token?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  
  const res = await fetch(`${API_URL}/customer/push/subscribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      jobId,
    }),
  });
  return res.json();
}
