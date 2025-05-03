import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = searchParams.get('origin');
  const destinations = searchParams.get('destinations');
  if (!origin || !destinations) {
    return NextResponse.json(
      { error: 'origin and destinations are required' },
      { status: 400 }
    );
  }

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: 'Missing server API key' },
      { status: 500 }
    );
  }

  const url =
    `https://maps.googleapis.com/maps/api/distancematrix/json?` +
    `origins=${encodeURIComponent(origin)}` +
    `&destinations=${encodeURIComponent(destinations)}` +
    `&mode=walking&key=${key}`;

  try {
    const resp = await fetch(url);
    const json = await resp.json();
    return NextResponse.json(json);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Distance fetch failed' },
      { status: 502 }
    );
  }
}
