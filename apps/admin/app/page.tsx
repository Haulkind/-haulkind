'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Stats } from '../lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
      setLastUpdated(new Date());
      setCountdown(30);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('token')) {
        router.push('/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadStats();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadStats]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>Auto-refresh: {countdown}s</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={loadStats}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Drivers Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Drivers</h3>
            <span className="text-2xl">🚗</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.drivers.total || 0}</p>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Pending:</span>
              <span className="font-medium text-yellow-600">{stats?.drivers.pending || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Approved:</span>
              <span className="font-medium text-green-600">{stats?.drivers.approved || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blocked:</span>
              <span className="font-medium text-red-600">{stats?.drivers.blocked || 0}</span>
            </div>
          </div>
        </div>

        {/* Customers Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Customers</h3>
            <span className="text-2xl">👥</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.customers.total || 0}</p>
        </div>

        {/* Orders Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Total Orders</h3>
            <span className="text-2xl">📦</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{stats?.orders.total || 0}</p>
          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Today:</span>
              <span className="font-medium">{stats?.orders.today || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Week:</span>
              <span className="font-medium">{stats?.orders.thisWeek || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">This Month:</span>
              <span className="font-medium">{stats?.orders.thisMonth || 0}</span>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-gray-600 text-sm font-medium">Order Status</h3>
            <span className="text-2xl">📊</span>
          </div>
          <div className="space-y-2 text-sm">
            {stats?.orders.byStatus && Object.entries(stats.orders.byStatus).map(([status, count]) => (
              <div key={status} className="flex justify-between">
                <span className="text-gray-600 capitalize">{status}:</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push('/drivers')}
            className="flex items-center justify-center gap-2 bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700"
          >
            <span>🚗</span>
            <span>Manage Drivers</span>
          </button>
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700"
          >
            <span>📦</span>
            <span>View Orders</span>
          </button>
          <button
            onClick={() => router.push('/customers')}
            className="flex items-center justify-center gap-2 bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700"
          >
            <span>👥</span>
            <span>View Customers</span>
          </button>
        </div>
      </div>
    </div>
  );
}
