import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../../lib/db.js';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET;

export async function POST(request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
  }

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !user) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const match = await bcrypt.compare(password, user.passBcrypt);
    if (!match) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const token = jwt.sign({ userID: user.id }, JWT_SECRET, { expiresIn: '2h' });
    delete user.passBCrypt;

    return NextResponse.json({ message: 'Login successful', token, user });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
