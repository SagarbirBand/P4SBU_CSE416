// app/api/contact/route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { name, email, message } = await request.json();
  // Process the contact form submission. In production, save to database or send an email.
  return NextResponse.json({ message: 'Your message has been received.' });
}
