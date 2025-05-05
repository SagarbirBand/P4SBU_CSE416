

import { supabase } from '../../../lib/db.js';
import { NextResponse } from "next/server";

export async function DELETE(request, { params }) {
  const { userID } = params;
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userID);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}