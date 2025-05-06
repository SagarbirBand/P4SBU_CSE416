import { supabase } from './db.js';
import { NextResponse } from "next/server";

export async function POST(request) {
  const { userID, spotID, paymentID, startTime, endTime, numSlots } = await request.json();

  if (!userID || !spotID || !paymentID || !startTime || !endTime || !numSlots) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {

    //get available slots
    const { data: spotTypeData, error: spotTypeError } = await supabase
      .from('parkingSpotTypes')
      .select('*')
      .eq('id', spotID)
      .single();
    if (spotTypeError) throw spotTypeError;

    const currAvail = spotTypeData.currentAvailable;

    //create reservations
    for (let i = 0; i < numSlots; i++) {
        const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .insert([{ userID, spotID, paymentID, startTime, endTime }])
        .select();
        if (reservationError) { console.log("Reservation Error:", reservationError); throw reservationError;}
    }

    //modify currAvail now
    const newAvail = currAvail - 1;
    const { data: updatedSpot, error: updateError } = await supabase
      .from('parkingSpotTypes')
      .update({ currentAvailable: newAvail })
      .eq('id', spotID)
      .select()
      .single();
    if (updateError) throw updateError;

    return NextResponse.json(
      { success: true, 
        id: reservationData.id 
      },
      { status: 201 }
    );

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}