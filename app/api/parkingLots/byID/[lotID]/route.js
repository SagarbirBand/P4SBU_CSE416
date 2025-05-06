import { supabase } from '../../../lib/db.js';
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
  


export async function DELETE(request, { params }) {
  const { lotID } = params;
  try {

    //fetch parkingspottypes
    const { data: spotTypes, error: fetchSpotsError } = await supabase
      .from('parkingSpotTypes')
      .select('id')
      .eq('lotID', lotID);

    if (fetchSpotsError) { console.log("1"); throw fetchSpotsError;}

    const spotTypeIDs = spotTypes.map(s => s.id);


    //select all of the data about to be deleted (for emailing uers on reservation updates)
    const { data: toBeDeleted, error: selectError } = await supabase
    .from('reservations')
    .select('*')
    .in('spotID', spotTypeIDs);

    if (selectError) throw selectError;


    //delete reservations w/spottypes
    if (spotTypeIDs.length > 0) {
      const { error: deleteResError } = await supabase
        .from('reservations')
        .delete()
        .in('spotID', spotTypeIDs);

      if (deleteResError) { console.log("2"); throw deleteResError;}
    }

    //delete parkingspottypes with lotID
    const { error: spotError } = await supabase
      .from('parkingSpotTypes')
      .delete()
      .eq('lotID', lotID);
      if (spotError) throw spotError;

    // delete lot
    const { data, error } = await supabase
      .from('parkingLots')
      .delete()
      .eq('id', lotID)
      .single();

    if (error) throw error;
    return NextResponse.json(
      { deletedLot: data, deletedReservations: toBeDeleted },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}