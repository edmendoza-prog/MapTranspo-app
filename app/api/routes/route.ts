import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

// GET all routes with waypoints
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('routes')
      .select(`
        *,
        origin_warehouse:warehouses!routes_origin_warehouse_id_fkey(*),
        destination_warehouse:warehouses!routes_destination_warehouse_id_fkey(*),
        waypoints:route_waypoints(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new route with waypoints
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      route_name,
      origin_warehouse_id,
      destination_warehouse_id,
      distance_km,
      estimated_duration_hours,
      waypoints,
    } = body;

    if (!route_name || !origin_warehouse_id || !destination_warehouse_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Insert route
    const { data: routeData, error: routeError } = await supabase
      .from('routes')
      .insert([
        {
          route_name,
          origin_warehouse_id,
          destination_warehouse_id,
          distance_km,
          estimated_duration_hours,
          status: 'planned',
        },
      ])
      .select();

    if (routeError) throw routeError;

    // Insert waypoints if provided
    if (waypoints && waypoints.length > 0 && routeData) {
      const waypointInserts = waypoints.map((wp: any, index: number) => ({
        route_id: routeData[0].id,
        warehouse_id: wp.warehouse_id,
        sequence_order: index + 1,
        lat: wp.lat,
        lng: wp.lng,
        waypoint_name: wp.waypoint_name,
        estimated_arrival: wp.estimated_arrival,
      }));

      const { error: waypointError } = await supabase
        .from('route_waypoints')
        .insert(waypointInserts);

      if (waypointError) throw waypointError;
    }

    return NextResponse.json({ success: true, data: routeData }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update route status
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Route ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('routes')
      .update({ status, ...updates })
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
