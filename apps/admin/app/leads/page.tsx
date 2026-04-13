'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api';

interface Lead {
  id: number;
  name: string;
  phone: string;
  zip_code: string;
  items_selected: string[];
  item_details: Array<{ id: string; name: string; price: number }>;
  estimated_price: number;
  service_type: string;
  tcpa_consent: boolean;
  status: 'incomplete' | 'contacted' | 'converted' | 'lost';
  notes: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_COLORS: Record<string, string> = {
  incomplete: 'bg-yellow-100 text-yellow-800',
  contacted: 'bg-blue-100 text-blue-800',
  converted: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

const STATUS_LABELS: Record<string, string> = {
  incomplete: 'Incomplete',
  contacted: 'Contacted',
  converted: 'Converted',
  lost: 'Lost',
};

function formatPhone(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10) return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  return phone;
}

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const data = await api.getLeads(params);
      setLeads(data.leads);
      setTotal(data.total);
    } catch (err: any) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLeads, 30000);
    return () => clearInterval(interval);
  }, [fetchLeads]);

  const updateLeadStatus = async (id: number, status: string, notes?: string) => {
    try {
      setUpdatingId(id);
      await api.updateLeadStatus(String(id), status, notes);
      await fetchLeads();
    } catch (err: any) {
      console.error('Failed to update lead:', err);
      alert('Failed to update lead: ' + err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteLead = async (id: number) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await api.deleteLead(String(id));
      await fetchLeads();
    } catch (err: any) {
      console.error('Failed to delete lead:', err);
      alert('Failed to delete: ' + err.message);
    }
  };

  const incompleteCount = leads.filter(l => l.status === 'incomplete').length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Incomplete / Abandoned Quotes
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Leads who started a quote but haven&apos;t completed booking yet. Call them to close!
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-yellow-700">{leads.filter(l => l.status === 'incomplete').length}</p>
          <p className="text-xs text-yellow-600">Incomplete</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{leads.filter(l => l.status === 'contacted').length}</p>
          <p className="text-xs text-blue-600">Contacted</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{leads.filter(l => l.status === 'converted').length}</p>
          <p className="text-xs text-green-600">Converted</p>
        </div>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-gray-700">{total}</p>
          <p className="text-xs text-gray-600">Total Leads</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="incomplete">Incomplete</option>
          <option value="contacted">Contacted</option>
          <option value="converted">Converted</option>
          <option value="lost">Lost</option>
        </select>
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-4 py-2 text-sm flex-1"
        />
        <button
          onClick={fetchLeads}
          className="bg-teal-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-teal-700"
        >
          Refresh
        </button>
      </div>

      {/* Leads List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading leads...</div>
      ) : leads.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No leads found</p>
          <p className="text-sm mt-1">Leads will appear here when customers start a quote on the website.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <div
              key={lead.id}
              className={`bg-white rounded-lg border shadow-sm overflow-hidden ${
                lead.status === 'incomplete' ? 'border-yellow-300' : 'border-gray-200'
              }`}
            >
              {/* Lead Row */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {/* Status badge */}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[lead.status]}`}>
                      {STATUS_LABELS[lead.status]}
                    </span>
                    {/* Name & Phone */}
                    <div>
                      <p className="font-semibold text-gray-900">{lead.name}</p>
                      <p className="text-sm text-gray-500">{formatPhone(lead.phone)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {/* Price */}
                    <div className="text-right">
                      <p className="font-bold text-teal-700">${lead.estimated_price}</p>
                      <p className="text-xs text-gray-400">{timeAgo(lead.created_at)}</p>
                    </div>
                    {/* Call CTA for incomplete leads */}
                    {lead.status === 'incomplete' && (
                      <a
                        href={`tel:${lead.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium"
                      >
                        Call Now
                      </a>
                    )}
                    {/* Expand arrow */}
                    <svg
                      className={`w-5 h-5 text-gray-400 transition-transform ${expandedId === lead.id ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === lead.id && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Lead Info */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Lead Details</h4>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-gray-500">Name:</span> {lead.name}</p>
                        <p><span className="text-gray-500">Phone:</span> {formatPhone(lead.phone)}</p>
                        <p><span className="text-gray-500">ZIP:</span> {lead.zip_code}</p>
                        <p><span className="text-gray-500">Service:</span> {lead.service_type}</p>
                        <p><span className="text-gray-500">TCPA Consent:</span> {lead.tcpa_consent ? 'Yes' : 'No'}</p>
                        <p><span className="text-gray-500">Created:</span> {new Date(lead.created_at).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Items */}
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Selected Items</h4>
                      {lead.item_details && lead.item_details.length > 0 ? (
                        <div className="space-y-1">
                          {lead.item_details.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-sm">
                              <span>{item.name}</span>
                              <span className="font-medium">${item.price}</span>
                            </div>
                          ))}
                          <div className="flex justify-between text-sm font-bold border-t pt-1 mt-2">
                            <span>Total</span>
                            <span className="text-teal-700">${lead.estimated_price}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400">No items selected</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {lead.notes && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <span className="font-medium">Notes:</span> {lead.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {lead.status !== 'contacted' && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, 'contacted')}
                        disabled={updatingId === lead.id}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                      >
                        Mark Contacted
                      </button>
                    )}
                    {lead.status !== 'converted' && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, 'converted')}
                        disabled={updatingId === lead.id}
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                      >
                        Mark Converted
                      </button>
                    )}
                    {lead.status !== 'lost' && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, 'lost')}
                        disabled={updatingId === lead.id}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                      >
                        Mark Lost
                      </button>
                    )}
                    {lead.status !== 'incomplete' && (
                      <button
                        onClick={() => updateLeadStatus(lead.id, 'incomplete')}
                        disabled={updatingId === lead.id}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-sm disabled:opacity-50"
                      >
                        Reset to Incomplete
                      </button>
                    )}
                    <button
                      onClick={() => deleteLead(lead.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination info */}
      {total > leads.length && (
        <p className="text-center text-sm text-gray-500 mt-4">
          Showing {leads.length} of {total} leads
        </p>
      )}
    </div>
  );
}
