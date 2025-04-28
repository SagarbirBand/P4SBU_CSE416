import { supabase } from './db.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { fineID } = params;
  try {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .eq('id', fineID)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// User paid the fine so now status is true (MAKE SURE TO CHECK FOR CORRESPONDING PAYMENT!! Thank you)
export async function PUT(request, { params }) {
  const { fineID } = params;

  try {
    const { data, error } = await supabase
      .from('fines')
      .update({ statusPaid: true })
      .eq('id', fineID); 

    if (error) throw error;

    // Return the updated data
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
