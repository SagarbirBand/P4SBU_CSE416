import { supabase } from './db.js'//from '../../lib/db.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { userID } = params;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userID)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
