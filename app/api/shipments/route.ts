import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

// GET all shipments with full details
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select(`
        *,
        driver:drivers(*),
        truck:trucks(*),
        trailer:trailers(*),
        route:routes(
          *,
          origin_warehouse:warehouses!routes_origin_warehouse_id_fkey(*),
          destination_warehouse:warehouses!routes_destination_warehouse_id_fkey(*)
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new shipment
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      shipment_number,
      route_id,
      driver_id,
      truck_id,
      trailer_id,
      cargo_description,
      cargo_weight_kg,
      cargo_value_php,
      scheduled_pickup,
      scheduled_delivery,
      priority,
      notes,
    } = body;

    if (!shipment_number || !route_id || !scheduled_pickup || !scheduled_delivery) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('shipments')
      .insert([
        {
          shipment_number,
          route_id,
          driver_id,
          truck_id,
          trailer_id,
          cargo_description,
          cargo_weight_kg,
          cargo_value_php,
          scheduled_pickup,
          scheduled_delivery,
          priority: priority || 'normal',
          status: 'pending',
          notes,
        },
      ])
      .select();

    if (error) throw error;

    // Update driver status to assigned if driver_id provided
    if (driver_id) {
      await supabase
        .from('drivers')
        .update({ status: 'assigned' })
        .eq('id', driver_id);
    }

    // Update truck status to in-use if truck_id provided
    if (truck_id) {
      await supabase
        .from('trucks')
        .update({ status: 'in-use' })
        .eq('id', truck_id);
    }

    // Update trailer status to in-use if trailer_id provided
    if (trailer_id) {
      await supabase
        .from('trailers')
        .update({ status: 'in-use' })
        .eq('id', trailer_id);
    }

    // Create notification
    await supabase.from('notifications').insert([
      {
        shipment_id: data[0].id,
        notification_type: 'departure',
        title: 'New Shipment Created',
        message: `Shipment ${shipment_number} has been scheduled for pickup`,
        severity: 'info',
      },
    ]);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update shipment status or details
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, current_lat, current_lng, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Shipment ID is required' }, { status: 400 });
    }

    // Get current shipment data to check for resource assignments
    const { data: currentShipment } = await supabase
      .from('shipments')
      .select('driver_id, truck_id, trailer_id, status')
      .eq('id', id)
      .single();

    const updateData: any = { ...updates };
    
    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'loading' && !updates.actual_pickup) {
        updateData.actual_pickup = new Date().toISOString();
      } else if (status === 'delivered' && !updates.actual_delivery) {
        updateData.actual_delivery = new Date().toISOString();
      }
      
      // Release resources when shipment is delivered
      if (currentShipment && status === 'delivered') {
        // Release driver
        if (currentShipment.driver_id) {
          await supabase
            .from('drivers')
            .update({ status: 'available' })
            .eq('id', currentShipment.driver_id);
        }
        
        // Release truck
        if (currentShipment.truck_id) {
          await supabase
            .from('trucks')
            .update({ status: 'available' })
            .eq('id', currentShipment.truck_id);
        }
        
        // Release trailer
        if (currentShipment.trailer_id) {
          await supabase
            .from('trailers')
            .update({ status: 'available' })
            .eq('id', currentShipment.trailer_id);
        }
      }
    }

    if (current_lat && current_lng) {
      updateData.current_lat = current_lat;
      updateData.current_lng = current_lng;
      updateData.last_location_update = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('shipments')
      .update(updateData)
      .eq('id', id)
      .select();

    if (error) throw error;

    // Create notification for status changes
    if (status && ['delayed', 'arrived', 'delivered'].includes(status)) {
      const messages = {
        delayed: 'Shipment is experiencing delays',
        arrived: 'Shipment has arrived at destination',
        delivered: 'Shipment has been delivered successfully',
      };

      await supabase.from('notifications').insert([
        {
          shipment_id: id,
          notification_type: status === 'delayed' ? 'delay' : 'arrival',
          title: `Shipment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
          message: messages[status as keyof typeof messages],
          severity: status === 'delayed' ? 'warning' : 'info',
        },
      ]);
    }

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
