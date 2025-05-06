import { supabase } from '../../../lib/db.js';
import { NextResponse } from "next/server";

export async function PUT(request, context) {
  const { orderID } = context.params;

  try {
    
    // approve
    const { error: updateError } = await supabase
      .from('bulkReserve')
      .update({ isApproved: true })
      .eq('id', orderID);

    if (updateError) throw updateError;

    // retrieve the full order data
    const { data: order, error: orderError } = await supabase
      .from('bulkReserve')
      .select('*')
      .eq('id', orderID)
      .single();

    if (orderError) throw orderError;

    const { spotID, userID, paymentID, startTime, endTime, numSlots } = order;

    // get availability
    const { data: spotTypeData, error: spotTypeError } = await supabase
      .from('parkingSpotTypes')
      .select('*')
      .eq('id', spotID)
      .single();

    if (spotTypeError) throw spotTypeError;

    const currAvail = spotTypeData.currentAvailable;

    if (currAvail < numSlots) {
      return NextResponse.json({ error: 'Not enough available spots' }, { status: 400 });
    }

    // decrease availability
    const newAvail = currAvail - numSlots;
    const { error: availUpdateError } = await supabase
      .from('parkingSpotTypes')
      .update({ currentAvailable: newAvail })
      .eq('id', spotID);

    if (availUpdateError) throw availUpdateError;

    // create reservations
    const insertedReservations = [];
    for (let i = 0; i < numSlots; i++) {
      const { data: reservationData, error: reservationError } = await supabase
        .from('reservations')
        .insert([{ userID, spotID, paymentID, startTime, endTime }])
        .select()
        .single();

      if (reservationError) {
        console.error("Reservation Error:", reservationError);
        throw reservationError;
      }

      insertedReservations.push(reservationData);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("API Error:", err.message || err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}