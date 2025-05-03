//const res = await fetch(`/api/users/${userID}/confirm`, {
//    method: 'PATCH'

/*
try {
  setLoading(true);
  const res = await fetch(`/api/users/${userID}/confirm`, {
    method: 'PATCH'
  });
  const data = await res.json();
  console.log(data.message); // 'User confirmed successfully.'
} catch (err) {
  console.error('Error confirming user:', err);
} finally {
  setLoading(false);
}
*/

/*import { supabase } from './db.js'; // from '../../lib/db.js';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const { userID } = params;
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ isConfirmed: true })
      .eq('id', userID)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}*/

import { supabase } from './db.js';
import { NextResponse } from "next/server";

export async function PATCH(request, props) {
  const params = await props.params;
  const { userID } = params;
  try {
    const { error } = await supabase
      .from('users')
      .update({ isConfirmed: true })
      .eq('id', userID);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}