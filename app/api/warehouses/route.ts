import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

// GET all warehouses/hubs
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('warehouses')
      .select('*')
      .order('is_main_hub', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new warehouse/hub
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, lat, lng, contact, capacity, is_main_hub } = body;

    if (!name || !address || lat === undefined || lng === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: name, address, lat, lng' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('warehouses')
      .insert([
        {
          name,
          address,
          lat,
          lng,
          contact: contact || 'N/A',
          capacity: capacity || 100,
          is_main_hub: is_main_hub || false,
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update warehouse
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Warehouse ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('warehouses')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE warehouse
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Warehouse ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('warehouses').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
