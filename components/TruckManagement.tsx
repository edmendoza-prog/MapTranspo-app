'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Truck } from '@/types/database';

export default function TruckManagement() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTruck, setEditingTruck] = useState<Truck | null>(null);
  const [formData, setFormData] = useState({
    plate_id: '',
    vin: '',
    model: '',
    year: '',
    status: 'available',
  });

  useEffect(() => {
    fetchTrucks();

    // Subscribe to truck changes
    const channel = supabase
      .channel('truck-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trucks' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTrucks((prev) => [payload.new as Truck, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTrucks((prev) =>
            prev.map((t) => (t.id === (payload.new as any).id ? (payload.new as Truck) : t))
          );
        } else if (payload.eventType === 'DELETE') {
          setTrucks((prev) => prev.filter((t) => t.id !== (payload.old as any).id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTrucks = async () => {
    try {
      const { data, error } = await supabase
        .from('trucks')
        .select('*')
        .order('plate_id', { ascending: true });

      if (error) throw error;
      if (data) setTrucks(data);
    } catch (error) {
      console.error('Error fetching trucks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/trucks', {
        method: editingTruck ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          editingTruck
            ? { id: editingTruck.id, ...formData }
            : { ...formData, year: formData.year ? parseInt(formData.year) : null }
        ),
      });

      if (response.ok) {
        setShowAddModal(false);
        setEditingTruck(null);
        setFormData({
          plate_id: '',
          vin: '',
          model: '',
          year: '',
          status: 'available',
        });
      }
    } catch (error) {
      console.error('Error saving truck:', error);
    }
  };

  const handleEdit = (truck: Truck) => {
    setEditingTruck(truck);
    setFormData({
      plate_id: truck.plate_id,
      vin: truck.vin,
      model: truck.model,
      year: truck.year?.toString() || '',
      status: truck.status,
    });
    setShowAddModal(true);
  };

  const handleDelete = async (truckId: string) => {
    if (!confirm('Are you sure you want to delete this truck?')) return;

    try {
      const response = await fetch(`/api/trucks?id=${truckId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete truck');
      }
    } catch (error) {
      console.error('Error deleting truck:', error);
      alert('Failed to delete truck. It may be assigned to a driver or shipment.');
    }
  };

  const handleStatusChange = async (truckId: string, newStatus: string) => {
    try {
      await fetch('/api/trucks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: truckId, status: newStatus }),
      });
    } catch (error) {
      console.error('Error updating truck status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in-use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'out-of-service':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading trucks...</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Truck Fleet Management</h2>
          <p className="text-gray-600 mt-1">Manage your semi-trailer truck fleet</p>
        </div>
        <button
          onClick={() => {
            setEditingTruck(null);
            setFormData({
              plate_id: '',
              vin: '',
              model: '',
              year: '',
              status: 'available',
            });
            setShowAddModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          + Add Truck
        </button>
      </div>

      {/* Trucks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck) => (
          <div key={truck.id} className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{truck.plate_id}</h3>
                <p className="text-sm text-gray-600">{truck.model}</p>
              </div>
              <select
                value={truck.status}
                onChange={(e) => handleStatusChange(truck.id, e.target.value)}
                className={`text-xs px-2 py-1 rounded font-medium ${getStatusColor(truck.status)}`}
              >
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
              </select>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">VIN:</span>
                <span className="text-gray-700 font-mono">{truck.vin.substring(0, 12)}...</span>
              </div>
              {truck.year && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Year:</span>
                  <span className="text-gray-700">{truck.year}</span>
                </div>
              )}
              {truck.last_maintenance_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Maintenance:</span>
                  <span className="text-gray-700">
                    {new Date(truck.last_maintenance_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(truck)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm"
              >
                Edit
              </button>
              <button
                onClick={() => handleDelete(truck.id)}
                className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded hover:bg-red-200 transition text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {trucks.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No trucks found. Add your first truck to get started.
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {editingTruck ? 'Edit Truck' : 'Add New Truck'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plate Number *
                </label>
                <input
                  type="text"
                  required
                  disabled={!!editingTruck}
                  value={formData.plate_id}
                  onChange={(e) => setFormData({ ...formData, plate_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ABC-1234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">VIN *</label>
                <input
                  type="text"
                  required
                  disabled={!!editingTruck}
                  value={formData.vin}
                  onChange={(e) => setFormData({ ...formData, vin: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="JNRCS1E29U0000001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model *</label>
                <input
                  type="text"
                  required
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Isuzu Giga 10-Wheeler"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="2023"
                  min="1990"
                  max="2030"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="available">Available</option>
                  <option value="in-use">In Use</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="out-of-service">Out of Service</option>
                </select>
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingTruck(null);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {editingTruck ? 'Update' : 'Add'} Truck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
