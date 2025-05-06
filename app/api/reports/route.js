import { supabase } from './db.js';
import { NextResponse } from "next/server";


// new report
export async function POST(request) {
  const { type, data } = await request.json();

  if (!type || !data) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('reports')
      .insert([{ type, data }])
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json(
      { message: 'Parking Lot registered successfully' },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}