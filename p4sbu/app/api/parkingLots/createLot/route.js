import { supabase } from '../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, location, capacityTotal, coordinates } = await request.json();

  if (!name || !location || !capacityTotal || !coordinates) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('parkingLots')
      .insert([{ name, location, capacityTotal, coordinates }]);
    if (error) throw error;
    return NextResponse.json(
      { message: 'Parking Lot registered successfully', user: data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
