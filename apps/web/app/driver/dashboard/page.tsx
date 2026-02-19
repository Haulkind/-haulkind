'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { driverApi, Job, Driver } from '../../../lib/driver-api';

export default function DriverDashboardPage() {
  const router = useRouter();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'available' | 'my-jobs'>('available');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [driverData, availableData, myJobsData] = await Promise.all([
        driverApi.getMe(),
        driverApi.getAvailableJobs(),
        driverApi.getMyJobs(),
      ]);
      setDriver(driverData.driver);
      setAvailableJobs(availableData.jobs);
      setMyJobs(myJobsData.jobs);
    } catch (err: any) {
      if (err.message.includes('401') || err.message.includes('token')) {
        router.push('/driver/login');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    try {
      await driverApi.acceptJob(jobId);
      await loadData(); // Reload data
    } catch (err: any) {
      alert('Failed to accept job: ' + err.message);
    }
  };

  const handleStartJob = async (jobId: string) => {
    try {
      await driverApi.startJob(jobId);
      await loadData();
    } catch (err: any) {
      alert('Failed to start job: ' + err.message);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      await driverApi.completeJob(jobId);
      await loadData();
    } catch (err: any) {
      alert('Failed to complete job: ' + err.message);
    }
  };

  const handleLogout = () => {
    driverApi.clearToken();
    router.push('/driver/login');
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'assigned': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome, {driver?.name}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`${
                activeTab === 'available'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Available Jobs ({availableJobs.length})
            </button>
            <button
              onClick={() => setActiveTab('my-jobs')}
              className={`${
                activeTab === 'my-jobs'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              My Jobs ({myJobs.length})
            </button>
          </nav>
        </div>

        {/* Jobs List */}
        <div className="space-y-4">
          {activeTab === 'available' && availableJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">No available jobs at the moment</p>
            </div>
          )}

          {activeTab === 'available' && availableJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.service_type === 'HAUL_AWAY' ? 'Junk Removal' : 'Labor Only'}
                  </h3>
                  <p className="text-sm text-gray-600">{job.customer_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Location:</p>
                  <p className="font-medium">{job.city}, {job.state} {job.zip}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone:</p>
                  <p className="font-medium">{job.phone}</p>
                </div>
                {job.pickup_date && (
                  <div>
                    <p className="text-gray-600">Pickup Date:</p>
                    <p className="font-medium">{new Date(job.pickup_date).toLocaleDateString()}</p>
                  </div>
                )}
                {job.pricing_json?.total && (
                  <div>
                    <p className="text-gray-600">Total:</p>
                    <p className="font-medium text-green-600">${job.pricing_json.total}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => handleAcceptJob(job.id)}
                className="w-full bg-teal-600 text-white py-2 px-4 rounded-md hover:bg-teal-700"
              >
                Accept Job
              </button>
            </div>
          ))}

          {activeTab === 'my-jobs' && myJobs.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <p className="text-gray-500">You haven't accepted any jobs yet</p>
            </div>
          )}

          {activeTab === 'my-jobs' && myJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {job.service_type === 'HAUL_AWAY' ? 'Junk Removal' : 'Labor Only'}
                  </h3>
                  <p className="text-sm text-gray-600">{job.customer_name}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                  {job.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <p className="text-gray-600">Location:</p>
                  <p className="font-medium">{job.city}, {job.state} {job.zip}</p>
                </div>
                <div>
                  <p className="text-gray-600">Phone:</p>
                  <p className="font-medium">{job.phone}</p>
                </div>
                {job.pickup_date && (
                  <div>
                    <p className="text-gray-600">Pickup Date:</p>
                    <p className="font-medium">{new Date(job.pickup_date).toLocaleDateString()}</p>
                  </div>
                )}
                {job.pricing_json?.total && (
                  <div>
                    <p className="text-gray-600">Total:</p>
                    <p className="font-medium text-green-600">${job.pricing_json.total}</p>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {job.status === 'assigned' && (
                  <button
                    onClick={() => handleStartJob(job.id)}
                    className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
                  >
                    Start Job
                  </button>
                )}
                {job.status === 'in_progress' && (
                  <button
                    onClick={() => handleCompleteJob(job.id)}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
                  >
                    Complete Job
                  </button>
                )}
                {job.status === 'completed' && (
                  <div className="flex-1 bg-gray-100 text-gray-600 py-2 px-4 rounded-md text-center">
                    Completed ✓
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
