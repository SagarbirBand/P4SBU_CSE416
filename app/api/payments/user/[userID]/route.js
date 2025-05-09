import { supabase } from '../../../lib/db.js';
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { userID } = params;
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('userID', userID);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
