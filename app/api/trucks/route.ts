import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

// GET - Fetch all trucks
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('trucks')
      .select('*')
      .order('plate_id', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching trucks:', error);
    return NextResponse.json({ error: 'Failed to fetch trucks' }, { status: 500 });
  }
}

// POST - Create a new truck
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { plate_id, vin, model, year, status, last_lat, last_lng } = body;

    if (!plate_id || !vin || !model) {
      return NextResponse.json(
        { error: 'Missing required fields: plate_id, vin, model' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('trucks')
      .insert([
        {
          plate_id,
          vin,
          model,
          year: year || null,
          status: status || 'available',
          last_lat: last_lat || null,
          last_lng: last_lng || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Error creating truck:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create truck' },
      { status: 500 }
    );
  }
}

// PATCH - Update a truck
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Truck ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('trucks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating truck:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update truck' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a truck
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Truck ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('trucks').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting truck:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete truck' },
      { status: 500 }
    );
  }
}
