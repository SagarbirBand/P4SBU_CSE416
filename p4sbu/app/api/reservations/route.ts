// app/api/reservations/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { lotId, vehicleType, reservationDuration } = await request.json();
  // Insert the reservation into the database (this is a stub)
  return NextResponse.json({ message: 'Reservation created successfully.' });
}
