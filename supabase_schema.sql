-- Mindanao Logistics Management Dashboard - Complete Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create warehouses table first (referenced by routes and route_waypoints)
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  contact_phone VARCHAR(50),
  capacity_sqm DECIMAL(10, 2),
  is_main_hub BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trucks table (referenced by drivers and shipments)
CREATE TABLE IF NOT EXISTS trucks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_id VARCHAR(50) UNIQUE NOT NULL,
  vin VARCHAR(100) UNIQUE NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INT,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in-use', 'maintenance', 'out-of-service')),
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  last_lat DECIMAL(10, 7),
  last_lng DECIMAL(10, 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create trailers table (referenced by shipments)
CREATE TABLE IF NOT EXISTS trailers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  plate_id VARCHAR(50) UNIQUE NOT NULL,
  vin VARCHAR(100) UNIQUE NOT NULL,
  model VARCHAR(255) NOT NULL,
  year INT,
  capacity_tons DECIMAL(10, 2),
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'in-use', 'maintenance', 'out-of-service')),
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  last_lat DECIMAL(10, 7),
  last_lng DECIMAL(10, 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create markers table (for legacy map markers)
CREATE TABLE IF NOT EXISTS markers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  label VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create drivers table
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  license_number VARCHAR(100) UNIQUE NOT NULL,
  license_expiry DATE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  address TEXT,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'off-duty', 'on-leave')),
  assigned_truck_id UUID REFERENCES trucks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create routes table
CREATE TABLE IF NOT EXISTS routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_name VARCHAR(255) NOT NULL,
  origin_warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
  destination_warehouse_id UUID REFERENCES warehouses(id) NOT NULL,
  distance_km DECIMAL(10, 2),
  estimated_duration_hours DECIMAL(5, 2),
  status VARCHAR(50) DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create route_waypoints table for intermediate stops
CREATE TABLE IF NOT EXISTS route_waypoints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  route_id UUID REFERENCES routes(id) ON DELETE CASCADE NOT NULL,
  warehouse_id UUID REFERENCES warehouses(id),
  sequence_order INT NOT NULL,
  estimated_arrival TIMESTAMP WITH TIME ZONE,
  actual_arrival TIMESTAMP WITH TIME ZONE,
  lat DECIMAL(10, 7) NOT NULL,
  lng DECIMAL(10, 7) NOT NULL,
  waypoint_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shipments table
CREATE TABLE IF NOT EXISTS shipments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_number VARCHAR(100) UNIQUE NOT NULL,
  route_id UUID REFERENCES routes(id) NOT NULL,
  driver_id UUID REFERENCES drivers(id),
  truck_id UUID REFERENCES trucks(id),
  trailer_id UUID REFERENCES trailers(id),
  cargo_description TEXT,
  cargo_weight_kg DECIMAL(10, 2),
  cargo_value_php DECIMAL(12, 2),
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'loading', 'running', 'delayed', 'arrived', 'delivered')),
  scheduled_pickup TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_pickup TIMESTAMP WITH TIME ZONE,
  scheduled_delivery TIMESTAMP WITH TIME ZONE NOT NULL,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  current_lat DECIMAL(10, 7),
  current_lng DECIMAL(10, 7),
  last_location_update TIMESTAMP WITH TIME ZONE,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
  driver_id UUID REFERENCES drivers(id),
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('delay', 'deviation', 'check-in', 'maintenance', 'arrival', 'departure', 'alert')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create maintenance_logs table for vehicle maintenance tracking
CREATE TABLE IF NOT EXISTS maintenance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  truck_id UUID REFERENCES trucks(id),
  trailer_id UUID REFERENCES trailers(id),
  maintenance_type VARCHAR(100) NOT NULL,
  description TEXT,
  cost_php DECIMAL(10, 2),
  scheduled_date DATE,
  completed_date DATE,
  status VARCHAR(50) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in-progress', 'completed', 'cancelled')),
  next_maintenance_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_warehouses_main_hub ON warehouses(is_main_hub);
CREATE INDEX IF NOT EXISTS idx_trucks_status ON trucks(status);
CREATE INDEX IF NOT EXISTS idx_trailers_status ON trailers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_truck ON drivers(assigned_truck_id);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_driver ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_truck ON shipments(truck_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_waypoints_route ON route_waypoints(route_id, sequence_order);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at columns
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trucks_updated_at BEFORE UPDATE ON trucks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trailers_updated_at BEFORE UPDATE ON trailers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenance_logs_updated_at BEFORE UPDATE ON maintenance_logs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Configure based on your auth requirements
ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucks ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE markers ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_logs ENABLE ROW LEVEL SECURITY;

-- Create permissive policies (adjust based on your authentication needs)
CREATE POLICY "Enable all operations for authenticated users" ON warehouses FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON trucks FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON trailers FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON markers FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON drivers FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON routes FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON route_waypoints FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON shipments FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON notifications FOR ALL USING (true);
CREATE POLICY "Enable all operations for authenticated users" ON maintenance_logs FOR ALL USING (true);

-- Insert sample data for testing

-- Sample warehouses (Mindanao locations)
INSERT INTO warehouses (name, address, lat, lng, contact_phone, capacity_sqm, is_main_hub) VALUES
  ('Davao Main Hub', 'Davao City, Davao del Sur', 7.0731, 125.6128, '+63-82-123-4567', 5000.00, true),
  ('Cagayan de Oro Warehouse', 'Cagayan de Oro City, Misamis Oriental', 8.4542, 124.6319, '+63-88-234-5678', 3000.00, false),
  ('General Santos Distribution Center', 'General Santos City, South Cotabato', 6.1164, 125.1716, '+63-83-345-6789', 2500.00, false),
  ('Butuan Warehouse', 'Butuan City, Agusan del Norte', 8.9475, 125.5406, '+63-85-456-7890', 2000.00, false),
  ('Zamboanga Depot', 'Zamboanga City, Zamboanga del Sur', 6.9214, 122.0790, '+63-62-567-8901', 1800.00, false)
ON CONFLICT DO NOTHING;

-- Sample trucks
INSERT INTO trucks (plate_id, vin, model, year, status, last_lat, last_lng) VALUES
  ('ABC-1234', 'JNRCS1E29U0000001', 'Isuzu Giga 10-Wheeler', 2022, 'available', 7.0731, 125.6128),
  ('DEF-5678', 'JHDH7008S0000002', 'Hino 700 Series', 2023, 'available', 8.4542, 124.6319),
  ('GHI-9012', 'UDCWB4ZF0K0000003', 'UD Trucks Quester', 2021, 'available', 6.1164, 125.1716),
  ('JKL-3456', 'JMFXS72E600000004', 'Mitsubishi Fuso', 2022, 'available', 8.9475, 125.5406),
  ('MNO-7890', 'JNRCS1E29U0000005', 'Isuzu Forward', 2023, 'available', 6.9214, 122.0790)
ON CONFLICT (plate_id) DO NOTHING;

-- Sample trailers
INSERT INTO trailers (plate_id, vin, model, year, capacity_tons, status) VALUES
  ('TRL-001', 'TRL1234567890001', '40ft Container Trailer', 2022, 28.00, 'available'),
  ('TRL-002', 'TRL1234567890002', '40ft Container Trailer', 2023, 28.00, 'available'),
  ('TRL-003', 'TRL1234567890003', '20ft Container Trailer', 2021, 18.00, 'available'),
  ('TRL-004', 'TRL1234567890004', 'Flatbed Trailer', 2022, 25.00, 'available'),
  ('TRL-005', 'TRL1234567890005', '40ft Container Trailer', 2023, 28.00, 'available')
ON CONFLICT (plate_id) DO NOTHING;

-- Sample drivers
INSERT INTO drivers (name, license_number, license_expiry, phone, email, status) VALUES
  ('Juan Dela Cruz', 'DL-2024-001', '2026-12-31', '+63-917-123-4567', 'juan.delacruz@email.com', 'available'),
  ('Maria Santos', 'DL-2024-002', '2027-06-30', '+63-918-234-5678', 'maria.santos@email.com', 'available'),
  ('Pedro Reyes', 'DL-2023-003', '2025-03-15', '+63-919-345-6789', 'pedro.reyes@email.com', 'available'),
  ('Ana Garcia', 'DL-2024-004', '2026-09-20', '+63-920-456-7890', 'ana.garcia@email.com', 'available'),
  ('Carlos Mendoza', 'DL-2024-005', '2027-01-10', '+63-921-567-8901', 'carlos.mendoza@email.com', 'available')
ON CONFLICT (license_number) DO NOTHING;

-- Note: You'll need to insert sample routes and shipments after warehouses and trucks are created
-- Example shipment statuses: pending, loading, running, delayed, arrived, delivered
