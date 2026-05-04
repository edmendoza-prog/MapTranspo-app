'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Truck } from '@/types/database';
import { Truck as TruckIcon, Plus, Edit2, Trash2, Hash, Calendar, Wrench } from 'lucide-react';

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
      // Optimistic update
      setTrucks(prev => prev.map(t => 
        t.id === truckId ? { ...t, status: newStatus as any } : t
      ));

      const response = await fetch('/api/trucks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: truckId, status: newStatus }),
      });

      if (!response.ok) {
        // Revert on error
        fetchTrucks();
      }
    } catch (error) {
      console.error('Error updating truck status:', error);
      // Revert on error
      fetchTrucks();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border border-green-200';
      case 'in-use':
        return 'bg-blue-100 text-blue-800 border border-blue-200';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
      case 'out-of-service':
        return 'bg-red-100 text-red-800 border border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600 text-sm">Loading trucks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Truck Fleet Management</h2>
          <p className="text-gray-600 mt-1 flex items-center gap-2">
            <TruckIcon size={16} />
            <span>Manage your semi-trailer truck fleet</span>
          </p>
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
          className="bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 transition font-medium flex items-center gap-2"
        >
          <Plus size={18} />
          <span>Add Truck</span>
        </button>
      </div>

      {/* Trucks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {trucks.map((truck) => (
          <div key={truck.id} className="bg-white rounded border border-gray-200 p-4 hover:border-gray-300 transition">
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-start gap-2">
                <TruckIcon size={20} className="text-gray-400 mt-0.5" />
                <div>
                  <h3 className="text-base font-semibold text-gray-900">{truck.plate_id}</h3>
                  <p className="text-sm text-gray-600">{truck.model}</p>
                </div>
              </div>
              <select
                value={truck.status}
                onChange={(e) => handleStatusChange(truck.id, e.target.value)}
                className={`text-xs px-2 py-1 rounded font-medium cursor-pointer outline-none ${getStatusColor(truck.status)}`}
              >
                <option value="available">Available</option>
                <option value="in-use">In Use</option>
                <option value="maintenance">Maintenance</option>
                <option value="out-of-service">Out of Service</option>
              </select>
            </div>

            <div className="space-y-2 mb-4 bg-gray-50 rounded p-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 flex items-center gap-1">
                  <Hash size={14} /> VIN:
                </span>
                <span className="text-gray-900 font-mono text-xs">{truck.vin.substring(0, 12)}...</span>
              </div>
              {truck.year && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Calendar size={14} /> Year:
                  </span>
                  <span className="text-gray-900">{truck.year}</span>
                </div>
              )}
              {truck.last_maintenance_date && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-1">
                    <Wrench size={14} /> Last Maint:
                  </span>
                  <span className="text-gray-900 text-xs">
                    {new Date(truck.last_maintenance_date).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleEdit(truck)}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded hover:bg-gray-200 transition text-sm font-medium flex items-center justify-center gap-1.5"
              >
                <Edit2 size={14} />
                <span>Edit</span>
              </button>
              <button
                onClick={() => handleDelete(truck.id)}
                className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 transition text-sm font-medium flex items-center justify-center gap-1.5 border border-red-200"
              >
                <Trash2 size={14} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {trucks.length === 0 && (
        <div className="text-center py-12 bg-white rounded border border-gray-200">
          <TruckIcon size={48} className="mx-auto mb-3 text-gray-300" />
          <div className="text-gray-500 font-medium">No trucks found</div>
          <div className="text-gray-400 text-sm mt-1">Add your first truck to get started</div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 flex items-center gap-2">
              {editingTruck ? <><Edit2 size={20} /> <span>Edit Truck</span></> : <><Plus size={20} /> <span>Add New Truck</span></>}
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
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-gray-900 transition disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-gray-900 transition font-mono disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-gray-900 transition"
                  placeholder="Isuzu Giga 10-Wheeler"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-gray-900 transition"
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
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-gray-900 transition"
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
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-800 font-medium transition flex items-center justify-center gap-2"
                >
                  {editingTruck ? <><Edit2 size={16} /> <span>Update</span></> : <><Plus size={16} /> <span>Add</span></>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
