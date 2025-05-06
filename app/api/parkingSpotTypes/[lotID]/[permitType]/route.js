import { error } from 'console';
import { supabase } from './db.js';
import { NextResponse } from "next/server";

export async function PUT(request, { params }) { //we get data but complexity of this request necessitates POST since we have json body
  const { lotID, permitType: encodedPermitType } = params;
  const permitType = decodeURIComponent(encodedPermitType);
  const { count, currentAvailable } = await request.json();

  if(!lotID || !permitType || !count || !currentAvailable) { return NextResponse.json({ error: 'Missing required fields' }, { status: 400 }); }

  try {
    const { data, error } = await supabase
      .from('parkingSpotTypes')
      .update({ 
        count: count, 
        currentAvailable: currentAvailable 
      })
      .eq('lotID', lotID)
      .eq('permitType', permitType);
    if (error) throw error;

      //select the updated record if needed

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}





export async function DELETE(request, { params }) {
  const { lotID, permitType: encodedPermitType } = params;
  const permitType = decodeURIComponent(encodedPermitType);
  try {

    //fetch the parkingspotType
    const { data: spotType, error: fetchSpotsError } = await supabase
      .from('parkingSpotTypes')
      .select('id')
      .eq('lotID', lotID)
      .eq('permitType', permitType)
      .single();

    if (fetchSpotsError) { console.log("1"); throw fetchSpotsError;}

    const spotTypeID = spotType.id

    //select all of the data about to be deleted (for emailing uers on reservation updates)
    const { data: toBeDeleted, error: selectError } = await supabase
    .from('reservations')
    .select('*')
    .eq('spotID', spotTypeID);

    if (selectError) throw selectError;


    //delete reservations w/spottype
    if (toBeDeleted.length > 0) {
      const { data: deletedReservations, error: deleteResError } = await supabase
        .from('reservations')
        .delete()
        .eq('spotID', spotTypeID);

      if (deleteResError) { console.log("2"); throw deleteResError;}
    }

    //delete parkingspottypes with lotID
    const { data: deletedSpot, error: spotError } = await supabase
      .from('parkingSpotTypes')
      .delete()
      .eq('id', spotTypeID);

    if (spotError) throw spotError;

    return NextResponse.json(
      { deletedSpot: deletedSpot, deletedReservations: toBeDeleted },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}