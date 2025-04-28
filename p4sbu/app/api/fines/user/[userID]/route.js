import { supabase } from './db.js';
import { NextResponse } from 'next/server';

// GET fines for a specific user
export async function GET(request, { params }) {
  const { userID } = params;
  try {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .eq('userID', userID);
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST a new fine for a specific user
export async function POST(request, { params }) {
  const { userID } = params;
  try {
    const body = await request.json();

    const { date, time, description, payBy, amount } = body;

    const { data, error } = await supabase
      .from('fines')
      .insert([
        {
          userID: parseInt(userID),
          amount,
          description,
          payBy
        }
      ]);

    if (error) throw error;

    return NextResponse.json({ message: 'Fine issued successfully', data }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}




// User paid the fine so now status is true (MAKE SURE TO CHECK FOR CORRESPONDING PAYMENT!! Thank you)
export async function PUT(request, { params }) {
  const { userID } = params;

  try {
    const { data, error } = await supabase
      .from('fines')
      .update({ statusPaid: true })  // Update the statusPaid to true
      .eq('userID', userID);  // Target fines for the specific userID

    if (error) throw error;

    // Return the updated data
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}