'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Order, Driver, CashFlow } from '../../lib/api';

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
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [mediaModalOrder, setMediaModalOrder] = useState<Order | null>(null);
  const [mediaTab, setMediaTab] = useState<'photos' | 'completion' | 'signature'>('photos');
  const [mediaData, setMediaData] = useState<{ completion_photos: string | null; signature_data: string | null; photo_urls: string | null } | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);

  // Create Order modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    customer_name: '', customer_phone: '', customer_email: '',
    service_type: 'HAUL_AWAY', pickup_address: '', description: '',
    estimated_price: '', scheduled_for: '', pickup_time_window: '',
    assign_driver_id: '', mark_completed: false, mark_paid: false,
  });
  const [createPhotos, setCreatePhotos] = useState<string[]>([]);
  const [createSignature, setCreateSignature] = useState('');
  const [createDrivers, setCreateDrivers] = useState<Driver[]>([]);

  // Complete & Pay modal
  const [completePaidOrder, setCompletePaidOrder] = useState<Order | null>(null);
  const [completePaidAmount, setCompletePaidAmount] = useState('');

  const loadOrders= useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (serviceTypeFilter) params.service_type = serviceTypeFilter;
      if (searchQuery) params.search = searchQuery;
      
      const [data, cf] = await Promise.all([
        api.getOrders(params),
        api.getCashFlow().catch(() => null),
      ]);
      setOrders(data.orders);
      if (cf) setCashFlow(cf);
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

  const getPaymentBadge = (order: Order) => {
    if (order.paid_at) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
          Paid
        </span>
      );
    }
    if (order.status === 'cancelled') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-500">
          --
        </span>
      );
    }
    if (order.status === 'refunded') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
          Refunded
        </span>
      );
    }
    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
        Unpaid
      </span>
    );
  };

  const formatCents = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

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

  // ---- CREATE ORDER ----
  const handleOpenCreate = async () => {
    setCreateForm({
      customer_name: '', customer_phone: '', customer_email: '',
      service_type: 'HAUL_AWAY', pickup_address: '', description: '',
      estimated_price: '', scheduled_for: '', pickup_time_window: '',
      assign_driver_id: '', mark_completed: false, mark_paid: false,
    });
    setCreatePhotos([]);
    setCreateSignature('');
    setActionError('');
    setShowCreateModal(true);
    try {
      const data = await api.getDrivers({ status: 'approved', limit: 100 });
      setCreateDrivers(data.drivers);
    } catch { setCreateDrivers([]); }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) setCreatePhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) setCreateSignature(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const confirmCreateOrder = async () => {
    if (!createForm.customer_name || !createForm.customer_phone) {
      setActionError('Customer name and phone are required');
      return;
    }
    setActionLoading(true);
    setActionError('');
    try {
      const photoUrlsStr = createPhotos.length > 0 ? JSON.stringify(createPhotos) : undefined;
      await api.createOrder({
        ...createForm,
        estimated_price: createForm.estimated_price || '0',
        photo_urls: photoUrlsStr,
        signature_data: createSignature || undefined,
        assign_driver_id: createForm.assign_driver_id || undefined,
        scheduled_for: createForm.scheduled_for || undefined,
        pickup_time_window: createForm.pickup_time_window || undefined,
      });
      setActionSuccess('Order created successfully!');
      setShowCreateModal(false);
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create order');
    } finally {
      setActionLoading(false);
    }
  };

  // ---- COMPLETE & PAY ----
  const handleCompletePaidClick = (order: Order) => {
    setActionError('');
    setCompletePaidAmount(formatPrice(order.pricing_json).replace('$', ''));
    setCompletePaidOrder(order);
  };

  const confirmCompletePaid = async () => {
    if (!completePaidOrder || !completePaidAmount) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.completeAndPayOrder(completePaidOrder.id, completePaidAmount);
      setActionSuccess(`Order marked as completed & paid ($${completePaidAmount})`);
      setCompletePaidOrder(null);
      setCompletePaidAmount('');
      loadOrders();
    } catch (err: any) {
      setActionError(err.message || 'Failed to complete order');
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
    <div className="p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Order Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">View and manage customer orders</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>{countdown}s</span>
          </div>
          {lastUpdated && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={handleOpenCreate}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs sm:text-sm font-medium"
          >
            + Create Order
          </button>
          <button
            onClick={loadOrders}
            className="px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
          >
            Refresh
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

      {/* Cash Flow Summary Cards */}
      {cashFlow && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Total Received</p>
            <p className="text-2xl font-bold text-green-700">{formatCents(cashFlow.paid.totalCents)}</p>
            <p className="text-xs text-gray-500">{cashFlow.paid.count} paid orders</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Haulkind Revenue (30%)</p>
            <p className="text-2xl font-bold text-blue-700">{formatCents(cashFlow.platformFees.totalCents)}</p>
            <p className="text-xs text-gray-500">Driver portion: {formatCents(cashFlow.driverEarnings.totalCents)}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
            <p className="text-xs font-medium text-gray-500 uppercase">Unpaid Orders</p>
            <p className="text-2xl font-bold text-amber-700">${cashFlow.unpaid.totalEstimated.toFixed(2)}</p>
            <p className="text-xs text-gray-500">{cashFlow.unpaid.count} orders awaiting payment</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
            <p className="text-xs font-medium text-gray-500 uppercase">This Month</p>
            <p className="text-2xl font-bold text-purple-700">{formatCents(cashFlow.thisMonth.totalCents)}</p>
            <p className="text-xs text-gray-500">{cashFlow.thisMonth.count} orders | Week: {formatCents(cashFlow.thisWeek.totalCents)}</p>
          </div>
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
        <div className="overflow-x-auto">
          <table className="min-w-[1250px] w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-8 text-center text-gray-500">No orders found</td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-mono text-gray-900">{String(order.id).substring(0, 8)}...</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(String(order.id));
                          setCopiedOrderId(order.id);
                          setTimeout(() => setCopiedOrderId(null), 2000);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title={`Copy full ID: ${order.id}`}
                      >
                        {copiedOrderId === order.id ? (
                          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        )}
                      </button>
                    </div>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.assigned_driver_id ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.driver_display_name || order.driver_name || 'Unknown'}</div>
                        {order.driver_phone && <div className="text-xs text-gray-500">{order.driver_phone}</div>}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">--</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getPaymentBadge(order)}</td>
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
                    <div className="flex gap-1 flex-wrap">
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <>
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
                        </>
                      )}
                      {order.has_photo_urls && (
                        <button
                          onClick={async () => { setMediaModalOrder(order); setMediaTab('photos'); setMediaLoading(true); setMediaData(null); try { const data = await api.getOrderMedia(order.id); setMediaData(data); } catch {} finally { setMediaLoading(false); } }}
                          className="px-2 py-1 text-xs bg-sky-50 text-sky-700 border border-sky-200 rounded hover:bg-sky-100"
                          title="View customer photos"
                        >
                          Customer Photos
                        </button>
                      )}
                      {order.status === 'completed' && order.has_completion_photos && (
                        <button
                          onClick={async () => { setMediaModalOrder(order); setMediaTab('completion'); setMediaLoading(true); setMediaData(null); try { const data = await api.getOrderMedia(order.id); setMediaData(data); } catch {} finally { setMediaLoading(false); } }}
                          className="px-2 py-1 text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 rounded hover:bg-emerald-100"
                          title="View completion photos"
                        >
                          Completion Photos
                        </button>
                      )}
                      {order.status !== 'cancelled' && order.status !== 'completed' && (
                        <button
                          onClick={() => handleCompletePaidClick(order)}
                          className="px-2 py-1 text-xs bg-green-50 text-green-700 border border-green-200 rounded hover:bg-green-100"
                          title="Mark as completed and paid"
                        >
                          Complete & Pay
                        </button>
                      )}
                      {order.status === 'completed' && order.has_signature && (
                        <button
                          onClick={async () => { setMediaModalOrder(order); setMediaTab('signature'); setMediaLoading(true); setMediaData(null); try { const data = await api.getOrderMedia(order.id); setMediaData(data); } catch {} finally { setMediaLoading(false); } }}
                          className="px-2 py-1 text-xs bg-violet-50 text-violet-700 border border-violet-200 rounded hover:bg-violet-100"
                          title="View customer signature"
                        >
                          Signature
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
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

      {/* PHOTOS / SIGNATURE MODAL */}
      {mediaModalOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Order {mediaModalOrder.id.substring(0, 8)}... — {mediaModalOrder.customer_name}
              </h3>
              <button
                onClick={() => setMediaModalOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-4 border-b border-gray-200">
              <button
                onClick={() => setMediaTab('photos')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  mediaTab === 'photos'
                    ? 'border-sky-500 text-sky-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Photos
              </button>
              <button
                onClick={() => setMediaTab('completion')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  mediaTab === 'completion'
                    ? 'border-emerald-500 text-emerald-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Completion Photos
              </button>
              <button
                onClick={() => setMediaTab('signature')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  mediaTab === 'signature'
                    ? 'border-violet-500 text-violet-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Customer Signature
              </button>
            </div>

            {/* Customer Photos Tab */}
            {mediaTab === 'photos' && (
              <div>
                {mediaLoading ? (
                  <p className="text-gray-500 text-sm">Loading photos...</p>
                ) : (() => {
                  const photos: string[] = [];
                  if (mediaData?.photo_urls) {
                    try {
                      const parsed = JSON.parse(mediaData.photo_urls);
                      if (Array.isArray(parsed)) {
                        parsed.forEach((url: string) => { if (url) photos.push(url); });
                      }
                    } catch {
                      mediaData.photo_urls.split('|||').forEach((p: string) => {
                        if (p.trim()) photos.push(p.trim());
                      });
                    }
                  }
                  if (photos.length === 0) {
                    return <p className="text-gray-500 text-sm">No customer photos available for this order.</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {photos.map((photo, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(photo.startsWith('data:') ? photo : (photo.startsWith('http') ? photo : `data:image/jpeg;base64,${photo}`), '_blank')}>
                          <img
                            src={photo.startsWith('data:') ? photo : (photo.startsWith('http') ? photo : `data:image/jpeg;base64,${photo}`)}
                            alt={`Customer photo ${idx + 1}`}
                            className="w-full h-auto object-contain max-h-80"
                          />
                          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                            <span>Photo {idx + 1} of {photos.length}</span>
                            <span className="text-sky-600">Click to enlarge</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Completion Photos Tab */}
            {mediaTab === 'completion' && (
              <div>
                {mediaLoading ? (
                  <p className="text-gray-500 text-sm">Loading photos...</p>
                ) : (() => {
                  const photos: string[] = [];
                  if (mediaData?.completion_photos) {
                    mediaData.completion_photos.split('|||').forEach((p: string) => {
                      if (p.trim()) photos.push(p.trim());
                    });
                  }
                  if (photos.length === 0) {
                    return <p className="text-gray-500 text-sm">No completion photos available for this order.</p>;
                  }
                  return (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {photos.map((photo, idx) => (
                        <div key={idx} className="border border-gray-200 rounded-lg overflow-hidden cursor-pointer" onClick={() => window.open(photo.startsWith('data:') ? photo : (photo.startsWith('http') ? photo : `data:image/jpeg;base64,${photo}`), '_blank')}>
                          <img
                            src={photo.startsWith('data:') ? photo : (photo.startsWith('http') ? photo : `data:image/jpeg;base64,${photo}`)}
                            alt={`Completion photo ${idx + 1}`}
                            className="w-full h-auto object-contain max-h-80"
                          />
                          <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500 flex justify-between items-center">
                            <span>Photo {idx + 1} of {photos.length}</span>
                            <span className="text-emerald-600">Click to enlarge</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Signature Tab */}
            {mediaTab === 'signature' && (
              <div>
                {mediaLoading ? (
                  <p className="text-gray-500 text-sm">Loading signature...</p>
                ) : mediaData?.signature_data ? (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-white p-4 flex items-center justify-center">
                      <img
                        src={mediaData.signature_data.startsWith('data:') ? mediaData.signature_data : `data:image/png;base64,${mediaData.signature_data}`}
                        alt="Customer signature"
                        className="max-w-full h-auto max-h-60"
                      />
                    </div>
                    <div className="px-3 py-2 bg-gray-50 text-xs text-gray-500">
                      Customer signature for order {mediaModalOrder.id.substring(0, 8)}...
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No customer signature available for this order.</p>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setMediaModalOrder(null)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Order Manually</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>

            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{actionError}</div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                <input type="text" value={createForm.customer_name} onChange={e => setCreateForm(f => ({ ...f, customer_name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input type="tel" value={createForm.customer_phone} onChange={e => setCreateForm(f => ({ ...f, customer_phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="(609) 456-8188" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={createForm.customer_email} onChange={e => setCreateForm(f => ({ ...f, customer_email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="customer@email.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select value={createForm.service_type} onChange={e => setCreateForm(f => ({ ...f, service_type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="HAUL_AWAY">Haul Away</option>
                  <option value="LABOR_ONLY">Labor Only</option>
                  <option value="MATTRESS_SWAP">Mattress Swap</option>
                  <option value="FURNITURE_ASSEMBLY">Furniture Assembly</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Address</label>
                <input type="text" value={createForm.pickup_address} onChange={e => setCreateForm(f => ({ ...f, pickup_address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="123 Main St, Philadelphia, PA 19103" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description / Items</label>
                <textarea value={createForm.description} onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" rows={2} placeholder="Old couch, 2 mattresses..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price ($)</label>
                <input type="number" step="0.01" value={createForm.estimated_price} onChange={e => setCreateForm(f => ({ ...f, estimated_price: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="279" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                <input type="date" value={createForm.scheduled_for} onChange={e => setCreateForm(f => ({ ...f, scheduled_for: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Window</label>
                <select value={createForm.pickup_time_window} onChange={e => setCreateForm(f => ({ ...f, pickup_time_window: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">Any Time</option>
                  <option value="MORNING">Morning (8AM-12PM)</option>
                  <option value="AFTERNOON">Afternoon (12PM-4PM)</option>
                  <option value="EVENING">Evening (4PM-8PM)</option>
                  <option value="ALL_DAY">All Day (8AM-8PM)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign to Driver</label>
                <select value={createForm.assign_driver_id} onChange={e => setCreateForm(f => ({ ...f, assign_driver_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500">
                  <option value="">-- No driver (available to all) --</option>
                  {createDrivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name || `${d.id.substring(0, 8)}...`} — {d.phone || d.email || 'No contact'}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Photos */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Photos</label>
              <input type="file" accept="image/*" multiple onChange={handlePhotoUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100" />
              {createPhotos.length > 0 && (
                <div className="flex gap-2 mt-2 flex-wrap">
                  {createPhotos.map((p, i) => (
                    <div key={i} className="relative">
                      <img src={p} alt={`Photo ${i+1}`} className="w-16 h-16 object-cover rounded border" />
                      <button onClick={() => setCreatePhotos(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">&times;</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Signature */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Signature</label>
              <input type="file" accept="image/*" onChange={handleSignatureUpload}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" />
              {createSignature && (
                <div className="mt-2 relative inline-block">
                  <img src={createSignature} alt="Signature" className="h-16 border rounded" />
                  <button onClick={() => setCreateSignature('')}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">&times;</button>
                </div>
              )}
            </div>

            {/* Completed & Paid checkboxes */}
            <div className="mb-4 flex gap-6">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={createForm.mark_completed} onChange={e => setCreateForm(f => ({ ...f, mark_completed: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-gray-700">Mark as Completed</span>
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={createForm.mark_paid} onChange={e => setCreateForm(f => ({ ...f, mark_paid: e.target.checked }))}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-gray-700">Mark as Paid</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" disabled={actionLoading}>Cancel</button>
              <button onClick={confirmCreateOrder}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={actionLoading || !createForm.customer_name || !createForm.customer_phone}>
                {actionLoading ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMPLETE & PAY MODAL */}
      {completePaidOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Complete & Mark Paid</h3>
            <p className="text-gray-600 mb-4">
              Mark order <strong>{completePaidOrder.id.substring(0, 8)}...</strong> for <strong>{completePaidOrder.customer_name}</strong> as completed and paid.
            </p>
            {actionError && (
              <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{actionError}</div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount Paid ($)</label>
              <input type="number" step="0.01" value={completePaidAmount} onChange={e => setCompletePaidAmount(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-bold"
                placeholder="279.00" />
              <p className="text-xs text-gray-500 mt-1">30% goes to HaulKind, 70% to the driver</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setCompletePaidOrder(null); setActionError(''); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200" disabled={actionLoading}>Cancel</button>
              <button onClick={confirmCompletePaid}
                className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={actionLoading || !completePaidAmount}>
                {actionLoading ? 'Processing...' : 'Complete & Mark Paid'}
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
