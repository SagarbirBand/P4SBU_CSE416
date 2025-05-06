import { supabase } from './db.js';
import { NextResponse } from "next/server";

export async function POST(request) {
  const { userID, spotID, paymentID, startTime, endTime } = await request.json();


  if(!userID) {console.log("no user");}
  if(!spotID) {console.log("no spot"); }
  if(!paymentID) {console.log("no payment"); }
  if(!startTime) {console.log("no start"); }
  if(!endTime) {console.log("no end"); }

  if (!userID || !spotID || !paymentID || !startTime || !endTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {


    const { data: spotTypeData, error: spotTypeError } = await supabase
      .from('parkingSpotTypes')
      .select('*')
      .eq('id', spotID)
      .single();
    if (spotTypeError) throw spotTypeError;

    const currAvail = spotTypeData.currentAvailable;

    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert([{ userID, spotID, paymentID, startTime, endTime }])
      .select();
    if (reservationError) { console.log("Reservation Error:", reservationError); throw reservationError;}
    //else { console.log("all good");}


    let newAvail = currAvail - 1;
    if (newAvail < 0) { newAvail = 0;} //safeguard

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
