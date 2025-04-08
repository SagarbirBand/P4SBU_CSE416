import { supabase } from '../../../lib/db.js';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { fineID } = params;
  try {
    const { data, error } = await supabase
      .from('fines')
      .select('*')
      .eq('id', fineID)
      .single();
    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { fineID } = params;
  const { paymentID } = await request.json();

  if (!paymentID) {
    return NextResponse.json({ error: 'Missing paymentID' }, { status: 400 });
  }

  try {
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('id', paymentID)
      .single();
    if (paymentError || !payment) {
      throw new Error('Payment not found');
    }
    const { data, error } = await supabase
      .from('fines')
      .update({ statusPaid: true })
      .eq('id', fineID)
      .select();
    if (error) throw error;
    return NextResponse.json({ message: 'Fine updated to paid', fine: data });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
