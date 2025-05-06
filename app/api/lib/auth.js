// lib/auth.js
import jwt from 'jsonwebtoken';
import { supabase } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET;

export async function getUserFromToken(token) {
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })
  } catch (error) {
    return null;
  }
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', payload.id)
    .single();
  if (error || !user) return null;
  return user;
}
