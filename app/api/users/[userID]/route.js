import bcrypt from 'bcrypt';
import { supabase } from '../../lib/db.js'
import { NextResponse } from "next/server";

export async function GET(request, { params }) {
  const { userID } = params;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userID)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


//Update User info
export async function PUT(request, { params }) {

  const { userID } = params;
  const { email, name, permitType, licensePlate, password } = await request.json();

  try {
    // Fetch the current user details from the database
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('id, passBcrypt')
      .eq('id', userID)
      .single();

    if (fetchError || !user) {
      throw new Error('User not found');
    }

    //compare
    const match = await bcrypt.compare(password, user.passBcrypt);
    if (!match) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    //update
    const { data, error } = await supabase
      .from('users')
      .update({ email, name, permitType, licensePlate })
      .eq('id', userID)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}