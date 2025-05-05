import { supabase } from '../../../lib/db.js';
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { lotName } = params;
  try {
    const { data, error } = await supabase
      .from('parkingLots')
      .select('*')
      .eq('name', lotName)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
