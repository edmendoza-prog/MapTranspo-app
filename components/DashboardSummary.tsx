'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';

interface DashboardStats {
  totalShipments: number;
  activeShipments: number;
  pendingShipments: number;
  delayedShipments: number;
  totalDrivers: number;
  availableDrivers: number;
  totalVehicles: number;
  totalWarehouses: number;
  deliveredToday: number;
}

export default function DashboardSummary() {
  const [stats, setStats] = useState<DashboardStats>({
    totalShipments: 0,
    activeShipments: 0,
    pendingShipments: 0,
    delayedShipments: 0,
    totalDrivers: 0,
    availableDrivers: 0,
    totalVehicles: 0,
    totalWarehouses: 0,
    deliveredToday: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Refresh stats every 30 seconds
    const interval = setInterval(fetchStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        shipmentsRes,
        driversRes,
        trucksRes,
        trailersRes,
        warehousesRes,
        deliveredTodayRes,
      ] = await Promise.all([
        supabase.from('shipments').select('status', { count: 'exact' }),
        supabase.from('drivers').select('status', { count: 'exact' }),
        supabase.from('trucks').select('id', { count: 'exact' }),
        supabase.from('trailers').select('id', { count: 'exact' }),
        supabase.from('warehouses').select('id', { count: 'exact' }),
        supabase
          .from('shipments')
          .select('id', { count: 'exact' })
          .eq('status', 'delivered')
          .gte('actual_delivery', today.toISOString()),
      ]);

      const shipments = shipmentsRes.data || [];
      const drivers = driversRes.data || [];

      setStats({
        totalShipments: shipmentsRes.count || 0,
        activeShipments:
          shipments.filter((s) => ['loading', 'running'].includes(s.status)).length,
        pendingShipments: shipments.filter((s) => s.status === 'pending').length,
        delayedShipments: shipments.filter((s) => s.status === 'delayed').length,
        totalDrivers: driversRes.count || 0,
        availableDrivers: drivers.filter((d) => d.status === 'available').length,
        totalVehicles: (trucksRes.count || 0) + (trailersRes.count || 0),
        totalWarehouses: warehousesRes.count || 0,
        deliveredToday: deliveredTodayRes.count || 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-lg">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  const StatCard = ({
    title,
    value,
    subtitle,
    bgColor,
    textColor,
  }: {
    title: string;
    value: number | string;
    subtitle?: string;
    bgColor: string;
    textColor: string;
  }) => (
    <div className={`${bgColor} rounded-lg p-4 shadow-md`}>
      <h3 className={`text-sm font-semibold ${textColor} opacity-90`}>{title}</h3>
      <div className={`text-3xl font-bold ${textColor} mt-2`}>{value}</div>
      {subtitle && <p className={`text-xs ${textColor} opacity-75 mt-1`}>{subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white rounded-lg p-6 shadow-lg">
        <h1 className="text-2xl font-bold mb-2">Mindanao Logistics Dashboard</h1>
        <p className="text-slate-300 text-sm">Real-time fleet and shipment monitoring</p>
        <p className="text-slate-400 text-xs mt-1">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Shipments"
          value={stats.totalShipments}
          bgColor="bg-blue-500"
          textColor="text-white"
        />
        <StatCard
          title="Active Shipments"
          value={stats.activeShipments}
          subtitle="Loading + Running"
          bgColor="bg-green-500"
          textColor="text-white"
        />
        <StatCard
          title="Pending Dispatch"
          value={stats.pendingShipments}
          bgColor="bg-gray-500"
          textColor="text-white"
        />
        <StatCard
          title="Delayed"
          value={stats.delayedShipments}
          bgColor="bg-red-500"
          textColor="text-white"
        />
      </div>

      {/* Fleet & Network Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={stats.totalDrivers}
          subtitle={`${stats.availableDrivers} available`}
          bgColor="bg-indigo-100"
          textColor="text-indigo-900"
        />
        <StatCard
          title="Fleet Size"
          value={stats.totalVehicles}
          subtitle="Trucks + Trailers"
          bgColor="bg-purple-100"
          textColor="text-purple-900"
        />
        <StatCard
          title="Warehouses"
          value={stats.totalWarehouses}
          subtitle="Hubs & Destinations"
          bgColor="bg-amber-100"
          textColor="text-amber-900"
        />
        <StatCard
          title="Delivered Today"
          value={stats.deliveredToday}
          bgColor="bg-emerald-100"
          textColor="text-emerald-900"
        />
      </div>

      {/* Status Overview */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-bold text-slate-800 mb-4">Fleet Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Available Drivers</p>
            <p className="text-2xl font-bold text-green-600">{stats.availableDrivers}</p>
          </div>
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Active Routes</p>
            <p className="text-2xl font-bold text-blue-600">{stats.activeShipments}</p>
          </div>
          <div className="border-l-4 border-red-500 pl-4">
            <p className="text-sm text-gray-600">Urgent Attention</p>
            <p className="text-2xl font-bold text-red-600">{stats.delayedShipments}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Quick Actions</h4>
        <div className="flex flex-wrap gap-2">
          <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition">
            📦 New Shipment
          </button>
          <button className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition">
            👤 Add Driver
          </button>
          <button className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 transition">
            🏢 New Warehouse
          </button>
          <button className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition">
            📊 View Reports
          </button>
        </div>
      </div>
    </div>
  );
}
