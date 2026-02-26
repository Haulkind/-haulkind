'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order, Driver } from '../../lib/api';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [serviceTypeFilter, setServiceTypeFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);

  // Modal states
  const [cancelModalOrder, setCancelModalOrder] = useState<Order | null>(null);
  const [assignModalOrder, setAssignModalOrder] = useState<Order | null>(null);
  const [rescheduleModalOrder, setRescheduleModalOrder] = useState<Order | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadOrders= useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (serviceTypeFilter) params.service_type = serviceTypeFilter;
      if (searchQuery) params.search = searchQuery;
      
      const data = await api.getOrders(params);
      setOrders(data.orders);
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
  }, [statusFilter, serviceTypeFilter, searchQuery, router]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadOrders();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadOrders]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear success message after 3 seconds
  useEffect(() => {
    if (actionSuccess) {
      const timer = setTimeout(() => setActionSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess]);

  const getStatusBadge= (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      dispatching: 'bg-amber-100 text-amber-800',
      assigned: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      en_route: 'bg-indigo-100 text-indigo-800',
      arrived: 'bg-cyan-100 text-cyan-800',
      working: 'bg-orange-100 text-orange-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  const formatPrice = (pricingJson: any) => {
    try {
      if (typeof pricingJson === 'string') {
        pricingJson = JSON.parse(pricingJson);
      }
      return `$${pricingJson.total || 0}`;
    } catch {
      return 'N/A';
    }
  };

  // ---- CANCEL ORDER ----
  const handleCancelClick = (order: Order) => {
    setActionError('');
    setCancelModalOrder(order);
  };

  const confirmCancel = async () => {
    if (!cancelModalOrder) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.cancelOrder(cancelModalOrder.id);
      setActionSuccess(`Order ${cancelModalOrder.id.substring(0, 8)} cancelled successfully`);
      setCancelModalOrder(null);
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to cancel order');
    } finally {
      setActionLoading(false);
    }
  };

  // ---- ASSIGN DRIVER ----
  const handleAssignClick = async (order: Order) => {
    setActionError('');
    setSelectedDriverId('');
    setAssignModalOrder(order);
    try {
      const data = await api.getDrivers({ status: 'approved', limit: 100 });
      setDrivers(data.drivers);
    } catch (err: any) {
      setActionError('Failed to load drivers');
    }
  };

  const confirmAssign = async () => {
    if (!assignModalOrder || !selectedDriverId) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.assignOrder(assignModalOrder.id, selectedDriverId);
      const driverName = drivers.find(d => d.id === selectedDriverId)?.name || selectedDriverId;
      setActionSuccess(`Order assigned to ${driverName}`);
      setAssignModalOrder(null);
      setSelectedDriverId('');
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to assign order');
    } finally {
      setActionLoading(false);
    }
  };

  // ---- RESCHEDULE ORDER ----
  const handleRescheduleClick = (order: Order) => {
    setActionError('');
    const existingDate = order.pickup_date || '';
    if (existingDate) {
      try {
        const d = new Date(existingDate);
        if (!isNaN(d.getTime())) {
          setRescheduleDate(d.toISOString().split('T')[0]);
          const hours = d.getHours().toString().padStart(2, '0');
          const mins = d.getMinutes().toString().padStart(2, '0');
          if (hours !== '00' || mins !== '00') {
            setRescheduleTime(`${hours}:${mins}`);
          } else {
            setRescheduleTime('');
          }
        } else {
          setRescheduleDate('');
          setRescheduleTime('');
        }
      } catch {
        setRescheduleDate('');
        setRescheduleTime('');
      }
    } else {
      setRescheduleDate('');
      setRescheduleTime('');
    }
    setRescheduleModalOrder(order);
  };

  const confirmReschedule = async () => {
    if (!rescheduleModalOrder || !rescheduleDate) return;
    setActionLoading(true);
    setActionError('');
    try {
      const dateTimeStr = rescheduleTime
        ? `${rescheduleDate}T${rescheduleTime}:00`
        : `${rescheduleDate}T00:00:00`;
      const timeWindow = rescheduleTime || undefined;
      await api.rescheduleOrder(rescheduleModalOrder.id, dateTimeStr, timeWindow);
      setActionSuccess(`Order rescheduled to ${rescheduleDate}${rescheduleTime ? ' at ' + rescheduleTime : ''}`);
      setRescheduleModalOrder(null);
      setRescheduleDate('');
      setRescheduleTime('');
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to reschedule order');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-2">View and manage customer orders</p>
        </div>
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
            onClick={loadOrders}
            className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            Refresh Now
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {actionSuccess && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {actionSuccess}
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer name, email, phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="dispatching">Dispatching</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service Type</label>
            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Types</option>
              <option value="HAUL_AWAY">Haul Away</option>
              <option value="LABOR_ONLY">Labor Only</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{orders.length} order{orders.length !== 1 ? 's' : ''} found</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-mono text-gray-900">{String(order.id).substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customer_name}</div>
                    <div className="text-sm text-gray-500">{order.phone || order.email || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(order.service_type || '').replace(/_/g, ' ')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.street || (order.city ? `${order.city}, ${order.state || ''}` : 'N/A')}</div>
                    <div className="text-sm text-gray-500">{order.zip || ''}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPrice(order.pricing_json)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.pickup_date ? new Date(order.pickup_date).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {order.pickup_time_window === 'ALL_DAY' ? 'All Day (8AM-8PM)' :
                       order.pickup_time_window === 'MORNING' ? 'Morning (8AM-12PM)' :
                       order.pickup_time_window === 'AFTERNOON' ? 'Afternoon (12PM-4PM)' :
                       order.pickup_time_window === 'EVENING' ? 'Evening (4PM-8PM)' :
                       order.pickup_time_window || ''}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.status !== 'cancelled' && order.status !== 'completed' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleAssignClick(order)}
                          className="px-2 py-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded hover:bg-blue-100"
                          title="Assign to a driver"
                        >
                          Assign
                        </button>
                        <button
                          onClick={() => handleRescheduleClick(order)}
                          className="px-2 py-1 text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded hover:bg-amber-100"
                          title="Change date/time"
                        >
                          Reschedule
                        </button>
                        <button
                          onClick={() => handleCancelClick(order)}
                          className="px-2 py-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100"
                          title="Cancel this order"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CANCEL MODAL */}
      {cancelModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Order</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to cancel order <strong>{cancelModalOrder.id.substring(0, 8)}...</strong> for <strong>{cancelModalOrder.customer_name}</strong>?
            </p>
            <p className="text-sm text-red-600 mb-4">
              This will remove the order from all drivers immediately.
            </p>
            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {actionError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setCancelModalOrder(null); setActionError(''); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={actionLoading}
              >
                No, Keep Order
              </button>
              <button
                onClick={confirmCancel}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={actionLoading}
              >
                {actionLoading ? 'Cancelling...' : 'Yes, Cancel Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN DRIVER MODAL */}
      {assignModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Assign Driver</h3>
            <p className="text-gray-600 mb-4">
              Assign order <strong>{assignModalOrder.id.substring(0, 8)}...</strong> ({assignModalOrder.customer_name}) to a driver.
            </p>
            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {actionError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Driver</label>
              {drivers.length === 0 ? (
                <p className="text-sm text-gray-500">Loading drivers...</p>
              ) : (
                <select
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select a driver --</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name || `${driver.id.substring(0, 8)}...`} — {driver.phone || driver.email || 'No contact'}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setAssignModalOrder(null); setActionError(''); setSelectedDriverId(''); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmAssign}
                className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                disabled={actionLoading || !selectedDriverId}
              >
                {actionLoading ? 'Assigning...' : 'Assign Driver'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {rescheduleModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reschedule Order</h3>
            <p className="text-gray-600 mb-4">
              Change the date and time for order <strong>{rescheduleModalOrder.id.substring(0, 8)}...</strong> ({rescheduleModalOrder.customer_name}).
            </p>
            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {actionError}
              </div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Date</label>
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">New Time (optional)</label>
              <input
                type="time"
                value={rescheduleTime}
                onChange={(e) => setRescheduleTime(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setRescheduleModalOrder(null); setActionError(''); setRescheduleDate(''); setRescheduleTime(''); }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                disabled={actionLoading}
              >
                Cancel
              </button>
              <button
                onClick={confirmReschedule}
                className="px-4 py-2 text-white bg-amber-600 rounded-lg hover:bg-amber-700 disabled:opacity-50"
                disabled={actionLoading || !rescheduleDate}
              >
                {actionLoading ? 'Rescheduling...' : 'Reschedule Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
