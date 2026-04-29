'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Shipment } from '@/types/database';

export default function ShipmentTracking() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    fetchShipments();

    // Subscribe to shipment changes
    const channel = supabase
      .channel('shipment-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          fetchShipments(); // Refetch to get joined data
        } else if (payload.eventType === 'UPDATE') {
          setShipments((prev) =>
            prev.map((s) => (s.id === (payload.new as any).id ? { ...s, ...(payload.new as any) } : s))
          );
        } else if (payload.eventType === 'DELETE') {
          setShipments((prev) => prev.filter((s) => s.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchShipments = async () => {
    try {
      const response = await fetch('/api/shipments');
      const result = await response.json();
      if (result.success) {
        setShipments(result.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (shipmentId: string, newStatus: string) => {
    try {
      await fetch('/api/shipments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: shipmentId, status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating shipment status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-500 text-white';
      case 'loading':
        return 'bg-yellow-500 text-white';
      case 'running':
        return 'bg-green-500 text-white';
      case 'delayed':
        return 'bg-red-500 text-white';
      case 'arrived':
        return 'bg-blue-500 text-white';
      case 'delivered':
        return 'bg-indigo-600 text-white';
      default:
        return 'bg-gray-400 text-white';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'text-red-600 font-bold';
      case 'high':
        return 'text-orange-600 font-semibold';
      case 'normal':
        return 'text-gray-600';
      case 'low':
        return 'text-gray-400';
      default:
        return 'text-gray-600';
    }
  };

  const filteredShipments = shipments.filter((s) => {
    if (filter === 'all') return true;
    return s.status === filter;
  });

  const stats = {
    total: shipments.length,
    pending: shipments.filter((s) => s.status === 'pending').length,
    loading: shipments.filter((s) => s.status === 'loading').length,
    running: shipments.filter((s) => s.status === 'running').length,
    delayed: shipments.filter((s) => s.status === 'delayed').length,
    arrived: shipments.filter((s) => s.status === 'arrived').length,
    delivered: shipments.filter((s) => s.status === 'delivered').length,
  };

  if (loading) {
    return <div className="p-6">Loading shipments...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg h-full overflow-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-4">Shipment Tracking</h2>

      {/* Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        <div className="bg-slate-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
          <div className="text-xs text-slate-600">Total</div>
        </div>
        <div className="bg-gray-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-700">{stats.pending}</div>
          <div className="text-xs text-gray-600">Pending</div>
        </div>
        <div className="bg-yellow-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-700">{stats.loading}</div>
          <div className="text-xs text-yellow-700">Loading</div>
        </div>
        <div className="bg-green-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-700">{stats.running}</div>
          <div className="text-xs text-green-700">Running</div>
        </div>
        <div className="bg-red-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-700">{stats.delayed}</div>
          <div className="text-xs text-red-700">Delayed</div>
        </div>
        <div className="bg-blue-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-700">{stats.arrived}</div>
          <div className="text-xs text-blue-700">Arrived</div>
        </div>
        <div className="bg-indigo-100 p-3 rounded-lg text-center">
          <div className="text-2xl font-bold text-indigo-700">{stats.delivered}</div>
          <div className="text-xs text-indigo-700">Delivered</div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', 'pending', 'loading', 'running', 'delayed', 'arrived', 'delivered'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Shipments List */}
      <div className="space-y-4">
        {filteredShipments.map((shipment: any) => (
          <div
            key={shipment.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-800">{shipment.shipment_number}</h3>
                  <span className={`text-xs font-bold uppercase ${getPriorityColor(shipment.priority)}`}>
                    {shipment.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {shipment.route?.origin_warehouse?.name} → {shipment.route?.destination_warehouse?.name}
                </p>
              </div>
              <select
                value={shipment.status}
                onChange={(e) => handleStatusChange(shipment.id, e.target.value)}
                className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(shipment.status)}`}
              >
                <option value="pending">Pending</option>
                <option value="loading">Loading</option>
                <option value="running">Running</option>
                <option value="delayed">Delayed</option>
                <option value="arrived">Arrived</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">Driver:</span>{' '}
                <span className="font-medium">{shipment.driver?.name || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-gray-500">Truck:</span>{' '}
                <span className="font-medium">{shipment.truck?.plate_id || 'Not assigned'}</span>
              </div>
              <div>
                <span className="text-gray-500">Pickup:</span>{' '}
                <span className="font-medium">
                  {new Date(shipment.scheduled_pickup).toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Delivery:</span>{' '}
                <span className="font-medium">
                  {new Date(shipment.scheduled_delivery).toLocaleString()}
                </span>
              </div>
            </div>

            {shipment.cargo_description && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Cargo:</span> {shipment.cargo_description}
                  {shipment.cargo_weight_kg && ` (${shipment.cargo_weight_kg} kg)`}
                </p>
              </div>
            )}

            {shipment.notes && (
              <div className="mt-2">
                <p className="text-xs text-gray-600 italic">{shipment.notes}</p>
              </div>
            )}
          </div>
        ))}

        {filteredShipments.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No shipments found</p>
            <p className="text-sm mt-1">
              {filter === 'all' ? 'Create a new shipment to get started' : `No ${filter} shipments`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
