'use client';

import { useState } from 'react';
import MapWrapper from '@/components/MapWrapper';
import Sidebar from '@/components/Sidebar';
import DashboardSummary from '@/components/DashboardSummary';
import DriverManagement from '@/components/DriverManagement';
import TruckManagement from '@/components/TruckManagement';
import ShipmentTracking from '@/components/ShipmentTracking';
import NotificationsPanel from '@/components/NotificationsPanel';
import DispatchModal from '@/components/DispatchModal';
import { LayoutDashboard, Map, Package, User, Truck, Bell, Plus, LogOut } from 'lucide-react';
import { supabase } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';

type ViewMode = 'map' | 'dashboard' | 'drivers' | 'trucks' | 'shipments' | 'notifications';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <main className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold text-gray-900">Mindanao Logistics Dashboard</h1>
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                    viewMode === 'dashboard'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard</span>
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                    viewMode === 'map'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Map size={16} />
                  <span>Map View</span>
                </button>
                <button
                  onClick={() => setViewMode('shipments')}
                  className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                    viewMode === 'shipments'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Package size={16} />
                  <span>Shipments</span>
                </button>
                <button
                  onClick={() => setViewMode('drivers')}
                  className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                    viewMode === 'drivers'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User size={16} />
                  <span>Drivers</span>
                </button>
                <button
                  onClick={() => setViewMode('trucks')}
                  className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                    viewMode === 'trucks'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Truck size={16} />
                  <span>Trucks</span>
                </button>
                <button
                  onClick={() => setViewMode('notifications')}
                  className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-2 ${
                    viewMode === 'notifications'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Bell size={16} />
                  <span>Alerts</span>
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDispatchModal(true)}
                className="px-4 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition flex items-center gap-2"
              >
                <Plus size={16} />
                <span>New Dispatch</span>
              </button>
              <button
                onClick={handleSignOut}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-100 transition flex items-center gap-2"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {viewMode === 'map' && (
            <div className="h-full relative z-0">
              <MapWrapper />
            </div>
          )}

          {viewMode === 'dashboard' && (
            <div className="h-full overflow-y-auto p-6">
              <DashboardSummary />
            </div>
          )}

          {viewMode === 'drivers' && (
            <div className="h-full overflow-y-auto">
              <DriverManagement />
            </div>
          )}

          {viewMode === 'trucks' && (
            <div className="h-full overflow-y-auto">
              <TruckManagement />
            </div>
          )}

          {viewMode === 'shipments' && (
            <div className="h-full overflow-y-auto">
              <ShipmentTracking />
            </div>
          )}

          {viewMode === 'notifications' && (
            <div className="h-full overflow-y-auto p-6">
              <NotificationsPanel />
            </div>
          )}
        </div>
      </div>

      {/* Dispatch Modal */}
      <DispatchModal isOpen={showDispatchModal} onClose={() => setShowDispatchModal(false)} />
    </main>
  );
}

