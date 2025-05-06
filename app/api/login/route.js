// app/api/login/route.js
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { supabase } from '../lib/db.js';
import { NextResponse } from "next/server";
import { getUserFromToken } from '../lib/auth.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function PUT(request) {
  const { email, password, stayLoggedIn = false } = await request.json();

  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 });

  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    if (error || !user) return NextResponse.json({ error: 'User not found' }, { status: 401 });

    const match = await bcrypt.compare(password, user.passBcrypt);
    if (!match) return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });

    const expiresIn = stayLoggedIn ? '7d' : '2h';
    const cookieMaxAge = stayLoggedIn ? 7 * 24 * 60 * 60 : 60 * 60 * 2; // In seconds

    const token = jwt.sign({ id: user.id, name: user.name }, JWT_SECRET, { expiresIn });

    const res = NextResponse.json({ 
      message: 'Login successful', 
      user: {
      id: user.id,
      name: user.name,
      email: user.email,
      isConfirmed: user.isConfirmed,
    }});
    res.cookies.set('token', token, {
      httpOnly: true,
      secure: process.env.NEXT_PUBLIC_NODE_ENV === 'production',
      maxAge: cookieMaxAge,
      path: '/',
      sameSite: 'strict',
    });
    return res;
  } catch (err) { return NextResponse.json({ error: err.message }, { status: 500 }); }
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const includeUser = searchParams.get('includeUser') === 'true';

  const token = request.cookies.get('token')?.value;
  if (!token) return NextResponse.json({ loggedIn: false });

  const user = await getUserFromToken(token);
  if (!user) {
    const res = NextResponse.json({ loggedIn: false });
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
    });
    return res;
  }
  return includeUser ? NextResponse.json({ loggedIn: true, user }) :
                       NextResponse.json({ loggedIn: true });
}
