import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase/client';

// GET all drivers
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST create new driver
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, license_number, license_expiry, phone, email, address, status } = body;

    if (!name || !license_number || !license_expiry || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, license_number, license_expiry, phone' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('drivers')
      .insert([
        {
          name,
          license_number,
          license_expiry,
          phone,
          email,
          address,
          status: status || 'available',
        },
      ])
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH update driver
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('drivers')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE driver
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Driver ID is required' }, { status: 400 });
    }

    const { error } = await supabase.from('drivers').delete().eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
