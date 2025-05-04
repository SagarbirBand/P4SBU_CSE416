import { supabase } from './db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, location, capacityTotal, coordinates, meterRate } = await request.json();

  if (!name || !location || !capacityTotal || !coordinates || !meterRate) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('parkingLots')
      .insert([{ name, location, capacityTotal, coordinates, meterRate }]);
    if (error) throw error;
    return NextResponse.json(
      { message: 'Parking Lot registered successfully', user: data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
