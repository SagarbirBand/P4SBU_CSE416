import { supabase } from '../lib/db.js';
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { data, error } = await supabase.from('payments').select('*');
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
