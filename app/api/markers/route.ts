import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { lat, lng, name, status, vehicle_type, unique_id } = body;

    // Determine if it's a truck or trailer
    const type = vehicle_type || (Math.random() > 0.5 ? 'Truck' : 'Trailer');
    const plateId = unique_id || `${type.toUpperCase().substring(0, 3)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const vin = `${type.toUpperCase()}${Date.now()}`;

    // Insert into appropriate fleet table
    if (type === 'Truck') {
      await supabase.from('trucks').insert([
        { plate_id: plateId, vin, status: status || 'Pending', last_lat: lat, last_lng: lng }
      ]);
    } else {
      await supabase.from('trailers').insert([
        { plate_id: plateId, vin, status: status || 'Pending', last_lat: lat, last_lng: lng }
      ]);
    }

    // Also insert into markers for unified map display
    const { data, error } = await supabase
      .from('markers')
      .insert([{ lat, lng, name: name || plateId, status: status || 'Pending', vehicle_type: type, unique_id: vin }])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { data: markers, error } = await supabase
      .from('markers')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data: markers }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
