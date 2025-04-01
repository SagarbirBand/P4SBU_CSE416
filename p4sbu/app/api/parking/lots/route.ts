// app/api/parking/lots/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  // Normally, you would fetch parking lot data from a database.
  const lots = [
    { id: 1, name: 'Lot A', capacity: 50, costPerHour: 2, distance: 200 },
    { id: 2, name: 'Lot B', capacity: 30, costPerHour: 3, distance: 150 },
    { id: 3, name: 'Lot C', capacity: 20, costPerHour: 1.5, distance: 300 },
  ];
  return NextResponse.json(lots);
}
