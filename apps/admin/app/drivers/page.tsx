'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, Driver } from '../../lib/api';

export default function DriversPage() {
  const router = useRouter();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [verificationFilter, setVerificationFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const loadDrivers = useCallback(async () => {
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (verificationFilter) params.driver_status = verificationFilter;
      if (searchQuery) params.search = searchQuery;
      
      const data = await api.getDrivers(params);
      setDrivers(data.drivers);
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
  }, [statusFilter, verificationFilter, searchQuery, router]);

  useEffect(() => {
    loadDrivers();
  }, [loadDrivers]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadDrivers();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadDrivers]);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await api.approveDriver(id);
      loadDrivers();
      alert('Driver approved successfully!');
    } catch (err: any) {
      alert(`Failed to approve driver: ${err.message}`);
    }
  };

  const handleReject = async (id: string, reason: string) => {
    try {
      await api.rejectDriver(id, reason);
      loadDrivers();
      alert('Driver rejected successfully!');
    } catch (err: any) {
      alert(`Failed to reject driver: ${err.message}`);
    }
  };

  const handleSuspend = async (id: string, reason: string) => {
    try {
      await api.suspendDriver(id, reason);
      loadDrivers();
      alert('Driver suspended successfully!');
    } catch (err: any) {
      alert(`Failed to suspend driver: ${err.message}`);
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await api.activateDriver(id);
      loadDrivers();
      alert('Driver activated successfully!');
    } catch (err: any) {
      alert(`Failed to activate driver: ${err.message}`);
    }
  };

  const getVerificationBadge = (driverStatus: string) => {
    const styles = {
      pending_review: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      suspended: 'bg-gray-100 text-gray-800',
    };
    const labels = {
      pending_review: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      suspended: 'Suspended',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[driverStatus as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
        {labels[driverStatus as keyof typeof labels] || driverStatus}
      </span>
    );
  };

  const getActiveBadge = (isActive: boolean) => {
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${isActive ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  const viewDriverDetails = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Driver Compliance Management</h1>
          <p className="text-gray-600 mt-2">Review documents, approve/reject drivers, and manage compliance</p>
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
            onClick={loadDrivers}
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

      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or phone..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Status</label>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">{drivers.length} driver{drivers.length !== 1 ? 's' : ''} found</span>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Verification</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {drivers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No drivers found</td>
              </tr>
            ) : (
              drivers.map((driver) => (
                <tr key={driver.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{driver.name}</div>
                    <div className="text-sm text-gray-500">ID: {String(driver.id).substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{driver.email}</div>
                    <div className="text-sm text-gray-500">{driver.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getVerificationBadge(driver.driver_status || 'pending_review')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getActiveBadge(driver.is_active !== false)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(driver.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => viewDriverDetails(driver)}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        View Details
                      </button>
                      {driver.driver_status === 'pending_review' && (
                        <>
                          <button
                            onClick={() => handleApprove(driver.id)}
                            className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Reason for rejection:');
                              if (reason) handleReject(driver.id, reason);
                            }}
                            className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {driver.driver_status === 'approved' && driver.is_active && (
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for suspension:');
                            if (reason) handleSuspend(driver.id, reason);
                          }}
                          className="px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
                        >
                          Suspend
                        </button>
                      )}
                      {driver.driver_status === 'suspended' && (
                        <button
                          onClick={() => handleActivate(driver.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Activate
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

      {/* Driver Details Modal */}
      {showDetailsModal && selectedDriver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Driver Details</h2>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold text-gray-700">Personal Information</h3>
                <p><strong>Name:</strong> {selectedDriver.name}</p>
                <p><strong>Email:</strong> {selectedDriver.email}</p>
                <p><strong>Phone:</strong> {selectedDriver.phone}</p>
                <p><strong>Joined:</strong> {new Date(selectedDriver.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-700">Status</h3>
                <p><strong>Verification:</strong> {getVerificationBadge(selectedDriver.driver_status || 'pending_review')}</p>
                <p><strong>Activity:</strong> {getActiveBadge(selectedDriver.is_active !== false)}</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-2">Documents</h3>
              <div className="grid grid-cols-2 gap-4">
                {selectedDriver.selfie_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Selfie</p>
                    <img src={selectedDriver.selfie_url} alt="Selfie" className="w-full h-48 object-cover rounded border" />
                  </div>
                )}
                {selectedDriver.license_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Driver's License</p>
                    <img src={selectedDriver.license_url} alt="License" className="w-full h-48 object-cover rounded border" />
                  </div>
                )}
                {selectedDriver.vehicle_registration_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Vehicle Registration</p>
                    <img src={selectedDriver.vehicle_registration_url} alt="Vehicle" className="w-full h-48 object-cover rounded border" />
                  </div>
                )}
                {selectedDriver.insurance_url && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Insurance</p>
                    <img src={selectedDriver.insurance_url} alt="Insurance" className="w-full h-48 object-cover rounded border" />
                  </div>
                )}
              </div>
              {!selectedDriver.selfie_url && !selectedDriver.license_url && !selectedDriver.vehicle_registration_url && !selectedDriver.insurance_url && (
                <p className="text-gray-500 text-sm">No documents uploaded yet</p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
