'use client'

const TOKEN_KEY = 'haulkind_customer_token';
const CUSTOMER_KEY = 'haulkind_customer';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(CUSTOMER_KEY);
}

export function getCustomer(): { id: string; name: string; email: string; phone?: string } | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(CUSTOMER_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function setCustomer(customer: { id: string; name: string; email: string; phone?: string }) {
  localStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout() {
  removeToken();
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
}
