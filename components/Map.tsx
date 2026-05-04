'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { supabase } from '@/utils/supabase/client';
import { fetchRoadPath, type RouteCoordinate } from '@/utils/routing';
import L from 'leaflet';
import WarehouseForm from './WarehouseForm';
import type { Shipment, RouteWaypoint } from '@/types/database';

// Fix for default marker icons in Leaflet with Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'running': case 'in transit': return 'background-color: #22c55e;'; // Green
    case 'delayed': return 'background-color: #ef4444;'; // Red
    case 'loading': return 'background-color: #eab308;'; // Yellow
    case 'arrived': case 'delivered': return 'background-color: #3b82f6;'; // Blue
    case 'pending': default: return 'background-color: #6b7280;'; // Gray
  }
};

const createVehicleIcon = (status: string) => {
  return L.divIcon({
    className: 'bg-transparent',
    html: `<div style="${getStatusColor(status)} width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.5);"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

type VehicleMarker = {
  id: number;
  lat: number;
  lng: number;
  name: string;
  status: string;
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

// Component to handle map clicks
function MapEvents({ 
  onMapClick, 
  onWarehouseClick 
}: { 
  onMapClick: (lat: number, lng: number) => void;
  onWarehouseClick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      // Check if Ctrl key is pressed for warehouse creation
      if ((e.originalEvent as MouseEvent).ctrlKey) {
        onWarehouseClick(e.latlng.lat, e.latlng.lng);
      } else {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

export default function Map() {
  const [markers, setMarkers] = useState<VehicleMarker[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [roadPaths, setRoadPaths] = useState<Record<string, RouteCoordinate[]>>({});
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [clickedCoords, setClickedCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch initial markers and subscribe to real-time changes
  useEffect(() => {
    const fetchMarkers = async () => {
      const { data, error } = await supabase.from('markers').select('*');
      if (data) setMarkers(data);
    };

    fetchMarkers();

    // Set up Supabase Realtime subscription
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'markers' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMarkers((prev) => [...prev, payload.new as VehicleMarker]);
          } else if (payload.eventType === 'UPDATE') {
            setMarkers((prev) =>
              prev.map((marker) =>
                marker.id === payload.new.id ? (payload.new as VehicleMarker) : marker
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setMarkers((prev) => prev.filter((marker) => marker.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch warehouses
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const { data, error } = await supabase.from('warehouses').select('*').order('is_main_hub', { ascending: false });
        if (error) {
          console.error('Warehouses error:', error);
        } else if (data) {
          console.log('Warehouses loaded:', data.length);
          setWarehouses(data);
        }
      } catch (err) {
        console.error('Warehouse fetch error:', err);
      }
    };

    fetchWarehouses();

    // Subscribe to warehouse changes
    const warehouseChannel = supabase
      .channel('warehouse-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'warehouses' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setWarehouses((prev) => [...prev, payload.new as Warehouse]);
          } else if (payload.eventType === 'UPDATE') {
            setWarehouses((prev) =>
              prev.map((wh) => (wh.id === (payload.new as any).id ? (payload.new as Warehouse) : wh))
            );
          } else if (payload.eventType === 'DELETE') {
            setWarehouses((prev) => prev.filter((wh) => wh.id !== (payload.old as any).id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(warehouseChannel);
    };
  }, []);

  // Fetch shipments with routes
  useEffect(() => {
    const fetchShipments = async () => {
      try {
        const response = await fetch('/api/shipments');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result.success) {
          setShipments(result.data);
          
          // Fetch road paths for each shipment route
          const newRoadPaths: Record<string, RouteCoordinate[]> = {};
          
          for (const shipment of result.data) {
            if (
              shipment.route?.origin_warehouse &&
              shipment.route?.destination_warehouse &&
              ['loading', 'running', 'delayed'].includes(shipment.status)
            ) {
              const waypoints: RouteCoordinate[] = [
                [shipment.route.origin_warehouse.lat, shipment.route.origin_warehouse.lng],
              ];

              // Add route waypoints if available
              if (shipment.route.waypoints && shipment.route.waypoints.length > 0) {
                shipment.route.waypoints
                  .sort((a: RouteWaypoint, b: RouteWaypoint) => a.sequence_order - b.sequence_order)
                  .forEach((wp: RouteWaypoint) => {
                    waypoints.push([wp.lat, wp.lng]);
                  });
              }

              waypoints.push([
                shipment.route.destination_warehouse.lat,
                shipment.route.destination_warehouse.lng,
              ]);

              // Fetch actual road path
              const roadPath = await fetchRoadPath(waypoints);
              if (roadPath) {
                newRoadPaths[shipment.id] = roadPath;
              }
              
              // Add small delay to avoid rate limiting
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          setRoadPaths(newRoadPaths);
        }
      } catch (error) {
        console.error('Error fetching shipments:', error);
      }
    };

    fetchShipments();

    // Subscribe to shipment changes
    const shipmentChannel = supabase
      .channel('shipment-map-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shipments' },
        () => {
          fetchShipments(); // Refetch to get joined data
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shipmentChannel);
    };
  }, []);

  const handleAddMarker = async (lat: number, lng: number) => {
    const statuses = ['Pending', 'Loading', 'In Transit', 'Arrived', 'Delivered', 'Running', 'Delayed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const type = Math.random() > 0.5 ? 'Truck' : 'Trailer';
    
    try {
      const response = await fetch('/api/markers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, name: `${type} ${Math.floor(Math.random() * 1000)}`, status: randomStatus }),
      });
      if (!response.ok) {
        console.error('Failed to create marker:', response.status);
      }
    } catch (error) {
      console.error('Error creating marker:', error);
    }
  };

  const handleWarehouseClick = (lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
    setShowWarehouseForm(true);
  };

  const getRouteColor = (status: string) => {
    switch (status) {
      case 'running':
        return '#22c55e'; // Green
      case 'delayed':
        return '#ef4444'; // Red
      case 'loading':
        return '#eab308'; // Yellow
      case 'arrived':
      case 'delivered':
        return '#3b82f6'; // Blue
      case 'pending':
      default:
        return '#9ca3af'; // Gray
    }
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer
        center={[7.95, 125.0]} // Center on Mindanao, Philippines
        zoom={7}
        className="h-[100vh] w-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Warehouse Network */}
        {warehouses && warehouses.length > 0 ? (
          warehouses.map((warehouse) => (
          <Marker
            key={warehouse.id}
            position={[warehouse.lat, warehouse.lng]}
            icon={warehouse.is_main_hub ? L.divIcon({
              className: 'bg-transparent',
              html: `<div style="background-color: #8b0000; width: 32px; height: 32px; display: flex; align-items: center; justify-center; border-radius: 6px; border: 3px solid gold; box-shadow: 0 0 10px rgba(139,0,0,0.8);"><svg fill="gold" viewBox="0 0 24 24" style="width: 18px;"><path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/></svg></div>`,
              iconSize: [32, 32],
              iconAnchor: [16, 16],
            }) : L.divIcon({
              className: 'bg-transparent',
              html: `<div style="background-color: #4b5563; width: 24px; height: 24px; display: flex; align-items: center; justify-center; border-radius: 4px; border: 2px solid #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.5);"><svg fill="white" viewBox="0 0 24 24" style="width: 14px;"><path d="M12 2L2 12h3v8h6v-6h2v6h6v-8h3L12 2z"/></svg></div>`,
              iconSize: [24, 24],
              iconAnchor: [12, 12],
            })}
          >
            <Popup>
              <div className={`font-semibold ${warehouse.is_main_hub ? 'text-red-900' : 'text-slate-700'}`}>
                {warehouse.name}
                {warehouse.is_main_hub && <span className="ml-2 text-xs bg-yellow-300 px-2 py-1 rounded">MAIN HUB</span>}
              </div>
              <div className="text-xs text-gray-600 mt-1">{warehouse.address}</div>
              <div className="text-xs text-gray-600">Capacity: {warehouse.capacity} units</div>
              <div className="text-xs text-gray-600">{warehouse.contact}</div>
            </Popup>
          </Marker>
          ))
        ) : null}
        
        {/* Route Polylines for Active Shipments */}
        {shipments
          .filter((s: any) => ['loading', 'running', 'delayed'].includes(s.status))
          .map((shipment: any) => {
            // Use fetched road path if available, otherwise fallback to straight lines
            const roadPath = roadPaths[shipment.id];
            
            if (roadPath && roadPath.length > 0) {
              return (
                <Polyline
                  key={shipment.id}
                  positions={roadPath}
                  color={getRouteColor(shipment.status)}
                  weight={4}
                  opacity={0.8}
                  dashArray={shipment.status === 'delayed' ? '10, 10' : undefined}
                >
                  <Popup>
                    <div className="font-semibold">{shipment.shipment_number}</div>
                    <div className="text-xs text-gray-600">Status: {shipment.status}</div>
                    {shipment.route?.origin_warehouse && shipment.route?.destination_warehouse && (
                      <div className="text-xs text-gray-600">
                        {shipment.route.origin_warehouse.name} → {shipment.route.destination_warehouse.name}
                      </div>
                    )}
                  </Popup>
                </Polyline>
              );
            }
            
            // Fallback to straight lines if road path not available
            if (
              shipment.route?.origin_warehouse &&
              shipment.route?.destination_warehouse
            ) {
              const positions: [number, number][] = [
                [shipment.route.origin_warehouse.lat, shipment.route.origin_warehouse.lng],
              ];

              // Add waypoints if available
              if (shipment.route.waypoints && shipment.route.waypoints.length > 0) {
                shipment.route.waypoints
                  .sort((a: RouteWaypoint, b: RouteWaypoint) => a.sequence_order - b.sequence_order)
                  .forEach((wp: RouteWaypoint) => {
                    positions.push([wp.lat, wp.lng]);
                  });
              }

              positions.push([
                shipment.route.destination_warehouse.lat,
                shipment.route.destination_warehouse.lng,
              ]);

              return (
                <Polyline
                  key={shipment.id}
                  positions={positions}
                  color={getRouteColor(shipment.status)}
                  weight={3}
                  opacity={0.7}
                  dashArray={shipment.status === 'delayed' ? '10, 10' : undefined}
                >
                  <Popup>
                    <div className="font-semibold">{shipment.shipment_number}</div>
                    <div className="text-xs text-gray-600">Status: {shipment.status}</div>
                    <div className="text-xs text-gray-600">
                      {shipment.route.origin_warehouse.name} → {shipment.route.destination_warehouse.name}
                    </div>
                  </Popup>
                </Polyline>
              );
            }
            return null;
          })}

        {/* Dynamic Fleet Markers */}
        {markers.map((marker) => (
          <Marker 
            key={marker.id} 
            position={[marker.lat, marker.lng]}
            icon={createVehicleIcon(marker.status)}
          >
            <Popup>
              <div className="font-semibold">{marker.name}</div>
              <div className="text-sm text-gray-500 font-medium mt-1">Status: {marker.status}</div>
            </Popup>
          </Marker>
        ))}

        <MapEvents onMapClick={handleAddMarker} onWarehouseClick={handleWarehouseClick} />
      </MapContainer>

      {/* Instructions Overlay */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white bg-opacity-90 p-3 rounded-lg shadow-lg text-xs">
        <p className="font-semibold mb-1">Map Controls:</p>
        <p>• Click: Add test vehicle</p>
        <p>• Ctrl + Click: Create warehouse/hub</p>
      </div>

      {/* Warehouse Creation Form */}
      <WarehouseForm
        isOpen={showWarehouseForm}
        onClose={() => {
          setShowWarehouseForm(false);
          setClickedCoords(null);
        }}
        initialLat={clickedCoords?.lat}
        initialLng={clickedCoords?.lng}
      />
    </div>
  );
}