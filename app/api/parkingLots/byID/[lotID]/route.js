import { supabase } from './db.js';
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { lotID } = params;
  try {
    const { data, error } = await supabase
      .from('parkingLots')
      .select('*')
      .eq('id', lotID)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}



export async function PUT(request, { params }) {
  const { lotID } = params;

  try {
    const body = await request.json();
    const { meterRate } = body;

    if (!meterRate) {
      return NextResponse.json({ error: 'Meter rate is required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('parkingLots')
      .update({ meterRate })  
      .eq('id', lotID)  
      .single(); 
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
  
