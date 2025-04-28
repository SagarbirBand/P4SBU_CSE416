// app/api/parkingSpotTypes/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';

export async function GET() {
  const { data, error } = await supabase
    .from('parkingSpotTypes')
    .select('*');
  if (error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  return NextResponse.json(data);
}
