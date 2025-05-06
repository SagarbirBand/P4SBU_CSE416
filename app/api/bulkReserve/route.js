import { supabase } from '../lib/db.js';
import { NextResponse } from "next/server";


//simply get from bulkReserve
export async function GET() {
  try {
    const { data, error } = await supabase.from('bulkReserve').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
