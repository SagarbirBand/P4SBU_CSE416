import { supabase } from './db.js';
import { NextResponse } from "next/server";

export async function POST(request) {
  const { userID, spotID, paymentID, startTime, endTime, numSlots } = await request.json();

  if (!userID || !spotID || !paymentID || !startTime || !endTime || !numSlots) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {


    const { data: bulkData, error: bulkError } = await supabase
        .from('bulkReserve')
        .insert([{ userID, spotID, paymentID, startTime, endTime, numSlots }])
        .select()
        .single();

    if (bulkError) throw bulkError;

    return NextResponse.json(
      { success: true, reservations: insertedReservations },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}