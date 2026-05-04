'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase/client';
import type { Driver, Truck, Trailer, Warehouse, Route } from '@/types/database';

interface DispatchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DispatchModal({ isOpen, onClose }: DispatchModalProps) {
  const [step, setStep] = useState(1); // 1: Route, 2: Assignment, 3: Cargo Details
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [trailers, setTrailers] = useState<Trailer[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    // Route selection or creation
    route_id: '',
    new_route_name: '',
    origin_warehouse_id: '',
    destination_warehouse_id: '',
    
    // Assignment
    driver_id: '',
    truck_id: '',
    trailer_id: '',
    
    // Shipment details
    shipment_number: `SHP-${Date.now()}`,
    cargo_description: '',
    cargo_weight_kg: '',
    cargo_value_php: '',
    scheduled_pickup: '',
    scheduled_delivery: '',
    priority: 'normal',
    notes: '',
  });

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [driversRes, trucksRes, trailersRes, warehousesRes, routesRes] = await Promise.all([
        supabase.from('drivers').select('*').eq('status', 'available'),
        supabase.from('trucks').select('*').eq('status', 'available'),
        supabase.from('trailers').select('*').eq('status', 'available'),
        supabase.from('warehouses').select('*').order('is_main_hub', { ascending: false }),
        supabase.from('routes').select('*, origin_warehouse:warehouses!routes_origin_warehouse_id_fkey(name), destination_warehouse:warehouses!routes_destination_warehouse_id_fkey(name)'),
      ]);

      if (driversRes.data) setDrivers(driversRes.data);
      if (trucksRes.data) setTrucks(trucksRes.data);
      if (trailersRes.data) setTrailers(trailersRes.data);
      if (warehousesRes.data) setWarehouses(warehousesRes.data);
      if (routesRes.data) setRoutes(routesRes.data);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      let routeId = formData.route_id;

      // Create new route if needed
      if (!routeId && formData.new_route_name) {
        const routeResponse = await fetch('/api/routes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            route_name: formData.new_route_name,
            origin_warehouse_id: formData.origin_warehouse_id,
            destination_warehouse_id: formData.destination_warehouse_id,
          }),
        });
        if (!routeResponse.ok) {
          throw new Error(`Failed to create route: ${routeResponse.status}`);
        }
        const routeResult = await routeResponse.json();
        if (routeResult.success && routeResult.data) {
          routeId = routeResult.data[0].id;
        }
      }

      // Create shipment
      const shipmentResponse = await fetch('/api/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shipment_number: formData.shipment_number,
          route_id: routeId,
          driver_id: formData.driver_id || null,
          truck_id: formData.truck_id || null,
          trailer_id: formData.trailer_id || null,
          cargo_description: formData.cargo_description,
          cargo_weight_kg: formData.cargo_weight_kg ? parseFloat(formData.cargo_weight_kg) : null,
          cargo_value_php: formData.cargo_value_php ? parseFloat(formData.cargo_value_php) : null,
          scheduled_pickup: formData.scheduled_pickup,
          scheduled_delivery: formData.scheduled_delivery,
          priority: formData.priority,
          notes: formData.notes,
        }),
      });

      if (shipmentResponse.ok) {
        onClose();
        // Reset form
        setStep(1);
        setFormData({
          route_id: '',
          new_route_name: '',
          origin_warehouse_id: '',
          destination_warehouse_id: '',
          driver_id: '',
          truck_id: '',
          trailer_id: '',
          shipment_number: `SHP-${Date.now()}`,
          cargo_description: '',
          cargo_weight_kg: '',
          cargo_value_php: '',
          scheduled_pickup: '',
          scheduled_delivery: '',
          priority: 'normal',
          notes: '',
        });
      }
    } catch (error) {
      console.error('Error creating shipment:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-slate-800">Dispatch New Shipment</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mt-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'
                  }`}
                >
                  {s}
                </div>
                {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-blue-600' : 'bg-gray-300'}`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Route</span>
            <span>Assignment</span>
            <span>Cargo Details</span>
          </div>
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Select or Create Route</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Existing Route</label>
                <select
                  value={formData.route_id}
                  onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Create New Route</option>
                  {routes.map((route: any) => (
                    <option key={route.id} value={route.id}>
                      {route.route_name} ({route.origin_warehouse?.name} → {route.destination_warehouse?.name})
                    </option>
                  ))}
                </select>
              </div>

              {!formData.route_id && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Route Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.new_route_name}
                      onChange={(e) => setFormData({ ...formData, new_route_name: e.target.value })}
                      placeholder="e.g., Davao to Cagayan Route"
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Origin Warehouse *</label>
                    <select
                      required
                      value={formData.origin_warehouse_id}
                      onChange={(e) => setFormData({ ...formData, origin_warehouse_id: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Origin</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} {wh.is_main_hub ? '(Main Hub)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Destination Warehouse *</label>
                    <select
                      required
                      value={formData.destination_warehouse_id}
                      onChange={(e) => setFormData({ ...formData, destination_warehouse_id: e.target.value })}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="">Select Destination</option>
                      {warehouses.map((wh) => (
                        <option key={wh.id} value={wh.id}>
                          {wh.name} {wh.is_main_hub ? '(Main Hub)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Assign Driver & Vehicle</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Driver</label>
                <select
                  value={formData.driver_id}
                  onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Truck</label>
                <select
                  value={formData.truck_id}
                  onChange={(e) => setFormData({ ...formData, truck_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">Select Truck</option>
                  {trucks.map((truck) => (
                    <option key={truck.id} value={truck.id}>
                      {truck.plate_id} ({truck.status})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Trailer (Optional)</label>
                <select
                  value={formData.trailer_id}
                  onChange={(e) => setFormData({ ...formData, trailer_id: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="">No Trailer</option>
                  {trailers.map((trailer) => (
                    <option key={trailer.id} value={trailer.id}>
                      {trailer.plate_id} ({trailer.status})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Cargo & Schedule Details</h3>
              
              <div>
                <label className="block text-sm font-medium mb-1">Shipment Number</label>
                <input
                  type="text"
                  value={formData.shipment_number}
                  onChange={(e) => setFormData({ ...formData, shipment_number: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2 bg-gray-50"
                  readOnly
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Cargo Description</label>
                <textarea
                  value={formData.cargo_description}
                  onChange={(e) => setFormData({ ...formData, cargo_description: e.target.value })}
                  placeholder="e.g., Electronics, Food items, Construction materials"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cargo_weight_kg}
                    onChange={(e) => setFormData({ ...formData, cargo_weight_kg: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Value (PHP)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.cargo_value_php}
                    onChange={(e) => setFormData({ ...formData, cargo_value_php: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scheduled Pickup *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_pickup}
                    onChange={(e) => setFormData({ ...formData, scheduled_pickup: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Scheduled Delivery *</label>
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduled_delivery}
                    onChange={(e) => setFormData({ ...formData, scheduled_delivery: e.target.value })}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes or special instructions"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-between">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded font-semibold hover:bg-gray-400"
            >
              Previous
            </button>
          )}
          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="ml-auto px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700"
              disabled={
                step === 1 && !formData.route_id && (!formData.new_route_name || !formData.origin_warehouse_id || !formData.destination_warehouse_id)
              }
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading || !formData.scheduled_pickup || !formData.scheduled_delivery}
              className="ml-auto px-6 py-2 bg-green-600 text-white rounded font-semibold hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Creating...' : 'Create Shipment'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
