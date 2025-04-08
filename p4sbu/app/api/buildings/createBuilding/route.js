import { supabase } from '../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, coordinates } = await request.json();

  if (!name || !coordinates) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('buildings')
      .insert([{ name, coordinates }]);
    if (error) throw error;
    return NextResponse.json(
      { message: 'Building registered successfully', user: data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
