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

type ViewMode = 'map' | 'dashboard' | 'drivers' | 'trucks' | 'shipments' | 'notifications';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('map');
  const [showDispatchModal, setShowDispatchModal] = useState(false);

  return (
    <main className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 h-full flex flex-col">
        {/* Top Navigation Bar */}
        <div className="bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-slate-800">Mindanao Logistics Dashboard</h1>
              <div className="hidden md:flex gap-2">
                <button
                  onClick={() => setViewMode('dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    viewMode === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    viewMode === 'map'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🗺️ Map View
                </button>
                <button
                  onClick={() => setViewMode('shipments')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    viewMode === 'shipments'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📦 Shipments
                </button>
                <button
                  onClick={() => setViewMode('drivers')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    viewMode === 'drivers'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  👤 Drivers
                </button>
                <button
                  onClick={() => setViewMode('trucks')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    viewMode === 'trucks'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🚛 Trucks
                </button>
                <button
                  onClick={() => setViewMode('notifications')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                    viewMode === 'notifications'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  🔔 Alerts
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowDispatchModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-semibold text-sm"
              >
                + New Dispatch
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

