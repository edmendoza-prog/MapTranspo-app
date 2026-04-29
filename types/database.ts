// TypeScript types for all database tables

export type DriverStatus = 'available' | 'assigned' | 'off-duty' | 'on-leave';

export interface Driver {
  id: string;
  name: string;
  license_number: string;
  license_expiry: string;
  phone: string;
  email?: string;
  address?: string;
  status: DriverStatus;
  assigned_truck_id?: string;
  created_at: string;
  updated_at: string;
}

export type RouteStatus = 'planned' | 'active' | 'completed' | 'cancelled';

export interface Route {
  id: string;
  route_name: string;
  origin_warehouse_id: string;
  destination_warehouse_id: string;
  distance_km?: number;
  estimated_duration_hours?: number;
  status: RouteStatus;
  created_at: string;
  updated_at: string;
}

export interface RouteWaypoint {
  id: string;
  route_id: string;
  warehouse_id?: string;
  sequence_order: number;
  estimated_arrival?: string;
  actual_arrival?: string;
  lat: number;
  lng: number;
  waypoint_name?: string;
  created_at: string;
}

export type ShipmentStatus = 'pending' | 'loading' | 'running' | 'delayed' | 'arrived' | 'delivered';
export type ShipmentPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface Shipment {
  id: string;
  shipment_number: string;
  route_id: string;
  driver_id?: string;
  truck_id?: string;
  trailer_id?: string;
  cargo_description?: string;
  cargo_weight_kg?: number;
  cargo_value_php?: number;
  status: ShipmentStatus;
  scheduled_pickup: string;
  actual_pickup?: string;
  scheduled_delivery: string;
  actual_delivery?: string;
  current_lat?: number;
  current_lng?: number;
  last_location_update?: string;
  priority: ShipmentPriority;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  driver?: Driver;
  route?: Route & {
    origin_warehouse?: Warehouse;
    destination_warehouse?: Warehouse;
    waypoints?: RouteWaypoint[];
  };
}

export type NotificationType = 'delay' | 'deviation' | 'check-in' | 'maintenance' | 'arrival' | 'departure' | 'alert';
export type NotificationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface Notification {
  id: string;
  shipment_id?: string;
  driver_id?: string;
  notification_type: NotificationType;
  title: string;
  message: string;
  severity: NotificationSeverity;
  is_read: boolean;
  created_at: string;
}

export interface Warehouse {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  contact: string;
  capacity: number;
  is_main_hub: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Truck {
  id: string;
  plate_id: string;
  vin: string;
  model: string;
  year?: number;
  status: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  last_lat?: number;
  last_lng?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Trailer {
  id: string;
  plate_id: string;
  vin: string;
  model: string;
  year?: number;
  capacity_tons?: number;
  status: string;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  last_lat?: number;
  last_lng?: number;
  created_at?: string;
  updated_at?: string;
}

export type MaintenanceStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';

export interface MaintenanceLog {
  id: string;
  truck_id?: string;
  trailer_id?: string;
  maintenance_type: string;
  description?: string;
  cost_php?: number;
  scheduled_date?: string;
  completed_date?: string;
  status: MaintenanceStatus;
  next_maintenance_date?: string;
  created_at: string;
  updated_at: string;
}
