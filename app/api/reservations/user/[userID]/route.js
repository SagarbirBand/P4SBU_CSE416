import { supabase } from '../../../lib/db.js';
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { userID } = await params;
  try {
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('userID', userID);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
