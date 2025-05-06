export async function GET(req, { params }) {
  const { userID } = params;

  if (process.env.NODE_ENV !== 'k6test') {
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
  }

  await new Promise((res) => setTimeout(res, 100));

  return new Response(JSON.stringify({
    reservations: [
      { id: 201, userID, lot: 'Zone A', date: '2025-05-07', time: '9:00 AM' },
      { id: 202, userID, lot: 'Zone C', date: '2025-05-08', time: '2:00 PM' },
    ],
  }), { status: 200 });
}

  