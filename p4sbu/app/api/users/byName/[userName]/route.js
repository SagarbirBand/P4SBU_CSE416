import { supabase } from './db.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { userName } = params;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('name', userName)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
