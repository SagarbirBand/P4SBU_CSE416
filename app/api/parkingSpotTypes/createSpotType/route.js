import { supabase } from '../../lib/db.js';
import { NextResponse } from "next/server";

export async function POST(request) {
  const { lotID, permitType, count, currentAvailable } = await request.json();

  if (!lotID || !permitType || !count|| !currentAvailable) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('parkingSpotTypes')
      .insert([{ lotID, permitType, count, currentAvailable }]);
    if (error) throw error;
    return NextResponse.json(
      { message: 'Parking Spot Type registered successfully', data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
