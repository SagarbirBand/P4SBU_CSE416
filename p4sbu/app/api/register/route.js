import { supabase } from '../../lib/db.js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const { name, email, passBCrypt, permitType, licensePlate, address } = await request.json();

  if (!name || !email || !passBCrypt || !permitType || !licensePlate || !address) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        passBCrypt,
        permitType,
        licensePlate,
        address,
        isAuth: false
      }]);
    if (error) throw error;
    return NextResponse.json(
      { message: 'User registered successfully', user: data },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
