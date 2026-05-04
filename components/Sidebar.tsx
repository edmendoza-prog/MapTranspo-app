'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import { Package, Clock, Truck, CheckCircle, AlertTriangle, Loader, MapPin, User } from 'lucide-react';

type Shipment = {
  id: string;
  shipment_number: string;
  status: string;
  cargo_description: string;
  priority: string;
  scheduled_delivery?: string;
  driver?: {
    name: string;
  };
  route?: {
    origin_warehouse?: {
      name: string;
    };
    destination_warehouse?: {
      name: string;
    };
  };
};

const getStatusBgColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-gray-100 text-gray-700 border-gray-300';
    case 'loading': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'running': return 'bg-green-100 text-green-700 border-green-300';
    case 'delayed': return 'bg-red-100 text-red-700 border-red-300';
    case 'arrived': return 'bg-purple-100 text-purple-700 border-purple-300';
    case 'delivered': return 'bg-blue-100 text-blue-700 border-blue-300';
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return Clock;
    case 'loading': return Loader;
    case 'running': return Truck;
    case 'delayed': return AlertTriangle;
    case 'arrived': return MapPin;
    case 'delivered': return CheckCircle;
    default: return Package;
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case 'urgent': return 'text-red-600';
    case 'high': return 'text-orange-600';
    case 'normal': return 'text-gray-600';
    case 'low': return 'text-gray-400';
    default: return 'text-gray-600';
  }
};

export default function Sidebar() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const { data, error } = await supabase
          .from('shipments')
          .select(`
            *,
            driver:drivers(name),
            route:routes(
              origin_warehouse:warehouses!routes_origin_warehouse_id_fkey(name),
              destination_warehouse:warehouses!routes_destination_warehouse_id_fkey(name)
            )
          `)
          .order('created_at', { ascending: false });

        if (data) {
          setShipments(data as any);
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchShipments();

    // Subscribe to realtime updates
    const shipmentsChannel = supabase
      .channel('shipments-sidebar-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shipments' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          fetchShipments(); // Refetch to get related data
        } else if (payload.eventType === 'UPDATE') {
          setShipments(prev => prev.map(s => 
            s.id === (payload.new as any).id 
              ? { ...s, ...(payload.new as any) }
              : s
          ));
        } else if (payload.eventType === 'DELETE') {
          setShipments(prev => prev.filter(s => s.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(shipmentsChannel);
    };
  }, []);

  // Calculate statistics
  const stats = {
    all: shipments.length,
    pending: shipments.filter(s => s.status === 'pending').length,
    loading: shipments.filter(s => s.status === 'loading').length,
    running: shipments.filter(s => s.status === 'running').length,
    delayed: shipments.filter(s => s.status === 'delayed').length,
    arrived: shipments.filter(s => s.status === 'arrived').length,
    delivered: shipments.filter(s => s.status === 'delivered').length,
  };

  // Filter shipments
  const filteredShipments = activeFilter === 'all' 
    ? shipments 
    : shipments.filter(s => s.status === activeFilter);

  const renderShipmentItem = (shipment: Shipment) => {
    const StatusIcon = getStatusIcon(shipment.status);
    
    return (
      <li key={shipment.id} className="p-3 bg-white rounded border border-gray-200 hover:border-gray-300 transition">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-start gap-2">
            <StatusIcon className="w-4 h-4 mt-0.5 text-gray-500" />
            <div>
              <span className="font-semibold text-sm text-gray-900 block">{shipment.shipment_number}</span>
              <span className="text-xs text-gray-500">{shipment.cargo_description}</span>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded border ${getStatusBgColor(shipment.status)}`}>
            {shipment.status}
          </span>
        </div>
        
        {/* Route Info */}
        <div className="text-xs text-gray-600 space-y-1 mb-2">
          <div className="flex items-start gap-1">
            <span className="text-green-600 font-medium">From:</span>
            <span className="flex-1">{shipment.route?.origin_warehouse?.name || 'N/A'}</span>
          </div>
          <div className="flex items-start gap-1">
            <span className="text-red-600 font-medium">To:</span>
            <span className="flex-1">{shipment.route?.destination_warehouse?.name || 'N/A'}</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            {shipment.driver?.name ? (
              <>
                <User className="w-3 h-3" />
                <span>{shipment.driver.name}</span>
              </>
            ) : (
              <span className="text-gray-400">No driver assigned</span>
            )}
          </div>
          <span className={`text-xs font-medium uppercase ${getPriorityColor(shipment.priority)}`}>
            {shipment.priority}
          </span>
        </div>
      </li>
    );
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 z-10 hidden md:flex flex-col h-full overflow-hidden">
      <div className="p-4 bg-gray-900 text-white sticky top-0">
        <div className="mb-3">
          <h1 className="text-lg font-semibold mb-1 flex items-center gap-2">
            <Package size={20} />
            <span>Delivery Status</span>
          </h1>
          <p className="text-xs text-gray-400">
            {stats.all} Total Shipments
          </p>
        </div>
        
        {/* Status Stats Grid */}
        <div className="grid grid-cols-3 gap-2 mt-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`p-2 rounded text-center transition ${activeFilter === 'all' ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            <div className="text-lg font-bold">{stats.all}</div>
            <div className="text-xs">All</div>
          </button>
          <button
            onClick={() => setActiveFilter('running')}
            className={`p-2 rounded text-center transition ${activeFilter === 'running' ? 'bg-green-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            <div className="text-lg font-bold">{stats.running}</div>
            <div className="text-xs">In Transit</div>
          </button>
          <button
            onClick={() => setActiveFilter('delivered')}
            className={`p-2 rounded text-center transition ${activeFilter === 'delivered' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'}`}
          >
            <div className="text-lg font-bold">{stats.delivered}</div>
            <div className="text-xs">Delivered</div>
          </button>
        </div>

        {/* Additional Status Filters */}
        <div className="grid grid-cols-4 gap-1.5 mt-2">
          <button
            onClick={() => setActiveFilter('pending')}
            className={`p-1.5 rounded text-center text-xs transition ${activeFilter === 'pending' ? 'bg-gray-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <div className="font-bold">{stats.pending}</div>
            <div className="text-[10px]">Pending</div>
          </button>
          <button
            onClick={() => setActiveFilter('loading')}
            className={`p-1.5 rounded text-center text-xs transition ${activeFilter === 'loading' ? 'bg-yellow-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <div className="font-bold">{stats.loading}</div>
            <div className="text-[10px]">Loading</div>
          </button>
          <button
            onClick={() => setActiveFilter('delayed')}
            className={`p-1.5 rounded text-center text-xs transition ${activeFilter === 'delayed' ? 'bg-red-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <div className="font-bold">{stats.delayed}</div>
            <div className="text-[10px]">Delayed</div>
          </button>
          <button
            onClick={() => setActiveFilter('arrived')}
            className={`p-1.5 rounded text-center text-xs transition ${activeFilter === 'arrived' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            <div className="font-bold">{stats.arrived}</div>
            <div className="text-[10px]">Arrived</div>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-gray-600 font-medium">Loading...</div>
          </div>
        ) : (
          <>
            {/* Filter Header */}
            <div className="mb-3 pb-2 border-b border-gray-200">
              <h2 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                {activeFilter === 'all' ? 'All Shipments' : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Shipments`}
                <span className="ml-2 text-gray-500">({filteredShipments.length})</span>
              </h2>
            </div>

            {/* Shipments List */}
            {filteredShipments.length > 0 ? (
              <ul className="space-y-3">
                {filteredShipments.map(shipment => renderShipmentItem(shipment))}
              </ul>
            ) : (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">
                  {activeFilter === 'all' 
                    ? 'No shipments found' 
                    : `No ${activeFilter} shipments`}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}