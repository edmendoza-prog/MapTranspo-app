# API Reference

This document describes all available API endpoints in the Mindanao Logistics Dashboard.

## Base URL
```
http://localhost:3000/api
```

---

## 🚚 Drivers API

### GET /api/drivers
Get all drivers

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Juan Dela Cruz",
      "license_number": "DL-2024-001",
      "license_expiry": "2026-12-31",
      "phone": "+63-917-123-4567",
      "email": "juan@email.com",
      "address": "Davao City",
      "status": "available",
      "assigned_truck_id": "uuid",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/drivers
Create new driver

**Request Body:**
```json
{
  "name": "Juan Dela Cruz",
  "license_number": "DL-2024-001",
  "license_expiry": "2026-12-31",
  "phone": "+63-917-123-4567",
  "email": "juan@email.com",
  "address": "Davao City",
  "status": "available"
}
```

**Required Fields:** name, license_number, license_expiry, phone

### PATCH /api/drivers
Update driver

**Request Body:**
```json
{
  "id": "uuid",
  "status": "assigned",
  "assigned_truck_id": "uuid"
}
```

### DELETE /api/drivers?id={uuid}
Delete driver

---

## 📦 Shipments API

### GET /api/shipments
Get all shipments with full details (joined with driver, truck, route data)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "shipment_number": "SHP-1234567890",
      "status": "running",
      "cargo_description": "Electronics",
      "cargo_weight_kg": 5000,
      "priority": "high",
      "scheduled_pickup": "2024-01-01T08:00:00Z",
      "scheduled_delivery": "2024-01-02T16:00:00Z",
      "driver": {
        "id": "uuid",
        "name": "Juan Dela Cruz"
      },
      "truck": {
        "id": "uuid",
        "plate_id": "ABC-1234"
      },
      "route": {
        "id": "uuid",
        "route_name": "Davao to Cagayan",
        "origin_warehouse": {
          "name": "Davao Hub",
          "lat": 7.0731,
          "lng": 125.6128
        },
        "destination_warehouse": {
          "name": "Cagayan Hub",
          "lat": 8.4542,
          "lng": 124.6319
        }
      }
    }
  ]
}
```

### POST /api/shipments
Create new shipment

**Request Body:**
```json
{
  "shipment_number": "SHP-1234567890",
  "route_id": "uuid",
  "driver_id": "uuid",
  "truck_id": "uuid",
  "trailer_id": "uuid",
  "cargo_description": "Electronics",
  "cargo_weight_kg": 5000,
  "cargo_value_php": 1000000,
  "scheduled_pickup": "2024-01-01T08:00:00Z",
  "scheduled_delivery": "2024-01-02T16:00:00Z",
  "priority": "high",
  "notes": "Handle with care"
}
```

**Required Fields:** shipment_number, route_id, scheduled_pickup, scheduled_delivery

### PATCH /api/shipments
Update shipment status or details

**Request Body:**
```json
{
  "id": "uuid",
  "status": "delayed",
  "current_lat": 7.5,
  "current_lng": 125.5,
  "notes": "Traffic delay on highway"
}
```

---

## 🗺️ Routes API

### GET /api/routes
Get all routes with waypoints

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "route_name": "Davao to Cagayan Route",
      "status": "active",
      "distance_km": 250,
      "estimated_duration_hours": 6,
      "origin_warehouse": {
        "id": "uuid",
        "name": "Davao Hub",
        "lat": 7.0731,
        "lng": 125.6128
      },
      "destination_warehouse": {
        "id": "uuid",
        "name": "Cagayan Hub"
      },
      "waypoints": [
        {
          "id": "uuid",
          "sequence_order": 1,
          "lat": 7.5,
          "lng": 125.0,
          "waypoint_name": "Rest Stop 1"
        }
      ]
    }
  ]
}
```

### POST /api/routes
Create new route with optional waypoints

**Request Body:**
```json
{
  "route_name": "Davao to Cagayan Route",
  "origin_warehouse_id": "uuid",
  "destination_warehouse_id": "uuid",
  "distance_km": 250,
  "estimated_duration_hours": 6,
  "waypoints": [
    {
      "warehouse_id": "uuid",
      "lat": 7.5,
      "lng": 125.0,
      "waypoint_name": "Rest Stop 1",
      "estimated_arrival": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Required Fields:** route_name, origin_warehouse_id, destination_warehouse_id

### PATCH /api/routes
Update route status

**Request Body:**
```json
{
  "id": "uuid",
  "status": "completed"
}
```

---

## 🏢 Warehouses API

### GET /api/warehouses
Get all warehouses/hubs

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Davao Main Hub",
      "address": "123 Main St, Davao City",
      "lat": 7.0731,
      "lng": 125.6128,
      "contact": "+63-XXX-XXX-XXXX",
      "capacity": 1000,
      "is_main_hub": true,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /api/warehouses
Create new warehouse/hub

**Request Body:**
```json
{
  "name": "Davao Main Hub",
  "address": "123 Main St, Davao City",
  "lat": 7.0731,
  "lng": 125.6128,
  "contact": "+63-XXX-XXX-XXXX",
  "capacity": 1000,
  "is_main_hub": true
}
```

**Required Fields:** name, address, lat, lng

### PATCH /api/warehouses
Update warehouse

**Request Body:**
```json
{
  "id": "uuid",
  "capacity": 1500,
  "contact": "+63-XXX-XXX-YYYY"
}
```

### DELETE /api/warehouses?id={uuid}
Delete warehouse

---

## 🔔 Notifications API

### GET /api/notifications
Get all notifications

**Query Parameters:**
- `unread=true` - Get only unread notifications

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "shipment_id": "uuid",
      "notification_type": "delay",
      "title": "Shipment Delayed",
      "message": "Shipment SHP-123 is experiencing delays",
      "severity": "warning",
      "is_read": false,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### POST /api/notifications
Create notification

**Request Body:**
```json
{
  "shipment_id": "uuid",
  "driver_id": "uuid",
  "notification_type": "delay",
  "title": "Shipment Delayed",
  "message": "Traffic on highway causing delay",
  "severity": "warning"
}
```

**Required Fields:** notification_type, title, message

**Notification Types:** delay, deviation, check-in, maintenance, arrival, departure, alert

**Severity Levels:** info, warning, error, critical

### PATCH /api/notifications
Mark notification as read

**Request Body:**
```json
{
  "id": "uuid",
  "is_read": true
}
```

---

## 📍 Markers API

### GET /api/markers
Get all vehicle position markers

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "lat": 7.0731,
      "lng": 125.6128,
      "name": "Truck ABC-1234",
      "status": "running",
      "vehicle_type": "Truck",
      "unique_id": "TRUCK1234567890"
    }
  ]
}
```

### POST /api/markers
Add new vehicle marker (also creates truck/trailer entry)

**Request Body:**
```json
{
  "lat": 7.0731,
  "lng": 125.6128,
  "name": "Truck ABC-1234",
  "status": "running",
  "vehicle_type": "Truck",
  "unique_id": "ABC-1234"
}
```

---

## Status Values

### Shipment Status
- `pending` - Awaiting dispatch
- `loading` - Cargo being loaded
- `running` - En route
- `delayed` - Behind schedule
- `arrived` - At destination
- `delivered` - Completed

### Driver Status
- `available` - Ready for assignment
- `assigned` - Currently on delivery
- `off-duty` - Not working
- `on-leave` - Scheduled time off

### Route Status
- `planned` - Not yet started
- `active` - Currently in use
- `completed` - Finished
- `cancelled` - No longer valid

### Priority Levels
- `low` - Standard delivery
- `normal` - Regular priority
- `high` - Important shipment
- `urgent` - Critical/time-sensitive

---

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing fields)
- `500` - Internal Server Error

---

## Real-time Subscriptions

The application uses Supabase Realtime for live updates on these tables:
- `drivers`
- `trucks`
- `trailers`
- `warehouses`
- `shipments`
- `notifications`
- `markers`

Changes are automatically reflected in the UI without polling.

---

## Rate Limiting

Currently no rate limiting is implemented. For production use, consider:
- API rate limiting per IP
- Authentication/authorization
- Request throttling
- CORS configuration

---

## Authentication

Current implementation uses Supabase RLS with permissive policies (all operations allowed).

For production, implement:
- User authentication
- Role-based access control
- API key authentication
- JWT token validation

---

## Examples

### Create Complete Shipment Flow

```javascript
// 1. Create Route
const routeResponse = await fetch('/api/routes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    route_name: 'Davao to Cagayan',
    origin_warehouse_id: 'origin-uuid',
    destination_warehouse_id: 'dest-uuid',
    distance_km: 250
  })
});
const route = await routeResponse.json();

// 2. Create Shipment
const shipmentResponse = await fetch('/api/shipments', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    shipment_number: `SHP-${Date.now()}`,
    route_id: route.data[0].id,
    driver_id: 'driver-uuid',
    truck_id: 'truck-uuid',
    scheduled_pickup: '2024-01-01T08:00:00Z',
    scheduled_delivery: '2024-01-02T16:00:00Z',
    priority: 'high'
  })
});

// 3. Update Shipment Status
await fetch('/api/shipments', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    id: shipment.data[0].id,
    status: 'running',
    current_lat: 7.5,
    current_lng: 125.5
  })
});
```

---

For more information, see the [main README](README.md).
