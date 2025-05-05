import { supabase } from '../../../lib/db.js';
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { permitType } = params;
  try {
    const { data: spotTypes, error: spotError } = await supabase
      .from('parkingSpotTypes')
      .select('lotID')
      .eq('permitType', permitType);
    if (spotError) throw spotError;

    const lotIDs = spotTypes.map(row => row.lotID);
    if (lotIDs.length === 0) {
      return NextResponse.json([]);
    }
    const { data: lots, error: lotError } = await supabase
      .from('parkingLots')
      .select('*')
      .in('id', lotIDs);
    if (lotError) throw lotError;

    return NextResponse.json(lots);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
