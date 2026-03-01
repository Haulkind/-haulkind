'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../lib/api';

interface Payout {
  id: string;
  period_start: string;
  period_end: string;
  scheduled_for: string;
  status: string;
  created_at: string;
  item_count: number;
  total_amount_cents: number;
  paid_count: number;
  failed_count: number;
}

interface PayoutItem {
  id: string;
  payout_id: string;
  driver_id: string;
  driver_name: string;
  driver_email: string;
  stripe_account_id: string;
  amount_cents: number;
  status: string;
  stripe_transfer_id: string | null;
  failure_reason: string | null;
  created_at: string;
}

interface DriverStripeInfo {
  id: string;
  name: string;
  email: string;
  stripe_account_id: string | null;
  stripe_onboarding_status: string;
  payouts_enabled: boolean;
}

export default function PayoutsPage() {
  const router = useRouter();
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');

  // Detail modal
  const [detailPayout, setDetailPayout] = useState<Payout | null>(null);
  const [detailItems, setDetailItems] = useState<PayoutItem[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Drivers Stripe tab
  const [activeTab, setActiveTab] = useState<'payouts' | 'drivers'>('payouts');
  const [driversStripe, setDriversStripe] = useState<DriverStripeInfo[]>([]);
  const [driversSummary, setDriversSummary] = useState<any>(null);
  const [driversLoading, setDriversLoading] = useState(false);

  const loadPayouts = useCallback(async () => {
    try {
      const data = await api.getPayouts();
      setPayouts(data.payouts || []);
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

  const loadDriversStripe = useCallback(async () => {
    setDriversLoading(true);
    try {
      const data = await api.getDriversStripeStatus();
      setDriversStripe(data.drivers || []);
      setDriversSummary(data.summary || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDriversLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  useEffect(() => {
    if (activeTab === 'drivers') {
      loadDriversStripe();
    }
  }, [activeTab, loadDriversStripe]);

  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const handleRunWeekly = async () => {
    if (!confirm('Run weekly payout now? This will transfer funds to all eligible drivers.')) return;
    setActionLoading(true);
    setActionError('');
    try {
      const result = await api.runWeeklyPayout();
      setActionSuccess(`Payout completed: ${result.totalPaid} paid, ${result.totalFailed} failed. Total: $${((result.totalAmountCents || 0) / 100).toFixed(2)}`);
      loadPayouts();
    } catch (err: any) {
      setActionError(err.message || 'Failed to run payout');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewDetail = async (payout: Payout) => {
    setDetailPayout(payout);
    setDetailLoading(true);
    try {
      const data = await api.getPayoutDetail(payout.id);
      setDetailItems(data.items || []);
    } catch (err: any) {
      setActionError('Failed to load payout details');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleRetryItem = async (itemId: string) => {
    if (!confirm('Retry this failed payout?')) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.retryPayoutItem(itemId);
      setActionSuccess('Payout item retried successfully');
      if (detailPayout) handleViewDetail(detailPayout);
      loadPayouts();
    } catch (err: any) {
      setActionError(err.message || 'Failed to retry payout');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      created: 'bg-gray-100 text-gray-800',
      processing: 'bg-blue-100 text-blue-800',
      paid: 'bg-green-100 text-green-800',
      partially_failed: 'bg-yellow-100 text-yellow-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      complete: 'bg-green-100 text-green-800',
      restricted: 'bg-red-100 text-red-800',
      not_started: 'bg-gray-100 text-gray-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading payouts...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payouts Management</h1>
          <p className="text-gray-600 mt-2">Manage driver payouts via Stripe Connect</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRunWeekly}
            disabled={actionLoading}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
          >
            {actionLoading ? 'Processing...' : 'Run Weekly Payout'}
          </button>
          <button
            onClick={loadPayouts}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{error}</div>
      )}
      {actionSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">{actionSuccess}</div>
      )}
      {actionError && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">{actionError}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('payouts')}
          className={`px-6 py-3 text-sm font-medium ${activeTab === 'payouts' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Payout Batches
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-6 py-3 text-sm font-medium ${activeTab === 'drivers' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Driver Stripe Status
        </button>
      </div>

      {/* Payouts Tab */}
      {activeTab === 'payouts' && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payout ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Drivers</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid / Failed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payouts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    No payouts yet. Click &quot;Run Weekly Payout&quot; to process eligible driver payments.
                  </td>
                </tr>
              ) : (
                payouts.map((payout) => (
                  <tr key={payout.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-900">{payout.id.substring(0, 8)}...</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payout.period_start).toLocaleDateString()} - {new Date(payout.period_end).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(payout.status)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{payout.item_count || 0}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCents(payout.total_amount_cents || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="text-green-600 font-medium">{payout.paid_count || 0}</span>
                      {' / '}
                      <span className="text-red-600 font-medium">{payout.failed_count || 0}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payout.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(payout)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Drivers Stripe Tab */}
      {activeTab === 'drivers' && (
        <div>
          {driversSummary && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{driversSummary.total}</div>
                <div className="text-sm text-gray-500">Total with Stripe</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{driversSummary.complete}</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">{driversSummary.pending}</div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="bg-white rounded-lg shadow p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{driversSummary.restricted}</div>
                <div className="text-sm text-gray-500">Restricted</div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {driversLoading ? (
              <div className="p-8 text-center text-gray-500">Loading driver Stripe status...</div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stripe Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Onboarding</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payouts</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {driversStripe.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No drivers with Stripe accounts yet.
                      </td>
                    </tr>
                  ) : (
                    driversStripe.map((driver) => (
                      <tr key={driver.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{driver.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{driver.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                          {driver.stripe_account_id ? driver.stripe_account_id.substring(0, 16) + '...' : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(driver.stripe_onboarding_status || 'not_started')}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {driver.payouts_enabled ? (
                            <span className="text-green-600 font-medium">Enabled</span>
                          ) : (
                            <span className="text-gray-400">Disabled</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Payout Detail Modal */}
      {detailPayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold">Payout Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {new Date(detailPayout.period_start).toLocaleDateString()} - {new Date(detailPayout.period_end).toLocaleDateString()}
                  {' '}{getStatusBadge(detailPayout.status)}
                </p>
              </div>
              <button onClick={() => setDetailPayout(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            </div>
            <div className="p-6">
              {detailLoading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transfer ID</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {detailItems.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 text-sm">
                          <div className="font-medium text-gray-900">{item.driver_name}</div>
                          <div className="text-gray-500 text-xs">{item.driver_email}</div>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{formatCents(item.amount_cents)}</td>
                        <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500">
                          {item.stripe_transfer_id ? item.stripe_transfer_id.substring(0, 16) + '...' : item.failure_reason || '-'}
                        </td>
                        <td className="px-4 py-3">
                          {item.status === 'failed' && (
                            <button
                              onClick={() => handleRetryItem(item.id)}
                              disabled={actionLoading}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium disabled:opacity-50"
                            >
                              Retry
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
