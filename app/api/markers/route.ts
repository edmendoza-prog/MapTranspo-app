import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { lat, lng, name, status, vehicle_type, unique_id } = body;

    // Determine if it's a truck or trailer
    const type = vehicle_type || (Math.random() > 0.5 ? 'Truck' : 'Trailer');
    const plateId = unique_id || `${type.toUpperCase().substring(0, 3)}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`;
    const vin = `${type.toUpperCase()}${Date.now()}`;
    
    // Generate default model
    const models = type === 'Truck' 
      ? ['Isuzu Giga', 'Hino 500', 'Fuso Fighter', 'UD Quon', 'Foton Auman']
      : ['Utility Flatbed', 'Enclosed Van', 'Container Trailer', 'Lowboy Trailer', 'Refrigerated Trailer'];
    const model = models[Math.floor(Math.random() * models.length)];
    
    // Map marker status to truck/trailer status
    // Marker statuses: 'Pending', 'Loading', 'In Transit', 'Arrived', 'Delivered', 'Running', 'Delayed'
    // Truck/Trailer statuses: 'available', 'in-use', 'maintenance', 'out-of-service'
    const statusMap: Record<string, string> = {
      'Pending': 'available',
      'Loading': 'in-use',
      'In Transit': 'in-use',
      'Running': 'in-use',
      'Arrived': 'available',
      'Delivered': 'available',
      'Delayed': 'in-use'
    };
    const vehicleStatus = statusMap[status || 'Pending'] || 'available';

    // Insert into appropriate fleet table
    if (type === 'Truck') {
      const { error: truckError } = await supabase.from('trucks').insert([
        { 
          plate_id: plateId, 
          vin, 
          model,
          status: vehicleStatus, 
          last_lat: lat, 
          last_lng: lng 
        }
      ]);
      if (truckError) {
        console.error('Error inserting truck:', truckError);
        throw truckError;
      }
    } else {
      const { error: trailerError } = await supabase.from('trailers').insert([
        { 
          plate_id: plateId, 
          vin, 
          model,
          status: vehicleStatus, 
          last_lat: lat, 
          last_lng: lng 
        }
      ]);
      if (trailerError) {
        console.error('Error inserting trailer:', trailerError);
        throw trailerError;
      }
    }

    // Also insert into markers for unified map display
    const { data, error } = await supabase
      .from('markers')
      .insert([{ lat, lng, label: name || plateId }])
      .select();

    if (error) {
      console.error('Error inserting marker:', error);
      throw error;
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    console.error('Marker POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
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
