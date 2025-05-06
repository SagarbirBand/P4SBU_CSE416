import { supabase } from './db.js';
import { NextResponse } from "next/server";



export async function GET(request) {
  // necessary for build
  return NextResponse.json({
    message: 'Use POST method to fetch active reservations',
    status: 200
  });
}


export async function POST(request) {
  try {
    const body = await request.json();
    const { lotID, permitType } = body;

    console.log("Processing request for:", permitType, lotID);

    if(!lotID || !permitType) { 
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 }); 
    }

    // Check if the parking spot type exists
    const { data, error } = await supabase
      .from('parkingSpotTypes')
      .select('*')
      .eq('lotID', lotID)
      .eq('permitType', permitType)
      .single();
    
    if (error) {
      console.error("Error fetching spot type:", error.message);
      
      // Special handling for not found error
      if (error.code === 'PGRST116') {
        return NextResponse.json({
          activeReservations: 0,
          futureReservations: [],
          message: 'No matching parking spot type found'
        });
      }
      
      throw error;
    }

    console.log("Found spot type with ID:", data?.id);

    // If no data was found but no error occurred
    if (!data) {
      return NextResponse.json({
        activeReservations: 0,
        futureReservations: [],
        message: 'No matching parking spot type found'
      });
    }

    // Get reservations for this spot type
    const { data: reserveData, error: reserveError } = await supabase
      .from('reservations')
      .select('*')
      .eq('spotID', data.id);

    if (reserveError) {
      console.error("Error fetching reservations:", reserveError.message);
      throw reserveError;
    }

    // Filter for future reservations
    const estNow = new Date(new Date().toLocaleString("en-US", {timeZone: "America/New_York"}));
    const futureReservations = reserveData ? reserveData.filter(reservation => {
      const reservationStart = new Date(reservation.startTime);
      return reservationStart > estNow;
    }) : [];
    
    // Count active reservations
    const activeReservations = futureReservations.length;
    
    console.log(`Found ${activeReservations} active reservations`);

    // Return the data with reservation info
    return NextResponse.json({
      ...data,
      futureReservations,
      activeReservations
    });
  } catch (err) {
    console.error("Unhandled error in activeRes endpoint:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}