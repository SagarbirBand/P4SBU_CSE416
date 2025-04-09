import { supabase } from './db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { userID, amount } = await request.json();

  if (!userID || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('payments')
      .insert([{ userID, amount }])
      .select();
    
    if (error) throw error;
    
    return NextResponse.json(
      { 
        message: 'Payment registered successfully', 
        payment: data[0],
        paymentID: data[0].id
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}