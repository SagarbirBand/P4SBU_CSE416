import { supabase } from '../../lib/db.js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';

export async function POST(request) {
  const { fullName, email, password, permitType, licensePlate, address } = await request.json();

  if (!fullName || !email || !password || !permitType || !licensePlate || !address) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const passBcrypt = await bcrypt.hash(password, 12);
  let name = fullName

  try {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        name,
        email,
        passBcrypt,
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
