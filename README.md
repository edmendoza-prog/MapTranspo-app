# Mindanao Logistics Management Dashboard

A comprehensive web-based logistics management system for dispatching, tracking, and managing semi-trailer truck fleets operating across Mindanao, Philippines.

## 🚀 Features

### Interactive Map Interface
- **Zoomable Map**: Full Mindanao coverage with OpenStreetMap tiles
- **Click-to-Create**: 
  - Regular click: Add test vehicles
  - Ctrl+Click: Create new warehouses/hubs
- **Visual Markers**: 
  - Color-coded vehicle status indicators
  - Distinguished warehouse and main hub icons
  - Real-time vehicle position updates
- **Route Polylines**: 
  - Active route visualization
  - Color-coded by shipment status
  - Dashed lines for delayed shipments

### Fleet Management
- **Vehicle Registry**: Complete truck and trailer database
- **Real-time Status**: Track availability and assignments
- **Maintenance Tracking**: Schedule and log maintenance activities
- **Fleet Statistics**: Quick overview of total vehicles and availability

### Driver Management
- **Driver Profiles**: 
  - Name, license info, contact details
  - License expiry tracking
  - Status management (Available, Assigned, Off-duty, On-leave)
- **Vehicle Assignment**: Link drivers to specific trucks
- **Availability Tracking**: Real-time driver status updates

### Hub & Warehouse Management
- **Location Management**: 
  - Create hubs/warehouses via map or form
  - Set location type: Main hub, warehouse, or destination
  - Store capacity and operating details
- **Visual Hierarchy**: Main hubs prominently displayed with special styling
- **Contact Information**: Phone numbers and addresses for each location

### Dispatch & Route Assignment
- **Multi-step Dispatch Process**:
  1. Route selection or creation
  2. Driver and vehicle assignment
  3. Cargo and schedule details
- **Route Management**:
  - Origin, destination, and waypoints
  - Distance and duration estimates
  - Route status tracking
- **Cargo Details**:
  - Description, weight, and value
  - Priority levels (Low, Normal, High, Urgent)
  - Special instructions and notes

### Shipment Tracking
- **Real-time Status Updates**:
  - 🔵 **Pending** – Awaiting dispatch
  - 🟡 **Loading** – Cargo being loaded
  - 🟢 **Running** – En route
  - 🔴 **Delayed** – Behind schedule
  - 🔵 **Arrived** – At destination
  - 🟣 **Delivered** – Completed
- **Comprehensive Dashboard**: Filter by status, priority, or driver
- **Statistics Panel**: Live counts for each status category
- **Shipment Details**: Full cargo, route, and timing information

### Notifications & Alerts
- **Real-time Alerts**:
  - Delay notifications
  - Route deviations
  - Driver check-ins
  - Maintenance reminders
  - Arrival/departure updates
- **Severity Levels**: Info, Warning, Error, Critical
- **Unread Management**: Mark individual or all as read
- **Alert History**: Review past notifications

### Dashboard Summary
- **Key Metrics**:
  - Total and active shipments
  - Pending dispatches
  - Delayed shipments alert
  - Driver availability
  - Fleet size overview
  - Warehouse count
  - Daily deliveries
- **Status Overview**: Quick glance at fleet operations
- **Quick Actions**: Fast access to common tasks

## 🛠️ Technology Stack

- **Frontend**: Next.js 16.2.2 with React 19
- **Styling**: Tailwind CSS 4
- **Map**: Leaflet & React Leaflet
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime subscriptions
- **Language**: TypeScript

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd trackingmap-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy `.env.local` and add your credentials:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-project-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
     ```
   - Run the SQL schema in Supabase SQL Editor:
     ```bash
     # Open supabase_schema.sql and execute in Supabase SQL Editor
     ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📊 Database Schema

The system uses the following main tables:

- `drivers` - Driver profiles and availability
- `trucks` - Truck registry and status
- `trailers` - Trailer registry and status
- `warehouses` - Hub and warehouse locations
- `routes` - Delivery routes with origin/destination
- `route_waypoints` - Intermediate stops on routes
- `shipments` - Active shipment tracking
- `notifications` - Alert and notification system
- `maintenance_logs` - Vehicle maintenance tracking
- `markers` - Real-time vehicle positions

All tables have Row Level Security (RLS) enabled and real-time subscriptions configured.

## 🗺️ Map Controls

- **Click**: Add a test vehicle at clicked location
- **Ctrl + Click**: Open warehouse creation form with coordinates
- **Zoom**: Use mouse wheel or +/- buttons
- **Pan**: Click and drag to move around
- **Marker Click**: View details in popup

## 📱 User Interface

### Navigation Tabs
1. **📊 Dashboard** - Overview statistics and metrics
2. **🗺️ Map View** - Interactive map with routes and markers
3. **📦 Shipments** - Detailed shipment tracking
4. **👤 Drivers** - Driver management panel
5. **🔔 Alerts** - Notifications and alerts

### Sidebar
- **Fleet Tab**: View all trucks and trailers
- **Hubs Tab**: Warehouse and hub listings
- Real-time updates via Supabase subscriptions

## 🚀 Key Workflows

### Creating a New Shipment
1. Click "+ New Dispatch" button
2. Select existing route or create new one
3. Assign driver and vehicle
4. Enter cargo details and schedule
5. Review and create shipment

### Adding a Driver
1. Navigate to Drivers view
2. Click "+ Add Driver"
3. Fill in driver details
4. Submit form
5. Assign to available truck if needed

### Creating a Warehouse/Hub
1. Go to Map View
2. Hold Ctrl and click on desired location
3. Fill in warehouse details
4. Check "Mark as Main Hub" for primary locations
5. Submit to add to map

### Monitoring Shipments
1. Navigate to Shipments view
2. Use status filters to view specific categories
3. Click shipment status dropdown to update
4. View route polylines on map
5. Check notifications for alerts

## 🔔 Real-time Features

The system uses Supabase Realtime for live updates:

- Vehicle positions update automatically
- Shipment status changes reflect immediately
- New notifications appear without refresh
- Driver availability updates in real-time
- Warehouse additions show on map instantly

## 🎨 Status Color Coding

### Shipment Status Colors
- **Gray** (⚪) - Pending
- **Yellow** (🟡) - Loading
- **Green** (🟢) - Running
- **Red** (🔴) - Delayed
- **Blue** (🔵) - Arrived
- **Indigo** (🟣) - Delivered

### Route Line Colors
- **Green** - Active running shipments
- **Red** - Delayed shipments (dashed line)
- **Yellow** - Loading phase
- **Blue** - Arrived/Delivered
- **Gray** - Pending

## 📈 Future Enhancements

- [ ] GPS tracking integration
- [ ] Mobile driver app
- [ ] Automated route optimization
- [ ] Fuel consumption tracking
- [ ] Customer portal
- [ ] Analytics and reporting
- [ ] SMS/Email notifications
- [ ] Document management
- [ ] Weather integration
- [ ] Traffic data integration

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Leaflet for mapping library
- Supabase for backend infrastructure
- Next.js team for the framework
- Tailwind CSS for styling system

---

Built with ❤️ for logistics management in Mindanao, Philippines


This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
