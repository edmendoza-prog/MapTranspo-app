# Quick Setup Guide

Follow these steps to get your Mindanao Logistics Dashboard up and running.

## Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Git installed

## Step-by-Step Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase

#### A. Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project"
3. Create a new organization (if needed)
4. Create a new project
5. Wait for setup to complete (~2 minutes)

#### B. Get Your Credentials
1. Go to Project Settings → API
2. Copy your project URL
3. Copy your anon/public key

#### C. Update .env.local
The `.env.local` file already exists with your credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://dbgnmrtxnrukmhhsvnre.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Set Up Database

#### Run the SQL Schema
1. Open your Supabase project dashboard
2. Go to SQL Editor (left sidebar)
3. Click "New query"
4. Open the file `supabase_schema.sql` in this project
5. Copy all contents
6. Paste into Supabase SQL Editor
7. Click "Run" or press Ctrl+Enter
8. Wait for confirmation message

This will create:
- ✅ All database tables
- ✅ Indexes for performance
- ✅ Row Level Security policies
- ✅ Real-time subscriptions
- ✅ Sample data (5 drivers)

### 4. Start Development Server

```bash
npm run dev
```

The app will start at [http://localhost:3000](http://localhost:3000)

## First Steps After Launch

### 1. Verify Database Connection
- Open browser console (F12)
- Look for "Warehouses loaded: X" message
- Should see no errors in console

### 2. Add Your First Warehouse
- Go to Map View (should be default)
- Hold **Ctrl** and click anywhere on Mindanao
- Fill in warehouse details:
  - Name: "Davao Main Hub"
  - Address: "Davao City, Philippines"
  - Lat/Lng: Auto-filled from click
  - Contact: "+63-XXX-XXX-XXXX"
  - Check "Mark as Main Hub"
- Click "Create Warehouse"
- You should see a golden icon appear on map

### 3. Add Sample Vehicles (Optional)
- Click anywhere on the map (without Ctrl)
- This creates test vehicles with random status
- Repeat 5-10 times to populate the map

### 4. Create Your First Driver
- Click "👤 Drivers" tab at top
- Click "+ Add Driver"
- Fill in details:
  - Name: "Juan Dela Cruz"
  - License: "DL-2024-001"
  - Expiry: Select future date
  - Phone: "+63-917-123-4567"
- Click "Add Driver"

### 5. Create Your First Shipment
- Click "+ New Dispatch" (green button top-right)
- **Step 1: Route**
  - Create new route
  - Route Name: "Davao to Cagayan Route"
  - Select Origin and Destination warehouses
  - Click "Next"
- **Step 2: Assignment**
  - Select a driver
  - Select a truck
  - Click "Next"
- **Step 3: Cargo Details**
  - Cargo Description: "Electronics"
  - Weight: 5000 kg
  - Set pickup and delivery dates
  - Click "Create Shipment"

### 6. Check Notifications
- Click "🔔 Alerts" tab
- You should see a notification about the new shipment

## Common Issues & Solutions

### Issue: "Failed to fetch" errors
**Solution**: 
- Check `.env.local` has correct Supabase credentials
- Verify Supabase project is active
- Check browser console for detailed error

### Issue: Map not loading
**Solution**:
- Check internet connection (map tiles from OpenStreetMap)
- Wait a few seconds for Leaflet to initialize
- Refresh page

### Issue: No data showing in Sidebar
**Solution**:
- Verify SQL schema was executed successfully
- Check Supabase Table Editor to confirm tables exist
- Check browser console for API errors

### Issue: Real-time updates not working
**Solution**:
- Verify Supabase Realtime is enabled (Project Settings → API)
- Check subscription channel names match table names
- Reload page to reset connections

### Issue: Can't create warehouses with Ctrl+Click
**Solution**:
- Make sure you're holding Ctrl before clicking
- Try Cmd+Click on Mac
- Check console for JavaScript errors

## Testing the System

### Test Shipment Workflow
1. Create 2+ warehouses (origin and destination)
2. Add a driver
3. Create a shipment via "+ New Dispatch"
4. Change shipment status to "Running"
5. Check map for route polyline (green line)
6. Change status to "Delayed"
7. Route line should turn red and dashed

### Test Real-time Updates
1. Open app in two browser windows
2. In Window 1: Add a driver
3. In Window 2: Driver should appear automatically
4. Repeat for warehouses and shipments

### Test Notifications
1. Create a shipment
2. Go to Notifications panel
3. Should see "New Shipment Created" notification
4. Change shipment to "Delayed"
5. Should see "Shipment Delayed" notification

## Next Steps

- 📚 Read full [README.md](README.md) for detailed features
- 🗺️ Add more warehouses across Mindanao
- 👥 Register your driver team
- 🚚 Add your vehicle fleet
- 📦 Start dispatching shipments!

## Quick Reference

### Map Controls
- **Click**: Add test vehicle
- **Ctrl+Click**: Create warehouse
- **Zoom**: Mouse wheel or +/- buttons
- **Pan**: Click and drag

### Keyboard Shortcuts
- **Ctrl+Click**: Create warehouse (on map)
- **Esc**: Close modals (when applicable)

### Status Colors
- 🔴 Red: Delayed
- 🟢 Green: Running
- 🟡 Yellow: Loading
- ⚪ Gray: Pending
- 🔵 Blue: Arrived
- 🟣 Purple: Delivered

## Need Help?

- Check browser console (F12) for errors
- Review Supabase logs in dashboard
- Verify API routes are accessible
- Check network tab for failed requests

Happy tracking! 🚚📍
