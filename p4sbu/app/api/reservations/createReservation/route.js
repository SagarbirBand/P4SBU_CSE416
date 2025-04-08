import { supabase } from '../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { userID, spotID, paymentID, startTime, endTime } = await request.json();

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
    if (currAvail <= 0) {
      return NextResponse.json({ error: 'No available spots for this type.' }, { status: 409 });
    }

    const { data: reservationData, error: reservationError } = await supabase
      .from('reservations')
      .insert([{ userID, spotID, paymentID }])
      .select()
      .single();
    if (reservationError) throw reservationError;

    const newAvail = currAvail - 1;
    const { data: updatedSpot, error: updateError } = await supabase
      .from('parkingSpotTypes')
      .update({ currentAvailable: newAvail })
      .eq('id', spotID)
      .select()
      .single();
    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Reservation registered successfully',
      reservation: reservationData,
      updatedSpot,
    }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
