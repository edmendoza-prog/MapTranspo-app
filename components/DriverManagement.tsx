'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Driver, Truck } from '@/types/database';

export default function DriverManagement() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_expiry: '',
    phone: '',
    email: '',
    address: '',
  });

  useEffect(() => {
    fetchData();

    // Subscribe to driver changes
    const channel = supabase
      .channel('driver-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'drivers' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setDrivers((prev) => [payload.new as Driver, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setDrivers((prev) =>
            prev.map((d) => (d.id === (payload.new as any).id ? (payload.new as Driver) : d))
          );
        } else if (payload.eventType === 'DELETE') {
          setDrivers((prev) => prev.filter((d) => d.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [driversRes, trucksRes] = await Promise.all([
        supabase.from('drivers').select('*').order('name', { ascending: true }),
        supabase.from('trucks').select('*').order('plate_id', { ascending: true }),
      ]);

      if (driversRes.data) setDrivers(driversRes.data);
      if (trucksRes.data) setTrucks(trucksRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/drivers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowAddModal(false);
        setFormData({
          name: '',
          license_number: '',
          license_expiry: '',
          phone: '',
          email: '',
          address: '',
        });
      }
    } catch (error) {
      console.error('Error adding driver:', error);
    }
  };

  const handleStatusChange = async (driverId: string, newStatus: string) => {
    try {
      await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driverId, status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating driver status:', error);
    }
  };

  const handleAssignTruck = async (driverId: string, truckId: string) => {
    try {
      await fetch('/api/drivers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: driverId, assigned_truck_id: truckId || null }),
      });
    } catch (error) {
      console.error('Error assigning truck:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'assigned':
        return 'bg-blue-100 text-blue-800';
      case 'off-duty':
        return 'bg-gray-100 text-gray-800';
      case 'on-leave':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="p-6">Loading drivers...</div>;
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Driver Management</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-semibold"
        >
          + Add Driver
        </button>
      </div>

      <div className="grid gap-4">
        {drivers.map((driver) => (
          <div
            key={driver.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">{driver.name}</h3>
                <div className="mt-2 space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">License:</span> {driver.license_number} (Exp:{' '}
                    {new Date(driver.license_expiry).toLocaleDateString()})
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span> {driver.phone}
                  </p>
                  {driver.email && (
                    <p>
                      <span className="font-medium">Email:</span> {driver.email}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(driver.status)}`}>
                  {driver.status.toUpperCase()}
                </span>
                <select
                  value={driver.status}
                  onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                  className="text-xs border border-gray-300 rounded px-2 py-1"
                >
                  <option value="available">Available</option>
                  <option value="assigned">Assigned</option>
                  <option value="off-duty">Off Duty</option>
                  <option value="on-leave">On Leave</option>
                </select>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <label className="text-xs font-medium text-gray-600 block mb-1">Assigned Truck:</label>
              <select
                value={driver.assigned_truck_id || ''}
                onChange={(e) => handleAssignTruck(driver.id, e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-1.5"
              >
                <option value="">Not Assigned</option>
                {trucks.map((truck) => (
                  <option key={truck.id} value={truck.id}>
                    {truck.plate_id} ({truck.status})
                  </option>
                ))}
              </select>
            </div>
          </div>
        ))}

        {drivers.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No drivers registered yet. Click "Add Driver" to get started.
          </div>
        )}
      </div>

      {/* Add Driver Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Add New Driver</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Number *</label>
                <input
                  type="text"
                  required
                  value={formData.license_number}
                  onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">License Expiry *</label>
                <input
                  type="date"
                  required
                  value={formData.license_expiry}
                  onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone *</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700"
                >
                  Add Driver
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
