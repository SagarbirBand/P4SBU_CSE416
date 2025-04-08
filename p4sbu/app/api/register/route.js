// app/api/register/route.js
import { supabase } from '../../lib/db.js';
import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

export async function POST(request) {
  const { fullName, email, password, permitType, licensePlate, address } = await request.json();

  if (!fullName || !email || !password || !permitType || !licensePlate || !address)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });

  const passBcrypt = await bcrypt.hash(password, 12);
  let name = fullName;

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
      }])
      .select();
    if (error) throw error;
    if (!data || data.length === 0)
      return NextResponse.json({ error: 'User registration failed' }, { status: 500 });

    const newUser = data[0];
    console.log(newUser); // TODO: Remove when we verify this works
    const token = jwt.sign({ id: newUser.id, name: newUser.name }, JWT_SECRET, { expiresIn: '7d' });

    const res = NextResponse.json({ message: 'User registered successfully' });
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
      sameSite: 'strict',
    });

    return res;
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}
