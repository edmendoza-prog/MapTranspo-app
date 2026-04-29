'use client';

import { useState } from 'react';

interface WarehouseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
}

export default function WarehouseForm({
  isOpen,
  onClose,
  initialLat,
  initialLng,
}: WarehouseFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    lat: initialLat?.toString() || '',
    lng: initialLng?.toString() || '',
    contact: '',
    capacity: '100',
    is_main_hub: false,
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/warehouses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          address: formData.address,
          lat: parseFloat(formData.lat),
          lng: parseFloat(formData.lng),
          contact: formData.contact || 'N/A',
          capacity: parseInt(formData.capacity) || 100,
          is_main_hub: formData.is_main_hub,
        }),
      });

      if (response.ok) {
        onClose();
        setFormData({
          name: '',
          address: '',
          lat: '',
          lng: '',
          contact: '',
          capacity: '100',
          is_main_hub: false,
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating warehouse:', error);
      alert('Failed to create warehouse');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Add New Hub/Warehouse</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Davao Main Hub"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Address <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Full address"
              className="w-full border border-gray-300 rounded px-3 py-2"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Latitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.lat}
                onChange={(e) => setFormData({ ...formData, lat: e.target.value })}
                placeholder="7.0731"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Longitude <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                required
                value={formData.lng}
                onChange={(e) => setFormData({ ...formData, lng: e.target.value })}
                placeholder="125.6128"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </div>

          <p className="text-xs text-gray-500">
            💡 Tip: Click on the map to automatically fill coordinates
          </p>

          <div>
            <label className="block text-sm font-medium mb-1">Contact Number</label>
            <input
              type="tel"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="+63-XXX-XXX-XXXX"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Capacity (units)
            </label>
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              placeholder="100"
              className="w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_main_hub"
              checked={formData.is_main_hub}
              onChange={(e) =>
                setFormData({ ...formData, is_main_hub: e.target.checked })
              }
              className="w-4 h-4"
            />
            <label htmlFor="is_main_hub" className="text-sm font-medium cursor-pointer">
              Mark as Main Hub
            </label>
          </div>
          <p className="text-xs text-gray-500 ml-6">
            Main hubs are displayed prominently on the map with special styling
          </p>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Warehouse'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded font-semibold hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
