'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

type FleetVehicle = {
  id: string;
  plate_id: string;
  vin: string;
  status: string;
  last_lat?: number;
  last_lng?: number;
};

type Warehouse = {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contact: string;
  capacity: number;
  is_main_hub: boolean;
};

const getStatusBgColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-gray-100 text-gray-700';
    case 'loading': return 'bg-yellow-100 text-yellow-700';
    case 'in transit':
    case 'running': return 'bg-green-100 text-green-700';
    case 'delayed': return 'bg-red-100 text-red-700';
    case 'arrived':
    case 'delivered': return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

export default function Sidebar() {
  const [trucks, setTrucks] = useState<FleetVehicle[]>([]);
  const [trailers, setTrailers] = useState<FleetVehicle[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fleet' | 'warehouses'>('fleet');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [trucksRes, trailersRes, warehousesRes] = await Promise.all([
          supabase.from('trucks').select('*').order('created_at', { ascending: false }),
          supabase.from('trailers').select('*').order('created_at', { ascending: false }),
          supabase.from('warehouses').select('*').order('is_main_hub', { ascending: false })
        ]);

        if (trucksRes.data) setTrucks(trucksRes.data as FleetVehicle[]);
        if (trailersRes.data) setTrailers(trailersRes.data as FleetVehicle[]);
        if (warehousesRes.data) setWarehouses(warehousesRes.data as Warehouse[]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to realtime updates for trucks and trailers only
    const trucksChannel = supabase
      .channel('trucks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrucks(prev => [payload.new as FleetVehicle, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTrucks(prev => prev.map(t => t.id === (payload.new as any).id ? payload.new as FleetVehicle : t));
        } else if (payload.eventType === 'DELETE') {
          setTrucks(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    const trailersChannel = supabase
      .channel('trailers-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trailers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrailers(prev => [payload.new as FleetVehicle, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTrailers(prev => prev.map(t => t.id === (payload.new as any).id ? payload.new as FleetVehicle : t));
        } else if (payload.eventType === 'DELETE') {
          setTrailers(prev => prev.filter(t => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(trucksChannel);
      supabase.removeChannel(trailersChannel);
    };
  }, []);

  const renderVehicleItem = (vehicle: FleetVehicle, type: string) => (
    <li key={vehicle.id} className="p-3 bg-white rounded-md border border-gray-100 shadow-sm relative overflow-hidden pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-slate-400">
      <span className="font-semibold text-sm text-slate-800">{type} {vehicle.plate_id}</span>
      <div className="flex justify-between items-center mt-2">
        <span className="text-xs font-medium text-slate-500">VIN: {vehicle.vin ? vehicle.vin.substring(0, 12) : 'N/A'}...</span>
        <span className={`text-[10px] font-bold px-2 py-1 rounded ${getStatusBgColor(vehicle.status)}`}>
          {vehicle.status}
        </span>
      </div>
    </li>
  );

  const renderWarehouseItem = (warehouse: Warehouse) => (
    <li key={warehouse.id} className={`p-3 rounded-md border shadow-sm relative overflow-hidden pl-4 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 ${warehouse.is_main_hub ? 'bg-amber-50 border-amber-200 before:bg-amber-600' : 'bg-slate-50 border-slate-200 before:bg-slate-400'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <span className={`font-semibold text-sm ${warehouse.is_main_hub ? 'text-amber-900' : 'text-slate-800'}`}>
            {warehouse.name}
            {warehouse.is_main_hub && <span className="ml-2 text-xs bg-amber-200 px-2 py-0.5 rounded font-bold">HUB</span>}
          </span>
          <div className="text-xs text-gray-600 mt-1">{warehouse.address}</div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-600">Cap: {warehouse.capacity}</span>
            <span className="text-xs text-gray-600 font-mono">{warehouse.contact}</span>
          </div>
        </div>
      </div>
    </li>
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 z-10 hidden md:flex flex-col shadow-lg h-full overflow-hidden">
      <div className="p-5 bg-slate-900 text-white sticky top-0 border-b">
        <h1 className="text-xl font-bold mb-1">Mindanao Transport</h1>
        <p className="text-xs text-slate-300">Network: {warehouses.length} Warehouses | Fleet: {trucks.length + trailers.length} Vehicles</p>
        
        {/* Tabs */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 py-2 text-xs font-semibold rounded transition ${activeTab === 'fleet' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
          >
            Fleet ({trucks.length + trailers.length})
          </button>
          <button
            onClick={() => setActiveTab('warehouses')}
            className={`flex-1 py-2 text-xs font-semibold rounded transition ${activeTab === 'warehouses' ? 'bg-amber-600 text-white' : 'bg-slate-700 text-slate-200 hover:bg-slate-600'}`}
          >
            Hubs ({warehouses.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="text-center text-gray-500 py-8">Loading...</div>
        ) : activeTab === 'fleet' ? (
          <>
            <div className="mb-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Status Legend</h2>
              <div className="flex flex-wrap gap-1 text-xs">
                <span className="px-2 py-1 bg-gray-500 text-white rounded text-[10px]">Pending</span>
                <span className="px-2 py-1 bg-yellow-500 text-white rounded text-[10px]">Loading</span>
                <span className="px-2 py-1 bg-green-500 text-white rounded text-[10px]">Running</span>
                <span className="px-2 py-1 bg-red-500 text-white rounded text-[10px]">Delayed</span>
              </div>
            </div>

            {trucks.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center">
                  <span className="inline-block w-2 h-2 bg-slate-600 rounded-full mr-2"></span>
                  Trucks ({trucks.length})
                </h3>
                <ul className="space-y-3">
                  {trucks.map(truck => renderVehicleItem(truck, 'Truck'))}
                </ul>
              </div>
            )}

            {trailers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 mb-2 flex items-center">
                  <span className="inline-block w-2 h-2 bg-slate-600 rounded-full mr-2"></span>
                  Trailers ({trailers.length})
                </h3>
                <ul className="space-y-3">
                  {trailers.map(trailer => renderVehicleItem(trailer, 'Trailer'))}
                </ul>
              </div>
            )}

            {trucks.length === 0 && trailers.length === 0 && (
              <p className="text-gray-600 text-sm mb-4">Click anywhere on the map to dispatch a new vehicle.</p>
            )}
          </>
        ) : (
          <>
            {warehouses.length > 0 ? (
              <ul className="space-y-3">
                {warehouses.map(warehouse => renderWarehouseItem(warehouse))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm">No warehouse data available.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}